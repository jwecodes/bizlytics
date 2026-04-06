import json
from io import BytesIO
from typing import List

import pandas as pd
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import Response

from app.core.auth_middleware import get_current_user
from app.database import get_supabase
from app.services.comparator import compare_datasets, compare_multiple, NumpyEncoder
from app.services.pdf_generator import generate_comparison_pdf


router = APIRouter(prefix="/compare", tags=["compare"])



def _load_dataframe(file_bytes: bytes, filename: str) -> pd.DataFrame:
    ext = (filename or "").rsplit(".", 1)[-1].lower()

    if ext == "csv":
        return pd.read_csv(BytesIO(file_bytes))
    if ext in {"xlsx", "xls"}:
        return pd.read_excel(BytesIO(file_bytes))

    raise ValueError(f"Unsupported file type: {filename}")



def _save_comparison(
    user_id: str,
    cmp_type: str,
    labels: List[str],
    file_names: List[str],
    result: dict,
) -> None:
    try:
        sb = get_supabase()
        safe_result = json.loads(json.dumps(result, cls=NumpyEncoder))
        sb.table("comparison_sessions").insert({
            "user_id":        user_id,
            "type":           cmp_type,
            "labels":         labels,
            "file_names":     file_names,
            "file_count":     len(labels),
            "common_columns": result.get("common_columns", []),
            "result":         safe_result,
        }).execute()
    except Exception:
        pass



# ── 2-file comparison ─────────────────────────────────────────
@router.post("/")
async def compare(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    label1: str = Form("Dataset A"),
    label2: str = Form("Dataset B"),
    current_user=Depends(get_current_user),
):
    try:
        content1 = await file1.read()
        content2 = await file2.read()

        df1 = _load_dataframe(content1, file1.filename or "")
        df2 = _load_dataframe(content2, file2.filename or "")

        result = compare_datasets(df1, df2, label1, label2)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    narrative = ""
    # try:
    #     from app.services.llm import generate_comparison_narrative
    #     narrative = generate_comparison_narrative(result, label1, label2)
    # except Exception:
    #     pass

    result["narrative"] = narrative

    _save_comparison(
        user_id=current_user.id,
        cmp_type="two",
        labels=[label1, label2],
        file_names=[file1.filename or "file1", file2.filename or "file2"],
        result=result,
    )

    return result



# ── multi-file comparison ─────────────────────────────────────
@router.post("/multi")
async def compare_multi(
    files: List[UploadFile] = File(...),
    labels: str = Form(...),
    current_user=Depends(get_current_user),
):
    try:
        label_list: List[str] = json.loads(labels)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="labels must be a valid JSON array of strings.")

    if not isinstance(label_list, list) or not all(isinstance(l, str) for l in label_list):
        raise HTTPException(status_code=422, detail="labels must be a JSON array of strings.")

    if len(files) < 2 or len(files) > 10:
        raise HTTPException(status_code=422, detail=f"Send between 2 and 10 files (received {len(files)}).")

    if len(files) != len(label_list):
        raise HTTPException(
            status_code=422,
            detail=f"File count ({len(files)}) must match label count ({len(label_list)})."
        )

    dataframes: List[pd.DataFrame] = []
    file_names: List[str] = []

    try:
        for f in files:
            filename  = f.filename or f"file_{len(file_names)+1}"
            file_bytes = await f.read()
            df = _load_dataframe(file_bytes, filename)
            dataframes.append(df)
            file_names.append(filename)

        result = compare_multiple(dataframes, label_list)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    narrative = ""
    # try:
    #     from app.services.llm import generate_multi_comparison_narrative
    #     narrative = generate_multi_comparison_narrative(result)
    # except Exception:
    #     pass

    result["narrative"] = narrative

    _save_comparison(
        user_id=current_user.id,
        cmp_type="multi",
        labels=label_list,
        file_names=file_names,
        result=result,
    )

    return result



# ── PDF export ────────────────────────────────────────────────
@router.post("/export-pdf")
async def export_comparison_pdf(
    payload: dict,
    current_user=Depends(get_current_user),
):
    """
    Accepts { type: "two" | "multi", result: <comparison result dict> }
    Returns a downloadable PDF.
    """
    result = payload.get("result")
    if not result or not isinstance(result, dict):
        raise HTTPException(status_code=422, detail="Missing or invalid 'result' in payload.")

    try:
        pdf_bytes = generate_comparison_pdf(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    comp_type = payload.get("type", "two")
    if comp_type == "two":
        l1       = result.get("label1", "A")
        l2       = result.get("label2", "B")
        filename = f"comparison-{l1}-vs-{l2}.pdf"
    else:
        labels   = result.get("labels", [])
        filename = f"multi-comparison-{'-'.join(str(l) for l in labels[:4])}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length":      str(len(pdf_bytes)),
        },
    )
