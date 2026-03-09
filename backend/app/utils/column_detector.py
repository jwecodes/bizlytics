import pandas as pd
import re
from difflib import SequenceMatcher

# ── Abbreviation expansion map ─────────────────────────────────────────────
# Catches short/abbreviated column names before keyword matching
ABBREVIATIONS = {
    "rev": "revenue", "revs": "revenue", "rev_total": "revenue",
    "sal": "salary", "salaries": "salary", "comp": "salary", "ctc": "salary",
    "qty": "quantity", "q": "quantity", "units": "quantity", "vol": "quantity",
    "amt": "amount", "amnt": "amount",
    "prc": "price", "prc_unit": "price", "unit_prc": "price",
    "disc": "discount", "dsc": "discount",
    "dept": "department", "dpt": "department", "div": "department",
    "emp": "employee", "empl": "employee", "hc": "headcount",
    "mgr": "manager", "mngr": "manager",
    "exp": "expense", "expns": "expense", "cst": "cost",
    "prof": "profit", "pnl": "profit", "pl": "profit",
    "conv": "conversion", "cvr": "conversion", "cvt": "conversion",
    "impr": "impressions", "imp": "impressions",
    "clk": "clicks", "clks": "clicks",
    "ord": "order", "ordr": "order",
    "cust": "customer", "cstmr": "customer", "cli": "customer",
    "inv": "invoice", "invs": "inventory",
    "stk": "stock", "st": "stock",
    "shp": "shipment", "dlv": "delivery",
    "dt": "date", "ts": "timestamp",
    "yr": "year", "mth": "month", "wk": "week",
    "attr": "attrition", "churn": "attrition", "resign": "attrition",
    "dep_emp": "attrition", "emp_departure": "attrition", "left": "attrition",
    "perf": "performance", "rtg": "rating", "scr": "score",
    "bgt": "budget", "bdgt": "budget",
    "tx": "tax", "vat": "tax",
    "ret": "return", "rtn": "return",
    "ref": "refund", "rfnd": "refund",
    "spnd": "spend", "mktg_cost": "spend",
    "roas": "roas", "roi": "roi",
    "sku": "sku", "pid": "product",
    "wh": "warehouse", "whs": "warehouse",
    "lead_t": "lead_time", "lt": "lead_time",
    "reord": "reorder",
}

# ── Domain keyword map ─────────────────────────────────────────────────────
DOMAIN_KEYWORDS = {
    "sales": [
        "revenue", "sales", "order", "orders", "product", "products",
        "customer", "customers", "purchase", "price", "quantity", "discount",
        "amount", "total", "invoice", "deal", "opportunity", "pipeline",
        "upsell", "cross_sell", "margin", "aov", "ltv", "arr", "mrr",
        "transaction", "sold", "unit", "billing", "churn", "renewal",
    ],
    "hr": [
        "salary", "employee", "department", "attrition", "hire", "hired",
        "tenure", "performance", "headcount", "leave", "absent", "absence",
        "promotion", "training", "bonus", "compensation", "payroll",
        "manager", "team", "gender", "age", "experience", "role",
        "job", "position", "level", "band", "grade", "resignation",
        "termination", "onboarding", "offboarding", "satisfaction",
    ],
    "finance": [
        "expense", "budget", "profit", "loss", "cost", "invoice", "payment",
        "tax", "cashflow", "balance", "asset", "liability", "equity",
        "income", "earnings", "ebitda", "ebit", "gross", "net",
        "receivable", "payable", "depreciation", "amortization",
        "forecast", "variance", "audit", "fiscal", "quarter",
    ],
    "marketing": [
        "clicks", "impressions", "ctr", "campaign", "conversion",
        "leads", "channel", "spend", "roas", "roi", "email", "sms",
        "open_rate", "bounce", "subscriber", "engagement", "reach",
        "frequency", "cpm", "cpc", "cpa", "keyword", "ad", "creative",
        "landing", "funnel", "acquisition", "retention", "cohort",
    ],
    "inventory": [
        "stock", "inventory", "warehouse", "supplier", "reorder", "sku",
        "shipment", "lead_time", "backorder", "fulfillment", "logistics",
        "procurement", "purchase_order", "bin", "location", "storage",
        "quantity_on_hand", "turnover", "days_supply", "expiry",
    ],
    "ecommerce": [
        "cart", "checkout", "refund", "return", "rating", "review",
        "delivery", "shipping", "tracking", "marketplace", "seller",
        "buyer", "wishlist", "browse", "session", "page_view",
        "add_to_cart", "abandoned", "coupon", "voucher", "gmv",
    ],
}

