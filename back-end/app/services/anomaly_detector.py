import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

def detect_anomalies(df: pd.DataFrame, numeric_cols: list) -> dict:
    if len(numeric_cols) < 1 or len(df) < 20:
        return {
            "anomaly_indices": [],
            "anomaly_count": 0,
            "anomaly_rows": [],
            "root_causes": [],
            "note": "Not enough data for anomaly detection (minimum 20 rows required)"
        }

    clean = df[numeric_cols].dropna()
    X = StandardScaler().fit_transform(clean)

    # Lower contamination for small datasets
    contamination = min(0.05, max(0.01, 3 / len(clean)))

    iso = IsolationForest(contamination=contamination, random_state=42)

    # DBSCAN min_samples scales with dataset size
    min_samples = max(2, len(clean) // 20)
    db = DBSCAN(eps=0.8, min_samples=min_samples)

    iso_labels = iso.fit_predict(X)
    db_labels = db.fit_predict(X)

    # Only flag if BOTH models agree it's an anomaly
    anomalies = (iso_labels == -1) & (db_labels == -1)

    # Cap at 10% of dataset max
    anomaly_indices = list(clean.index[anomalies])
    max_anomalies = max(1, len(df) // 10)
    anomaly_indices = anomaly_indices[:max_anomalies]

    # Root cause analysis
    normal_means = df.loc[~df.index.isin(anomaly_indices), numeric_cols].mean()
    normal_stds = df.loc[~df.index.isin(anomaly_indices), numeric_cols].std()

    root_causes = []
    for idx in anomaly_indices[:10]:
        row = df.loc[idx, numeric_cols]
        deviations = []
        for col in numeric_cols:
            if normal_stds[col] > 0:
                z = abs((row[col] - normal_means[col]) / normal_stds[col])
                pct_diff = ((row[col] - normal_means[col]) / abs(normal_means[col])) * 100 \
                           if normal_means[col] != 0 else 0
                deviations.append({
                    "column": col,
                    "value": round(float(row[col]), 2),
                    "normal_avg": round(float(normal_means[col]), 2),
                    "z_score": round(float(z), 2),
                    "pct_diff": round(float(pct_diff), 1)
                })
        deviations.sort(key=lambda x: x["z_score"], reverse=True)
        root_causes.append({
            "row_index": int(idx),
            "top_reasons": deviations[:3]
        })

    return {
        "anomaly_indices": anomaly_indices,
        "anomaly_count": len(anomaly_indices),
        "anomaly_rows": df.loc[anomaly_indices].to_dict("records"),
        "root_causes": root_causes
    }
