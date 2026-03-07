import pandas as pd
import numpy as np
import json

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer,)): return int(obj)
        if isinstance(obj, (np.floating,)): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)): return None
        return super().default(obj)

def compare_datasets(df1: pd.DataFrame, df2: pd.DataFrame, label1: str = "Dataset A", label2: str = "Dataset B") -> dict:
    shared_cols = list(set(df1.columns) & set(df2.columns))
    numeric_shared = [c for c in shared_cols if pd.api.types.is_numeric_dtype(df1[c]) and pd.api.types.is_numeric_dtype(df2[c])]

    # ── Overview ──────────────────────────────────────────
    overview = {
        label1: {"rows": len(df1), "columns": len(df1.columns), "cols_list": df1.columns.tolist()},
        label2: {"rows": len(df2), "columns": len(df2.columns), "cols_list": df2.columns.tolist()},
        "shared_columns": shared_cols,
        "only_in_a": list(set(df1.columns) - set(df2.columns)),
        "only_in_b": list(set(df2.columns) - set(df1.columns)),
    }

    # ── Metric Comparison ─────────────────────────────────
    metric_comparison = []
    for col in numeric_shared:
        s1 = df1[col].dropna()
        s2 = df2[col].dropna()

        mean1, mean2 = s1.mean(), s2.mean()
        total1, total2 = s1.sum(), s2.sum()

        change_pct = ((mean2 - mean1) / abs(mean1) * 100) if mean1 != 0 else 0
        total_change_pct = ((total2 - total1) / abs(total1) * 100) if total1 != 0 else 0

        metric_comparison.append({
            "column": col,
            f"{label1}_mean": round(float(mean1), 2),
            f"{label2}_mean": round(float(mean2), 2),
            f"{label1}_total": round(float(total1), 2),
            f"{label2}_total": round(float(total2), 2),
            f"{label1}_std": round(float(s1.std()), 2),
            f"{label2}_std": round(float(s2.std()), 2),
            "mean_change_pct": round(float(change_pct), 2),
            "total_change_pct": round(float(total_change_pct), 2),
            "direction": "improved" if change_pct > 0 else "declined" if change_pct < 0 else "unchanged",
            "significant": abs(change_pct) > 10,
        })

    # Sort by absolute change — most changed first
    metric_comparison.sort(key=lambda x: abs(x["mean_change_pct"]), reverse=True)

    # ── Categorical Comparison ────────────────────────────
    categorical_shared = [c for c in shared_cols if df1[c].dtype == "object" or df2[c].dtype == "object"]
    categorical_comparison = {}
    for col in categorical_shared[:5]:
        vc1 = df1[col].value_counts().head(5).to_dict() if col in df1.columns else {}
        vc2 = df2[col].value_counts().head(5).to_dict() if col in df2.columns else {}
        categorical_comparison[col] = {label1: vc1, label2: vc2}

    # ── Summary Flags ─────────────────────────────────────
    improved = [m["column"] for m in metric_comparison if m["direction"] == "improved" and m["significant"]]
    declined = [m["column"] for m in metric_comparison if m["direction"] == "declined" and m["significant"]]

    return json.loads(json.dumps({
        "label1": label1,
        "label2": label2,
        "overview": overview,
        "metric_comparison": metric_comparison,
        "categorical_comparison": categorical_comparison,
        "summary": {
            "improved_metrics": improved,
            "declined_metrics": declined,
            "total_metrics_compared": len(metric_comparison),
            "significant_changes": len(improved) + len(declined),
        }
    }, cls=NumpyEncoder))