DOMAIN_LABELS = {
    "sales":     "Sales & Revenue",
    "hr":        "Human Resources",
    "finance":   "Finance & Accounting",
    "marketing": "Marketing & Campaigns",
    "inventory": "Inventory & Supply Chain",
    "ecommerce": "E-commerce",
    "general":   "General Dataset",
}

DATE_KEYWORDS = [
    "date", "time", "month", "year", "day", "week", "quarter",
    "timestamp", "created", "updated", "modified", "at", "on",
    "start", "end", "period", "dt", "ts", "dob", "birth",
]

ID_PATTERNS = re.compile(
    r'^(id|_id|.*_id|.*id_.*|uuid|guid|key|code|ref|no|num|number|index|idx|serial)$',
    re.IGNORECASE
)


def _normalize_col(col: str) -> str:
    """Lowercase, strip, replace separators, expand abbreviations."""
    normalized = col.lower().strip()
    normalized = re.sub(r'[\s\-\.]+', '_', normalized)  # spaces/hyphens/dots → _
    # Try full name expansion first
    if normalized in ABBREVIATIONS:
        return ABBREVIATIONS[normalized]
    # Try expanding each part of a compound name
    parts = normalized.split('_')
    expanded = [ABBREVIATIONS.get(p, p) for p in parts]
    return '_'.join(expanded)


def _fuzzy_match(word: str, keyword: str, threshold: float = 0.82) -> bool:
    """Returns True if word is similar enough to keyword."""
    if keyword in word or word in keyword:
        return True
    return SequenceMatcher(None, word, keyword).ratio() >= threshold


def _col_matches_keywords(col: str, keywords: list) -> int:
    """Score how many keywords match this column name."""
    normalized = _normalize_col(col)
    parts = set(normalized.split('_') + [normalized])
    score = 0
    for kw in keywords:
        kw_parts = kw.split('_')
        # Exact or substring match
        if kw in normalized or normalized in kw:
            score += 2
            continue
        # Part-level match
        if any(kw in p or p in kw for p in parts):
            score += 1
            continue
        # Fuzzy match (handles typos, slight variations)
        if any(_fuzzy_match(p, kw) for p in parts if len(p) > 3):
            score += 1
    return score


def classify_columns(df: pd.DataFrame) -> dict:
    profile = {
        "date_cols": [],
        "numeric_cols": [],
        "categorical_cols": [],
        "id_cols": [],
    }

    for col in df.columns:
        col_lower = col.lower().strip()
        normalized = _normalize_col(col)
        series = df[col]

        # ── Date detection ──────────────────────────────────────────────
        if pd.api.types.is_datetime64_any_dtype(series):
            profile["date_cols"].append(col)
            continue

        # Try parsing as date if it's object/string dtype
        if series.dtype == object:
            try:
                parsed = pd.to_datetime(series.dropna().head(20), infer_datetime_format=True, errors='coerce')
                if parsed.notna().sum() >= min(10, len(parsed)):
                    profile["date_cols"].append(col)
                    continue
            except Exception:
                pass

        # Keyword-based date detection
        if any(kw in normalized for kw in DATE_KEYWORDS):
            profile["date_cols"].append(col)
            continue

        # ── Numeric detection ────────────────────────────────────────────
        if pd.api.types.is_numeric_dtype(series):
            # ID-like columns
            if ID_PATTERNS.match(col_lower) or ID_PATTERNS.match(normalized):
                profile["id_cols"].append(col)
                continue
            # High-cardinality integer = likely an ID
            if pd.api.types.is_integer_dtype(series) and series.nunique() == len(series):
                profile["id_cols"].append(col)
                continue
            # Low-cardinality numeric = treat as categorical (e.g. encoded flags)
            if series.nunique() <= 2 and set(series.dropna().unique()).issubset({0, 1}):
                profile["categorical_cols"].append(col)
                continue
            profile["numeric_cols"].append(col)
            continue

        # ── Categorical fallback ─────────────────────────────────────────
        profile["categorical_cols"].append(col)

    return profile


