from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import json
import numpy as np
from app.core.file_handler import load_dataframe
from app.core.llm_provider import get_llm_response
from app.utils.column_detector import classify_columns
from app.services.data_profiler import profile_dataset
from app.services.kpi_generator import generate_kpis

router = APIRouter()

class ChatRequest(BaseModel):
    question: str

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer,)): return int(obj)
        if isinstance(obj, (np.floating,)): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)): return None
        return super().default(obj)

def clean(obj):
    return json.loads(json.dumps(obj, cls=NumpyEncoder))

@router.post("/chat/{file_id}")
def chat_with_data(file_id: str, body: ChatRequest):
    try:
        df = load_dataframe(file_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")

    cols = classify_columns(df)
    profile = clean(profile_dataset(df))
    kpis = clean(generate_kpis(df, cols["numeric_cols"], cols["date_cols"]))

    # Build context from data
    sample_rows = df.head(5).to_dict("records")
    col_list = df.columns.tolist()

    prompt = f"""
You are a business data analyst assistant. A user has uploaded a dataset and is asking questions about it.

DATASET CONTEXT:
- Columns: {col_list}
- Total rows: {profile.get('total_rows')}
- Column types: {profile.get('column_types')}
- KPIs: {json.dumps(kpis, cls=NumpyEncoder)[:1500]}
- Sample rows: {json.dumps(clean(sample_rows), cls=NumpyEncoder)[:1000]}
- Basic stats: {json.dumps(profile.get('numeric_stats', {}), cls=NumpyEncoder)[:1500]}

USER QUESTION: {body.question}

RULES:
- Answer ONLY based on the data provided above
- Be specific — use actual numbers from the data
- Keep your answer concise (3-5 sentences max)
- If the question cannot be answered from the data, say so clearly
- Do not make up data that isn't there

Answer:
"""

    answer = get_llm_response(prompt)
    return JSONResponse(content={"answer": answer, "question": body.question})
