from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.file_handler import save_upload

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files supported")
    contents = await file.read()
    file_id, path = save_upload(contents, file.filename)
    return {"file_id": file_id, "filename": file.filename, "message": "Upload successful"}