def detect_domain(columns: list) -> dict:
    scores = {domain: 0 for domain in DOMAIN_KEYWORDS}

    for col in columns:
        for domain, keywords in DOMAIN_KEYWORDS.items():
            scores[domain] += _col_matches_keywords(col, keywords)

    best = max(scores, key=scores.get)
    confidence = scores[best]

    # Tie-breaking: if top two domains are very close, pick by secondary score
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    if len(sorted_scores) >= 2 and sorted_scores[1][1] >= sorted_scores[0][1] * 0.85:
        # Give slight preference to more specific domains
        specificity_order = ["ecommerce", "inventory", "marketing", "hr", "finance", "sales"]
        for domain in specificity_order:
            if scores[domain] == confidence:
                best = domain
                break

    if confidence == 0:
        return {"domain": "general", "confidence": 0, "label": DOMAIN_LABELS["general"]}

    return {
        "domain": best,
        "confidence": confidence,
        "label": DOMAIN_LABELS.get(best, "General Dataset"),
        "all_scores": scores,  # useful for debugging misclassifications
    }


def _find_col(col_lower_map: dict, *patterns) -> str | None:
    """Find first column matching any of the given patterns."""
    for pattern in patterns:
        # Exact match first
        if pattern in col_lower_map:
            return col_lower_map[pattern]
        # Substring match on normalized names
        for col_lower, original in col_lower_map.items():
            normalized = _normalize_col(col_lower)
            if pattern in normalized or pattern in col_lower:
                return original
        # Fuzzy match as last resort
        for col_lower, original in col_lower_map.items():
            normalized = _normalize_col(col_lower)
            parts = normalized.split('_') + [normalized]
            if any(_fuzzy_match(p, pattern) for p in parts if len(p) > 3):
                return original
    return None


