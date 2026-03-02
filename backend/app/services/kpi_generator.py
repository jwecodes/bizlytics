import pandas as pd

def generate_kpis(df: pd.DataFrame, numeric_cols: list, date_cols: list) -> dict:
    kpis = {}
    for col in numeric_cols:
        s = df[col].dropna()
        kpi = {
            "total": round(s.sum(), 2),
            "average": round(s.mean(), 2),
            "max": round(s.max(), 2),
            "min": round(s.min(), 2),
        }
        if date_cols:
            sorted_df = df.sort_values(date_cols[0])
            s_sorted = sorted_df[col].dropna()
            if len(s_sorted) >= 2:
                first, last = s_sorted.iloc[0], s_sorted.iloc[-1]
                kpi["growth_rate_pct"] = round((last - first) / abs(first) * 100, 2) if first != 0 else 0
                kpi["trend"] = "up" if last > first else "down"
        kpis[col] = kpi
    return kpis
