import pandas as pd

def classify_columns(df: pd.DataFrame) -> dict:
    profile = {
        "date_cols": [],
        "numeric_cols": [],
        "categorical_cols": [],
        "id_cols": []
    }
    for col in df.columns:
        col_lower = col.lower()
        if pd.api.types.is_datetime64_any_dtype(df[col]) or \
           any(k in col_lower for k in ["date", "time", "month", "year", "day"]):
            profile["date_cols"].append(col)
        elif pd.api.types.is_numeric_dtype(df[col]):
            if "id" in col_lower or df[col].nunique() == len(df):
                profile["id_cols"].append(col)
            else:
                profile["numeric_cols"].append(col)
        else:
            profile["categorical_cols"].append(col)
    return profile


def detect_domain(columns: list) -> dict:
    col_str = " ".join(columns).lower()

    domains = {
        "sales": ["revenue", "sales", "order", "product", "customer", "purchase", "price", "quantity", "discount"],
        "hr": ["salary", "employee", "department", "attrition", "hire", "tenure", "performance", "headcount", "leave"],
        "finance": ["expense", "budget", "profit", "loss", "cost", "invoice", "payment", "tax", "cashflow", "balance"],
        "marketing": ["clicks", "impressions", "ctr", "campaign", "conversion", "leads", "channel", "spend", "roas"],
        "inventory": ["stock", "inventory", "warehouse", "supplier", "reorder", "sku", "shipment", "lead_time"],
        "ecommerce": ["cart", "checkout", "refund", "return", "rating", "review", "delivery", "shipping"],
    }

    scores = {}
    for domain, keywords in domains.items():
        scores[domain] = sum(1 for kw in keywords if kw in col_str)

    best = max(scores, key=scores.get)
    confidence = scores[best]

    if confidence == 0:
        return {"domain": "general", "confidence": 0, "label": "General Dataset"}

    labels = {
        "sales": "Sales & Revenue",
        "hr": "Human Resources",
        "finance": "Finance & Accounting",
        "marketing": "Marketing & Campaigns",
        "inventory": "Inventory & Supply Chain",
        "ecommerce": "E-commerce",
        "general": "General Dataset"
    }

    return {
        "domain": best,
        "confidence": confidence,
        "label": labels[best]
    }


def get_domain_kpis(domain: str, df: pd.DataFrame, numeric_cols: list) -> dict:
    """Returns domain-specific smart KPI names and formulas"""
    col_lower = {c.lower(): c for c in numeric_cols}
    extra = {}

    if domain == "sales":
        rev = next((col_lower[k] for k in col_lower if "revenue" in k or "sales" in k), None)
        qty = next((col_lower[k] for k in col_lower if "quantity" in k or "qty" in k or "units" in k), None)
        disc = next((col_lower[k] for k in col_lower if "discount" in k), None)

        if rev and qty:
            extra["avg_order_value"] = round(df[rev].sum() / df[qty].sum(), 2) if df[qty].sum() > 0 else 0
        if rev and disc:
            extra["discount_impact_pct"] = round((df[disc].mean() / df[rev].mean()) * 100, 2) if df[rev].mean() > 0 else 0

    elif domain == "hr":
        sal = next((col_lower[k] for k in col_lower if "salary" in k), None)
        if sal:
            extra["salary_spread"] = round(df[sal].max() - df[sal].min(), 2)
            extra["above_avg_employees"] = int((df[sal] > df[sal].mean()).sum())

    elif domain == "finance":
        rev = next((col_lower[k] for k in col_lower if "revenue" in k or "income" in k), None)
        exp = next((col_lower[k] for k in col_lower if "expense" in k or "cost" in k), None)
        if rev and exp:
            extra["profit_margin_pct"] = round(((df[rev].sum() - df[exp].sum()) / df[rev].sum()) * 100, 2)

    elif domain == "marketing":
        clicks = next((col_lower[k] for k in col_lower if "click" in k), None)
        impr = next((col_lower[k] for k in col_lower if "impression" in k), None)
        spend = next((col_lower[k] for k in col_lower if "spend" in k or "cost" in k), None)
        conv = next((col_lower[k] for k in col_lower if "conversion" in k), None)

        if clicks and impr:
            extra["ctr_pct"] = round((df[clicks].sum() / df[impr].sum()) * 100, 3) if df[impr].sum() > 0 else 0
        if conv and clicks:
            extra["conversion_rate_pct"] = round((df[conv].sum() / df[clicks].sum()) * 100, 2) if df[clicks].sum() > 0 else 0
        if spend and conv:
            extra["cost_per_conversion"] = round(df[spend].sum() / df[conv].sum(), 2) if df[conv].sum() > 0 else 0

    return extra
