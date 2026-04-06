from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import upload, analysis, chat, compare
from app.api.routes.auth import router as auth_router
from app.api.routes.history import router as history_router

app = FastAPI(title="Bizlytics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth & history (no /api prefix — cleaner URLs)
app.include_router(auth_router)
app.include_router(history_router, prefix="/api")

# Core routes
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(compare.router, prefix="/api", tags=["Compare"])

@app.get("/")
def root():
    return {"message": "Bizlytics API is running"}
