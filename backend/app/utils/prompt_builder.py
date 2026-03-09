import json
import numpy as np


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
            return None
        return super().default(obj)


def safe_json(obj, limit: int = 3000) -> str:
    return json.dumps(obj, cls=NumpyEncoder)[:limit]


def _summarize_kpis(kpis: dict) -> str:
    """Build a concise KPI summary string instead of raw JSON dump."""
    lines = []
    for col, data in kpis.items():
        if col == "_domain_kpis":
            continue
        if isinstance(data, dict):
            trend = data.get("trend", "")
            total = data.get("total", "")
            avg = data.get("average", "")
            growth = data.get("growth_rate", "")
            lines.append(
                f"  - {col}: total={total}, avg={avg}, "
                f"growth={growth}%, trend={trend}"
            )
    domain_kpis = kpis.get("_domain_kpis", {})
    if domain_kpis:
        lines.append("  Domain-specific KPIs:")
        for k, v in domain_kpis.items():
            lines.append(f"    - {k.replace('_', ' ')}: {v}")
    return "\n".join(lines) if lines else safe_json(kpis, 1500)


def _summarize_anomalies(anomalies: dict) -> str:
    count = anomalies.get("anomaly_count", 0)
    if count == 0:
        return "  No anomalies detected."
    causes = anomalies.get("root_causes", [])[:3]
    lines = [f"  {count} anomalies detected."]
    for rc in causes:
        row = rc.get("row_index", "?")
        reasons = rc.get("top_reasons", [])
        if reasons:
            top = reasons[0]
            lines.append(
                f"  - Row {row}: {top.get('column', '?')} = {top.get('value', '?')} "
                f"({top.get('pct_diff', '?')}% from normal avg {top.get('normal_avg', '?')})"
            )
    return "\n".join(lines)


def _summarize_profile(profile: dict) -> str:
    rows = profile.get("total_rows", "?")
    cols = profile.get("total_columns", "?")
    missing = profile.get("missing_pct", "?")
    quality = profile.get("quality_score", "?")
    duplicates = profile.get("duplicate_rows", 0)
    return (
        f"  Rows: {rows} | Columns: {cols} | "
        f"Missing: {missing}% | Quality score: {quality}/100 | "
        f"Duplicates: {duplicates}"
    )


def build_insight_prompt(profile: dict, kpis: dict, anomalies: dict, ml: dict) -> str:
    segment_info = ""
    if ml.get("segment_count"):
        segment_info = f"  {ml['segment_count']} customer segments identified via K-Means clustering."
    if ml.get("silhouette_score"):
        segment_info += f" Silhouette score: {ml['silhouette_score']:.2f} (>0.5 = good separation)."

    return f"""You are a senior business analyst. Analyze the following dataset report and return a JSON object.

DATASET PROFILE:
{_summarize_profile(profile)}

KEY PERFORMANCE INDICATORS:
{_summarize_kpis(kpis)}

ANOMALY DETECTION:
{_summarize_anomalies(anomalies)}

ML SEGMENTATION:
{segment_info or "  Not available."}

INSTRUCTIONS:
- Base ALL statements strictly on the numbers above
- Trends and risks must reference actual KPI values
- Recommendations must be specific and actionable (not generic)
- Keep each description under 2 sentences
- Do not hallucinate metrics not present above

Return ONLY a valid JSON object with this exact structure (no extra text):
{{
  "executive_summary": "2-3 sentence overview referencing actual numbers",
  "trends": [
    {{"title": "", "description": "", "sentiment": "positive|neutral|negative"}}
  ],
  "risks": [
    {{"title": "", "description": "", "impact": "high|medium|low"}}
  ],
  "opportunities": [
    {{"title": "", "description": ""}}
  ],
  "anomaly_explanations": [
    {{"index": 0, "reason": "", "action": ""}}
  ],
  "recommendations": [
    {{"action": "", "outcome": "", "priority": "high|medium|low"}}
  ]
}}"""


def build_chat_prompt(question: str, columns: list, sample_rows: list, kpis: dict) -> str:
    col_list = ", ".join(columns[:30])
    sample_str = safe_json(sample_rows[:5], 2000)
    kpi_str = _summarize_kpis(kpis)

    return f"""You are a data analyst assistant. Answer the user's question about their dataset.

DATASET COLUMNS: {col_list}

SAMPLE DATA (first 5 rows):
{sample_str}

KEY METRICS:
{kpi_str}

USER QUESTION: {question}

INSTRUCTIONS:
- Answer directly and concisely
- Reference specific column names and numbers from the data
- If you cannot answer from the available data, say so clearly
- For aggregation questions, explain your reasoning
- Keep response under 150 words"""