def get_domain_kpis(domain: str, df: pd.DataFrame, numeric_cols: list) -> dict:
    col_map = {c.lower(): c for c in numeric_cols}
    extra = {}

    if domain == "sales":
        rev = _find_col(col_map, "revenue", "sales", "total", "amount", "turnover", "billing")
        qty = _find_col(col_map, "quantity", "qty", "units", "vol", "sold", "items")
        disc = _find_col(col_map, "discount", "disc", "dsc", "reduction")
        price = _find_col(col_map, "price", "rate", "unit_price", "prc")

        if rev:
            extra["total_revenue"] = round(float(df[rev].sum()), 2)
        if rev and qty and df[qty].sum() > 0:
            extra["avg_order_value"] = round(float(df[rev].sum() / df[qty].sum()), 2)
        if disc and rev and df[rev].mean() > 0:
            extra["discount_impact_pct"] = round(float((df[disc].mean() / df[rev].mean()) * 100), 2)
        if price and qty:
            extra["revenue_potential"] = round(float(df[price].mean() * df[qty].sum()), 2)

    elif domain == "hr":
        sal = _find_col(col_map, "salary", "sal", "compensation", "ctc", "pay", "wage", "comp")
        perf = _find_col(col_map, "performance", "perf", "score", "rating", "appraisal")
        tenure = _find_col(col_map, "tenure", "experience", "years", "seniority")

        if sal:
            extra["avg_salary"] = round(float(df[sal].mean()), 2)
            extra["salary_spread"] = round(float(df[sal].max() - df[sal].min()), 2)
            extra["above_avg_employees"] = int((df[sal] > df[sal].mean()).sum())
        if perf:
            extra["avg_performance_score"] = round(float(df[perf].mean()), 2)
        if tenure:
            extra["avg_tenure_years"] = round(float(df[tenure].mean()), 2)

        # Attrition rate from categorical columns (check all df columns not just numeric)
        all_cols_lower = {c.lower(): c for c in df.columns}
        attr_col_key = next(
            (k for k in all_cols_lower if any(
                kw in _normalize_col(k)
                for kw in ["attrition", "churn", "left", "resigned", "terminated", "departure", "turnover"]
            )), None
        )
        if attr_col_key:
            attr_col = all_cols_lower[attr_col_key]
            col_vals = df[attr_col].astype(str).str.lower()
            attrition_count = col_vals.isin(["yes", "1", "true", "left", "resigned"]).sum()
            if len(df) > 0:
                extra["attrition_rate_pct"] = round(float(attrition_count / len(df) * 100), 2)

    elif domain == "finance":
        rev = _find_col(col_map, "revenue", "income", "earnings", "turnover", "sales")
        exp = _find_col(col_map, "expense", "cost", "expenditure", "spending", "outflow")
        profit = _find_col(col_map, "profit", "net_income", "ebit", "ebitda", "margin")
        budget = _find_col(col_map, "budget", "bgt", "planned", "forecast")

        if rev and exp:
            total_rev = df[rev].sum()
            total_exp = df[exp].sum()
            if total_rev > 0:
                extra["profit_margin_pct"] = round(float(((total_rev - total_exp) / total_rev) * 100), 2)
            extra["expense_ratio_pct"] = round(float((total_exp / total_rev) * 100), 2) if total_rev > 0 else 0
        if budget and rev:
            actual = df[rev].sum()
            planned = df[budget].sum()
            if planned > 0:
                extra["budget_variance_pct"] = round(float(((actual - planned) / planned) * 100), 2)
        if profit:
            extra["total_profit"] = round(float(df[profit].sum()), 2)

    elif domain == "marketing":
        clicks = _find_col(col_map, "clicks", "clk", "click")
        impr = _find_col(col_map, "impressions", "impr", "views", "reach")
        spend = _find_col(col_map, "spend", "cost", "budget", "investment", "spnd")
        conv = _find_col(col_map, "conversions", "conversion", "leads", "signups", "purchases")
        revenue = _find_col(col_map, "revenue", "sales", "return")

        if clicks and impr and df[impr].sum() > 0:
            extra["ctr_pct"] = round(float((df[clicks].sum() / df[impr].sum()) * 100), 3)
        if conv and clicks and df[clicks].sum() > 0:
            extra["conversion_rate_pct"] = round(float((df[conv].sum() / df[clicks].sum()) * 100), 2)
        if spend and conv and df[conv].sum() > 0:
            extra["cost_per_conversion"] = round(float(df[spend].sum() / df[conv].sum()), 2)
        if revenue and spend and df[spend].sum() > 0:
            extra["roas"] = round(float(df[revenue].sum() / df[spend].sum()), 2)
        if spend:
            extra["total_spend"] = round(float(df[spend].sum()), 2)

    elif domain == "inventory":
        stock = _find_col(col_map, "stock", "quantity", "on_hand", "available", "qty")
        reorder = _find_col(col_map, "reorder", "reorder_point", "min_stock", "threshold")
        lead = _find_col(col_map, "lead_time", "lead", "days", "supply_days")
        cost = _find_col(col_map, "cost", "price", "value", "unit_cost")

        if stock:
            extra["total_stock_units"] = int(df[stock].sum())
            extra["avg_stock_level"] = round(float(df[stock].mean()), 2)
        if reorder and stock:
            below_reorder = (df[stock] <= df[reorder]).sum() if reorder in df.columns else 0
            extra["items_below_reorder_point"] = int(below_reorder)
        if lead:
            extra["avg_lead_time_days"] = round(float(df[lead].mean()), 2)
        if cost and stock:
            extra["total_inventory_value"] = round(float((df[cost] * df[stock]).sum()), 2)

    elif domain == "ecommerce":
        rev = _find_col(col_map, "revenue", "sales", "gmv", "order_value", "amount")
        rating = _find_col(col_map, "rating", "score", "stars", "review_score")
        qty = _find_col(col_map, "quantity", "items", "units", "qty")
        ret = _find_col(col_map, "return", "refund", "returned")

        if rev:
            extra["total_gmv"] = round(float(df[rev].sum()), 2)
            extra["avg_order_value"] = round(float(df[rev].mean()), 2)
        if rating:
            extra["avg_rating"] = round(float(df[rating].mean()), 2)
            extra["pct_high_rated"] = round(float((df[rating] >= 4).sum() / len(df) * 100), 2)
        if ret and rev:
            refund_rate = df[ret].sum() / df[rev].sum() * 100 if df[rev].sum() > 0 else 0
            extra["refund_rate_pct"] = round(float(refund_rate), 2)

    return extra
