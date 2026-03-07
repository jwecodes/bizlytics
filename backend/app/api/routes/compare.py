from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import io
from app.core.file_handler import load_dataframe
from app.services.comparator import compare_datasets
from app.core.llm_provider import get_llm_response
import json

router = APIRouter()

def read_upload(file_bytes: bytes, filename: str) -> pd.DataFrame:
    if filename.endswith(".csv"):
        return pd.read_csv(io.BytesIO(file_bytes))
    return pd.read_excel(io.BytesIO(file_bytes))

@router.post("/compare")
async def compare(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    label1: str = Form(default="Dataset A"),
    label2: str = Form(default="Dataset B"),
):
    if not (file1.filename.endswith((".csv", ".xlsx")) and file2.filename.endswith((".csv", ".xlsx"))):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files supported")

    bytes1 = await file1.read()
    bytes2 = await file2.read()

    df1 = read_upload(bytes1, file1.filename)
    df2 = read_upload(bytes2, file2.filename)

    result = compare_datasets(df1, df2, label1, label2)

    # LLM narrative for comparison
    prompt = f"""
You are a senior business analyst. Compare these two datasets and write a concise comparison report.

COMPARISON RESULTS:
- {label1}: {result['overview'][label1]['rows']} rows
- {label2}: {result['overview'][label2]['rows']} rows
- Metrics improved: {result['summary']['improved_metrics']}
- Metrics declined: {result['summary']['declined_metrics']}
- Top changes: {json.dumps(result['metric_comparison'][:5])}

Write 3 short paragraphs as plain text (no JSON, no bullets):
1. Overall comparison summary
2. What improved and why it matters
3. What declined and what to do about it
"""
    narrative = get_llm_response(prompt)
    result["narrative"] = narrative

    return JSONResponse(content=result)
