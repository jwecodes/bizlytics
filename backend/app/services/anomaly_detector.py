import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler


# ── Helpers ────────────────────────────────────────────────────────────────

def _safe_pct_diff(value: float, mean: float) -> float:
    if mean == 0:
        return 0.0
    return round(((value - mean) / abs(mean)) * 100, 1)


def _numeric_anomalies(df: pd.DataFrame, numeric_cols: list) -> set:
    """Isolation Forest + DBSCAN consensus on numeric columns."""
    clean = df[numeric_cols].dropna()
    if len(clean) < 20:
        return set()

    X = StandardScaler().fit_transform(clean)
    contamination = min(0.05, max(0.01, 3 / len(clean)))
    min_samples = max(2, len(clean) // 20)

    iso_labels = IsolationForest(
        contamination=contamination, random_state=42, n_estimators=100
    ).fit_predict(X)

    db_labels = DBSCAN(eps=0.8, min_samples=min_samples).fit_predict(X)

    # Both models must agree
    flagged = set(clean.index[(iso_labels == -1) & (db_labels == -1)])
    return flagged


def _group_aware_numeric_anomalies(
    df: pd.DataFrame, numeric_cols: list, categorical_cols: list
) -> set:
    """
    Flag rows where a numeric value is anomalous WITHIN its category group.
    e.g. ₹50,000 for 'Stationery' is flagged even if normal for 'Electronics'.
    """
    flagged = set()
    if not categorical_cols or not numeric_cols:
        return flagged

    # Use the categorical column with the best group size (enough rows per group)
    best_cat = None
    best_min_group = 0
    for cat in categorical_cols:
        counts = df[cat].value_counts()
        min_group = counts[counts >= 10].count()
        if min_group > best_min_group:
            best_min_group = min_group
            best_cat = cat

    if best_cat is None or best_min_group < 2:
        return flagged

    for group_val, group_df in df.groupby(best_cat):
        if len(group_df) < 10:
            continue
        for col in numeric_cols:
            col_data = group_df[col].dropna()
            if len(col_data) < 5:
                continue
            mean = col_data.mean()
            std = col_data.std()
            if std == 0:
                continue
            z_scores = ((group_df[col] - mean) / std).abs()
            # Flag rows with z > 3.5 within their group
            group_flagged = group_df.index[z_scores > 3.5]
            flagged.update(group_flagged)

    return flagged


def _categorical_anomalies(df: pd.DataFrame, categorical_cols: list) -> dict:
    """
    Detect two types of categorical anomalies:
    1. Rare categories — values that appear in < 1% of rows
    2. Unusual co-occurrences — combinations of categories that rarely appear together
    Returns: { row_index: [reason_strings] }
    """
    cat_flags: dict[int, list] = {}

    for col in categorical_cols:
        if df[col].nunique() < 2 or df[col].nunique() > 100:
            continue

        freq = df[col].value_counts(normalize=True)
        rare_threshold = max(0.01, 1 / len(df))  # at most 1% or 1 row

        for idx, val in df[col].items():
            if pd.isna(val):
                continue
            val_freq = freq.get(val, 0)
            if val_freq <= rare_threshold:
                if idx not in cat_flags:
                    cat_flags[idx] = []
                cat_flags[idx].append({
                    "column": col,
                    "value": str(val),
                    "frequency_pct": round(val_freq * 100, 2),
                    "reason": f"Rare value '{val}' appears in only {round(val_freq * 100, 2)}% of rows"
                })

    # Co-occurrence check for pairs of categorical columns
    if len(categorical_cols) >= 2:
        for i in range(min(3, len(categorical_cols))):
            for j in range(i + 1, min(4, len(categorical_cols))):
                col_a = categorical_cols[i]
                col_b = categorical_cols[j]
                if df[col_a].nunique() > 50 or df[col_b].nunique() > 50:
                    continue
                pair_counts = df.groupby([col_a, col_b]).size()
                pair_freq = pair_counts / len(df)
                rare_pairs = pair_freq[pair_freq <= 0.005].index.tolist()

                for idx, row in df.iterrows():
                    val_a = row.get(col_a)
                    val_b = row.get(col_b)
                    if pd.isna(val_a) or pd.isna(val_b):
                        continue
                    if (val_a, val_b) in rare_pairs:
                        if idx not in cat_flags:
                            cat_flags[idx] = []
                        cat_flags[idx].append({
                            "column": f"{col_a} + {col_b}",
                            "value": f"{val_a} & {val_b}",
                            "frequency_pct": round(
                                pair_freq.get((val_a, val_b), 0) * 100, 3
                            ),
                            "reason": (
                                f"Unusual combination: '{val_a}' with '{val_b}' "
                                f"appears in <0.5% of rows"
                            )
                        })

    return cat_flags


def _build_root_cause(
    idx: int,
    df: pd.DataFrame,
    numeric_cols: list,
    categorical_cols: list,
    normal_means: pd.Series,
    normal_stds: pd.Series,
    cat_flags: dict,
) -> dict:
    """Build a rich root cause explanation for a single anomalous row."""
    reasons = []

    # Numeric deviations
    for col in numeric_cols:
        try:
            val = df.loc[idx, col]
            if pd.isna(val) or normal_stds.get(col, 0) == 0:
                continue
            z = abs((val - normal_means[col]) / normal_stds[col])
            reasons.append({
                "type": "numeric",
                "column": col,
                "value": round(float(val), 2),
                "normal_avg": round(float(normal_means[col]), 2),
                "z_score": round(float(z), 2),
                "pct_diff": _safe_pct_diff(float(val), float(normal_means[col])),
            })
        except Exception:
            continue

    reasons.sort(key=lambda x: x.get("z_score", 0), reverse=True)
    top_numeric = reasons[:3]

    # Categorical reasons
    top_categorical = []
    if idx in cat_flags:
        for flag in cat_flags[idx][:2]:
            top_categorical.append({
                "type": "categorical",
                "column": flag["column"],
                "value": flag["value"],
                "normal_avg": "N/A",
                "z_score": None,
                "pct_diff": None,
                "reason": flag["reason"],
            })

    return {
        "row_index": int(idx),
        "anomaly_types": list({
            r["type"] for r in (top_numeric + top_categorical)
        }),
        "top_reasons": (top_numeric + top_categorical)[:4],
    }


# ── Main entry point ───────────────────────────────────────────────────────

def detect_anomalies(df: pd.DataFrame, numeric_cols: list) -> dict:
    # Get categorical cols from df (anything not numeric and not date)
    categorical_cols = [
        c for c in df.columns
        if c not in numeric_cols
        and df[c].dtype == object
        and df[c].nunique() <= 100
        and df[c].nunique() >= 2
    ]

    # Minimum data check
    if len(df) < 20:
        return {
            "anomaly_indices": [],
            "anomaly_count": 0,
            "anomaly_rows": [],
            "root_causes": [],
            "note": "Not enough data for anomaly detection (minimum 20 rows required)"
        }

    # ── Run all detection methods ──────────────────────────────────────────
    numeric_flagged: set = set()
    group_flagged: set = set()
    cat_flags: dict = {}

    if len(numeric_cols) >= 1:
        numeric_flagged = _numeric_anomalies(df, numeric_cols)
        if categorical_cols:
            group_flagged = _group_aware_numeric_anomalies(df, numeric_cols, categorical_cols)

    if categorical_cols:
        cat_flags = _categorical_anomalies(df, categorical_cols)

    # ── Scoring: each method that flags a row adds to its score ───────────
    score: dict[int, int] = {}

    for idx in numeric_flagged:
        score[idx] = score.get(idx, 0) + 2  # numeric consensus = weight 2

    for idx in group_flagged:
        score[idx] = score.get(idx, 0) + 2  # group-aware = weight 2

    for idx in cat_flags:
        score[idx] = score.get(idx, 0) + 1  # categorical = weight 1

    # ── Final anomaly list ─────────────────────────────────────────────────
    # Threshold: score >= 2 (must be flagged by at least numeric consensus OR
    # group-aware detection, OR two separate categorical signals)
    anomaly_indices = [idx for idx, s in score.items() if s >= 2]

    # Cap at 10% of dataset
    max_anomalies = max(1, len(df) // 10)
    anomaly_indices = sorted(anomaly_indices, key=lambda i: score[i], reverse=True)
    anomaly_indices = anomaly_indices[:max_anomalies]

    # ── Root cause analysis ────────────────────────────────────────────────
    valid_numeric = [c for c in numeric_cols if c in df.columns]
    normal_mask = ~df.index.isin(anomaly_indices)
    normal_means = df.loc[normal_mask, valid_numeric].mean() if valid_numeric else pd.Series()
    normal_stds  = df.loc[normal_mask, valid_numeric].std()  if valid_numeric else pd.Series()

    root_causes = []
    for idx in anomaly_indices[:10]:
        try:
            rc = _build_root_cause(
                idx, df, valid_numeric, categorical_cols,
                normal_means, normal_stds, cat_flags
            )
            root_causes.append(rc)
        except Exception:
            continue

    # ── Categorical-only anomaly summary ──────────────────────────────────
    # Light-weight summary for rows with ONLY categorical flags (score == 1)
    # These are surfaced separately so they don't inflate the main count
    soft_flags = [
        {
            "row_index": int(idx),
            "reasons": [f["reason"] for f in flags[:2]],
        }
        for idx, flags in cat_flags.items()
        if idx not in anomaly_indices and flags
    ][:20]  # cap at 20

    return {
        "anomaly_indices": [int(i) for i in anomaly_indices],
        "anomaly_count": len(anomaly_indices),
        "anomaly_rows": df.loc[anomaly_indices].to_dict("records"),
        "root_causes": root_causes,
        "soft_categorical_flags": soft_flags,
        "detection_summary": {
            "numeric_consensus_flagged": len(numeric_flagged),
            "group_aware_flagged": len(group_flagged),
            "categorical_flagged": len(cat_flags),
            "final_after_scoring": len(anomaly_indices),
        }
    }
