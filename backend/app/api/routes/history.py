from fastapi import APIRouter, Depends
from app.core.auth_middleware import get_current_user
from app.database import get_supabase

router = APIRouter(prefix="/history", tags=["history"])

@router.get("/")
async def get_history(current_user=Depends(get_current_user)):
    sb = get_supabase()
    response = sb.table("analysis_sessions")\
        .select("id, file_id, original_name, domain, created_at")\
        .eq("user_id", current_user.id)\
        .order("created_at", desc=True)\
        .limit(50)\
        .execute()
    return {"sessions": response.data}

@router.get("/{session_id}")
async def get_session(session_id: str, current_user=Depends(get_current_user)):
    sb = get_supabase()
    response = sb.table("analysis_sessions")\
        .select("*")\
        .eq("id", session_id)\
        .eq("user_id", current_user.id)\
        .single()\
        .execute()
    if not response.data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Session not found")
    return response.data

@router.delete("/{session_id}")
async def delete_session(session_id: str, current_user=Depends(get_current_user)):
    sb = get_supabase()
    sb.table("analysis_sessions")\
        .delete()\
        .eq("id", session_id)\
        .eq("user_id", current_user.id)\
        .execute()
    return {"message": "Session deleted"}
