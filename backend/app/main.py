from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.upload import router as upload_router
from app.api.routes.analysis import router as analysis_router
from app.api.routes.chat import router as chat_router
from app.api.routes.compare import router as compare_router
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
app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(analysis_router, prefix="/api", tags=["Analysis"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])
app.include_router(compare_router, prefix="/api", tags=["Compare"])

@app.get("/")
def root():
    return {"message": "Bizlytics API is running"}
