from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import get_supabase
from app.core.auth_middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register(body: RegisterRequest):
    sb = get_supabase()
    try:
        response = sb.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {"data": {"full_name": body.full_name}}
        })
        if response.user is None:
            raise HTTPException(status_code=400, detail="Registration failed")
        return {
            "message": "Registration successful. Please verify your email.",
            "user_id": response.user.id,
            "email": response.user.email
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(body: LoginRequest):
    sb = get_supabase()
    try:
        response = sb.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "token_type": "bearer",
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "full_name": response.user.user_metadata.get("full_name", "")
            }
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    sb = get_supabase()
    try:
        response = sb.auth.refresh_session(refresh_token)
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.user_metadata.get("full_name", "")
    }

@router.post("/logout")
async def logout(current_user=Depends(get_current_user)):
    return {"message": "Logged out successfully"}
