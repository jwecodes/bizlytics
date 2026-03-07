import os, uuid, pandas as pd
from app.config import UPLOAD_DIR

def save_upload(file_bytes: bytes, filename: str) -> tuple[str, str]:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_id = str(uuid.uuid4())
    ext = filename.split(".")[-1]
    path = f"{UPLOAD_DIR}/{file_id}.{ext}"
    with open(path, "wb") as f:
        f.write(file_bytes)
    return file_id, path

def load_dataframe(file_id: str) -> pd.DataFrame:
    for ext in ["csv", "xlsx", "xls"]:
        path = f"{UPLOAD_DIR}/{file_id}.{ext}"
        if os.path.exists(path):
            return pd.read_csv(path) if ext == "csv" else pd.read_excel(path)
    raise FileNotFoundError(f"No file found for id: {file_id}")
