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


# ─────────────────────────────────────────────────────────────
#  ORIGINAL: 2-file comparison (unchanged)
# ─────────────────────────────────────────────────────────────
def compare_datasets(df1: pd.DataFrame, df2: pd.DataFrame, label1: str = "Dataset A", label2: str = "Dataset B") -> dict:
    shared_cols = list(set(df1.columns) & set(df2.columns))
    numeric_shared = [c for c in shared_cols if pd.api.types.is_numeric_dtype(df1[c]) and pd.api.types.is_numeric_dtype(df2[c])]

    overview = {
        label1: {"rows": len(df1), "columns": len(df1.columns), "cols_list": df1.columns.tolist()},
        label2: {"rows": len(df2), "columns": len(df2.columns), "cols_list": df2.columns.tolist()},
        "shared_columns": shared_cols,
        "only_in_a": list(set(df1.columns) - set(df2.columns)),
        "only_in_b": list(set(df2.columns) - set(df1.columns)),
    }

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

    metric_comparison.sort(key=lambda x: abs(x["mean_change_pct"]), reverse=True)

    categorical_shared = [c for c in shared_cols if df1[c].dtype == "object" or df2[c].dtype == "object"]
    categorical_comparison = {}
    for col in categorical_shared[:5]:
        vc1 = df1[col].value_counts().head(5).to_dict() if col in df1.columns else {}
        vc2 = df2[col].value_counts().head(5).to_dict() if col in df2.columns else {}
        categorical_comparison[col] = {label1: vc1, label2: vc2}

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


# ─────────────────────────────────────────────────────────────
#  HELPER: column evolution analysis
# ─────────────────────────────────────────────────────────────
def _build_column_evolution(dataframes: list, labels: list) -> dict:
    """
    Returns a rich picture of how the column schema changes across periods:
      - presence_matrix  : {col: {label: bool}}  — is this column in this period?
      - all_columns      : every column seen across all files
      - common_columns   : present in every file
      - partial_columns  : present in 2+ but not all files
      - unique_columns   : present in exactly one file
      - new_columns      : appeared after the first period (not in file 0)
      - dropped_columns  : existed in first period but gone in the last period
      - schema_stability : % of columns consistent across every file (0–100)
      - per_period_stats : {label: {total_cols, new_vs_prev, dropped_vs_prev}}
    """
    all_cols: set = set()
    col_sets: list[set] = []
    for df in dataframes:
        s = set(df.columns)
        col_sets.append(s)
        all_cols |= s

    all_cols_sorted = sorted(all_cols)

    # Presence matrix
    presence_matrix: dict = {}
    for col in all_cols_sorted:
        presence_matrix[col] = {labels[i]: (col in col_sets[i]) for i in range(len(labels))}

    # Column category buckets
    common   = [c for c in all_cols_sorted if all(c in s for s in col_sets)]
    partial  = [c for c in all_cols_sorted if 1 < sum(c in s for s in col_sets) < len(col_sets)]
    unique   = [c for c in all_cols_sorted if sum(c in s for s in col_sets) == 1]
    new_cols = [c for c in all_cols_sorted if c not in col_sets[0]]          # not in first file
    dropped  = [c for c in all_cols_sorted if c in col_sets[0] and c not in col_sets[-1]]  # in first, gone in last

    # Schema stability score
    schema_stability = round(len(common) / len(all_cols) * 100, 1) if all_cols else 100.0

    # Per-period deltas vs. previous period
    per_period_stats = []
    for i, (df, label) in enumerate(zip(dataframes, labels)):
        stat: dict = {
            "label":       label,
            "total_cols":  len(df.columns),
            "new_vs_prev": [],
            "dropped_vs_prev": [],
        }
        if i > 0:
            stat["new_vs_prev"]     = sorted(col_sets[i] - col_sets[i - 1])
            stat["dropped_vs_prev"] = sorted(col_sets[i - 1] - col_sets[i])
        per_period_stats.append(stat)

    return {
        "presence_matrix":  presence_matrix,
        "all_columns":      all_cols_sorted,
        "common_columns":   common,
        "partial_columns":  partial,
        "unique_columns":   unique,
        "new_columns":      new_cols,
        "dropped_columns":  dropped,
        "schema_stability": schema_stability,
        "per_period_stats": per_period_stats,
    }


# ─────────────────────────────────────────────────────────────
#  HELPER: partial column comparisons
# ─────────────────────────────────────────────────────────────
def _build_partial_comparisons(dataframes: list, labels: list, partial_cols: list) -> list:
    """
    For each partially-present numeric column, compute stats only for the
    periods that actually contain it. Returns a list of comparison objects.
    """
    results = []
    for col in partial_cols:
        available = [
            (labels[i], dataframes[i])
            for i in range(len(dataframes))
            if col in dataframes[i].columns
               and pd.api.types.is_numeric_dtype(dataframes[i][col])
        ]
        if len(available) < 2:
            continue  # need at least 2 data points to compare

        per_period = []
        means = []
        for lbl, df in available:
            s = df[col].dropna()
            m = round(float(s.mean()), 2)
            means.append(m)
            per_period.append({
                "label":  lbl,
                "mean":   m,
                "total":  round(float(s.sum()), 2),
                "std":    round(float(s.std()), 2),
                "count":  int(s.count()),
            })

        # Simple trend across available periods only
        overall_trend = "upward" if means[-1] > means[0] else "downward" if means[-1] < means[0] else "stable"

        results.append({
            "column":          col,
            "available_in":    [lbl for lbl, _ in available],
            "missing_in":      [labels[i] for i in range(len(labels)) if labels[i] not in [lbl for lbl, _ in available]],
            "coverage_pct":    round(len(available) / len(dataframes) * 100, 1),
            "per_period":      per_period,
            "overall_trend":   overall_trend,
            "best_period":     available[int(np.argmax(means))][0],
            "worst_period":    available[int(np.argmin(means))][0],
        })

    # Sort by coverage descending (most-present columns first)
    results.sort(key=lambda x: x["coverage_pct"], reverse=True)
    return results


