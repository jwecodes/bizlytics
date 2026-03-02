import json
import numpy as np
from app.core.llm_provider import get_llm_response
from app.utils.prompt_builder import build_insight_prompt

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer,)): return int(obj)
        if isinstance(obj, (np.floating,)): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)): return None
        return super().default(obj)

def generate_insights(profile: dict, kpis: dict, anomalies: dict, ml: dict) -> dict:
    prompt = build_insight_prompt(profile, kpis, anomalies, ml)
    raw = get_llm_response(prompt)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Try to extract JSON from response if LLM added extra text
        try:
            start = raw.index("{")
            end = raw.rindex("}") + 1
            return json.loads(raw[start:end])
        except Exception:
            return {
                "executive_summary": "Analysis complete. Unable to parse structured insights.",
                "trends": [],
                "risks": [],
                "opportunities": [],
                "anomaly_explanations": [],
                "recommendations": [],
                "error": "LLM response parse failed",
                "raw": raw[:500]
            }

def generate_data_story(profile: dict, kpis: dict, anomalies: dict, insights: dict) -> str:
    prompt = f"""
You are a senior business analyst writing a detailed professional report for a CEO.

STRICT RULES:
- Write ONLY plain paragraphs of text — no JSON, no bullet points, no headers
- Write EXACTLY 5 paragraphs, each at least 5-6 sentences long
- Be highly analytical — explain what the numbers mean for the business
- Discuss trends, risks, opportunities, and recommendations in depth
- Even if the dataset is small, extract maximum meaning from every data point
- Use specific numbers from the data throughout

Data summary:
- Total rows: {profile.get('total_rows')}
- Columns: {list(profile.get('column_types', {}).keys())}
- KPIs: {json.dumps(kpis, cls=NumpyEncoder)[:1500]}
- Anomalies found: {anomalies.get('anomaly_count', 0)}
- Key findings: {json.dumps(insights, cls=NumpyEncoder)[:2000]}

Paragraph 1: Overview of the dataset and what business it represents
Paragraph 2: Deep dive into the key metrics and what they reveal
Paragraph 3: Analysis of trends, patterns and correlations found
Paragraph 4: Risks identified and their potential business impact
Paragraph 5: Strategic recommendations and opportunities going forward

Write all 5 paragraphs now as plain flowing text only:
"""
    raw = get_llm_response(prompt)

    raw = raw.strip()
    if raw.startswith("{") or raw.startswith("["):
        try:
            parsed = json.loads(raw)
            def extract_strings(obj):
                if isinstance(obj, str): return [obj]
                if isinstance(obj, dict): return [s for v in obj.values() for s in extract_strings(v)]
                if isinstance(obj, list): return [s for item in obj for s in extract_strings(item)]
                return []
            return "\n\n".join(extract_strings(parsed))
        except Exception:
            pass

    return raw
