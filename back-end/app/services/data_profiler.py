import pandas as pd
from scipy import stats as scipy_stats

def profile_dataset(df: pd.DataFrame) -> dict:
    total_rows = len(df)
    numeric_df = df.select_dtypes("number")
    deep_stats = {}

    for col in numeric_df.columns:
        s = numeric_df[col].dropna()
        if len(s) < 3:
            continue
        q1, q3 = s.quantile(0.25), s.quantile(0.75)
        iqr = q3 - q1
        deep_stats[col] = {
            "mean": round(s.mean(), 4),
            "median": round(s.median(), 4),
            "std": round(s.std(), 4),
            "skewness": round(s.skew(), 4),
            "kurtosis": round(s.kurtosis(), 4),
            "q1": round(q1, 4),
            "q3": round(q3, 4),
            "iqr": round(iqr, 4),
            "outlier_count": int(((s < q1 - 1.5*iqr) | (s > q3 + 1.5*iqr)).sum()),
            "min": round(s.min(), 4),
            "max": round(s.max(), 4),
        }

    return {
        "total_rows": total_rows,
        "total_columns": len(df.columns),
        "duplicate_rows": int(df.duplicated().sum()),
        "missing_values": {
            col: {
                "count": int(df[col].isnull().sum()),
                "pct": round(df[col].isnull().sum() / total_rows * 100, 2)
            } for col in df.columns
        },
        "column_types": df.dtypes.astype(str).to_dict(),
        "numeric_stats": deep_stats,
        "correlations": numeric_df.corr().round(3).to_dict() if len(numeric_df.columns) > 1 else {},
        "sample_rows": df.to_dict("records"),
    }