# ─────────────────────────────────────────────────────────────
#  NEW: Multi-file comparison (2–10 files)
# ─────────────────────────────────────────────────────────────
def compare_multiple(
    dataframes: list,   # list[pd.DataFrame]
    labels: list        # list[str]
) -> dict:
    """
    Compare 2–10 dataframes side-by-side.

    Produces:
      - per_file          : summary stats per period
      - trend_analysis    : mean & total arrays for common columns
      - growth_rates      : period-over-period % change
      - performance       : best/worst period per column
      - column_evolution  : full schema diff — presence matrix, new/dropped/partial columns
      - partial_analysis  : stats for columns present in 2+ but not all files
      - summary           : top-level flags
    """
    if len(dataframes) < 2 or len(dataframes) > 10:
        raise ValueError("Between 2 and 10 files required.")

    # ── Column evolution (covers ALL columns across all files) ──
    col_evo = _build_column_evolution(dataframes, labels)
    common_cols  = col_evo["common_columns"]
    partial_cols = col_evo["partial_columns"]

    # ── Per-file summary (common numeric columns) ──────────────
    per_file = []
    for i, df in enumerate(dataframes):
        numeric_common = [c for c in common_cols if pd.api.types.is_numeric_dtype(df[c])]
        per_file.append({
            "label":       labels[i],
            "rows":        len(df),
            "columns":     len(df.columns),
            "means":       {c: round(float(df[c].mean()), 2) for c in numeric_common},
            "totals":      {c: round(float(df[c].sum()),  2) for c in numeric_common},
            "std":         {c: round(float(df[c].std()),  2) for c in numeric_common},
            "missing_pct": round(float(df.isnull().mean().mean() * 100), 2),
        })

    # ── Numeric common columns only ────────────────────────────
    numeric_common = [
        c for c in common_cols
        if all(pd.api.types.is_numeric_dtype(df[c]) for df in dataframes)
    ]

    # ── Trend analysis ─────────────────────────────────────────
    trend_analysis = {}
    for col in numeric_common:
        trend_analysis[col] = {
            "means":  [round(float(df[col].mean()), 2) for df in dataframes],
            "totals": [round(float(df[col].sum()),  2) for df in dataframes],
        }

    # ── YoY growth ─────────────────────────────────────────────
    growth_rates = {}
    for col in numeric_common:
        means = trend_analysis[col]["means"]
        growth_rates[col] = []
        for i in range(1, len(means)):
            prev = means[i - 1]
            pct  = round((means[i] - prev) / abs(prev) * 100, 2) if prev != 0 else None
            growth_rates[col].append({
                "from":       labels[i - 1],
                "to":         labels[i],
                "growth_pct": pct,
                "direction":  (
                    "improved" if (pct or 0) > 0
                    else "declined" if (pct or 0) < 0
                    else "unchanged"
                ),
            })

    # ── Best / worst period ────────────────────────────────────
    performance = {}
    for col in numeric_common:
        means = trend_analysis[col]["means"]
        total_growth = (
            round((means[-1] - means[0]) / abs(means[0]) * 100, 2)
            if means[0] != 0 else None
        )
        performance[col] = {
            "best":             labels[int(np.argmax(means))],
            "worst":            labels[int(np.argmin(means))],
            "overall_trend":    "upward" if means[-1] > means[0] else "downward",
            "total_growth_pct": total_growth,
        }

    # ── Partial column comparisons ─────────────────────────────
    partial_analysis = _build_partial_comparisons(dataframes, labels, partial_cols)

    # ── Summary flags ──────────────────────────────────────────
    improved = [c for c in numeric_common if performance[c]["overall_trend"] == "upward"]
    declined = [c for c in numeric_common if performance[c]["overall_trend"] == "downward"]

    return json.loads(json.dumps({
        "labels":           labels,
        "file_count":       len(dataframes),
        "common_columns":   numeric_common,
        "per_file":         per_file,
        "trend_analysis":   trend_analysis,
        "growth_rates":     growth_rates,
        "performance":      performance,
        "column_evolution": col_evo,
        "partial_analysis": partial_analysis,
        "summary": {
            "improved_metrics":       improved,
            "declined_metrics":       declined,
            "total_metrics_compared": len(numeric_common),
            "schema_stability":       col_evo["schema_stability"],
            "partial_columns_count":  len(partial_cols),
            "unique_columns_count":   len(col_evo["unique_columns"]),
        },
    }, cls=NumpyEncoder))
