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

def build_insight_prompt(profile: dict, kpis: dict, anomalies: dict, ml: dict) -> str:
    return f"""
You are a senior business analyst. Analyze the following dataset report and return a JSON object.

DATASET PROFILE:
{safe_json(profile, 3000)}

KPIs:
{safe_json(kpis, 2000)}

ANOMALY DETECTION:
{safe_json(anomalies, 1000)}

ML SEGMENTATION:
{safe_json(ml, 1000)}

Return ONLY a valid JSON object with this exact structure:
{{
  "executive_summary": "2-3 sentence overview of the dataset",
  "trends": [{{"title": "", "description": "", "sentiment": "positive|neutral|negative"}}],
  "risks": [{{"title": "", "description": "", "impact": "high|medium|low"}}],
  "opportunities": [{{"title": "", "description": ""}}],
  "anomaly_explanations": [{{"index": 0, "reason": "", "action": ""}}],
  "recommendations": [{{"action": "", "outcome": "", "priority": "high|medium|low"}}]
}}
"""
