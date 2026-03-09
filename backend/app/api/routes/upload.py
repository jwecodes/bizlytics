import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import pandas as pd
from app.core.file_handler import save_upload
from app.core.auth_middleware import get_current_user
from app.database import get_supabase
from app.config import UPLOAD_DIR

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files supported")

    contents = await file.read()
    file_id, path = save_upload(contents, file.filename)

    file_size = os.path.getsize(path)
    ext = os.path.splitext(file.filename)[1].lower()

    try:
        df = pd.read_csv(path) if ext == ".csv" else pd.read_excel(path)
        row_count = len(df)
        col_count = len(df.columns)
    except Exception:
        row_count, col_count = 0, 0

    try:
        sb = get_supabase()
        sb.table("uploaded_files").insert({
            "user_id": current_user.id,
            "file_id": file_id,
            "original_name": file.filename,
            "file_size": file_size,
            "row_count": row_count,
            "column_count": col_count,
        }).execute()
    except Exception:
        pass

    return {
        "file_id": file_id,
        "filename": file.filename,
        "rows": row_count,
        "columns": col_count,
        "message": "Upload successful"
    }
