from fastapi import APIRouter, Depends, Query, HTTPException
from app.core.auth_middleware import get_current_user
from app.database import get_supabase


router = APIRouter(prefix="/history", tags=["history"])


# ─────────────────────────────────────────────────────────────
#  Single-file analysis sessions
#  IMPORTANT: all fixed routes (/stats, /comparisons/…, /bulk)
#  are declared BEFORE the dynamic /{session_id} catchall.
# ─────────────────────────────────────────────────────────────

@router.get("/")
async def get_history(
    domain: str | None = Query(None),
    search: str | None = Query(None),
    limit:  int        = Query(50, le=200),
    current_user=Depends(get_current_user),
):
    sb    = get_supabase()
    query = (
        sb.table("analysis_sessions")
        .select("id, file_id, original_name, domain, created_at")
        .eq("user_id", current_user.id)
        .order("created_at", desc=True)
        .limit(limit)
    )
    if domain:
        query = query.eq("domain", domain)
    if search:
        query = query.ilike("original_name", f"%{search}%")

    response = query.execute()
    return {"sessions": response.data}


@router.get("/stats")                              # ← fixed: must be before /{session_id}
async def get_history_stats(current_user=Depends(get_current_user)):
    sb       = get_supabase()
    response = (
        sb.table("analysis_sessions")
        .select("domain, created_at")
        .eq("user_id", current_user.id)
        .execute()
    )
    rows = response.data or []

    domain_counts: dict[str, int] = {}
    for r in rows:
        d = r.get("domain") or "unknown"
        domain_counts[d] = domain_counts.get(d, 0) + 1

    return {"total": len(rows), "domain_counts": domain_counts}


# ─────────────────────────────────────────────────────────────
#  Comparison sessions — all fixed paths first
# ─────────────────────────────────────────────────────────────

@router.get("/comparisons")                        # ← fixed
async def get_comparison_history(
    type:   str | None = Query(None, description="Filter by 'two' or 'multi'"),
    search: str | None = Query(None, description="Search within labels or file names"),
    limit:  int        = Query(50, le=200),
    current_user=Depends(get_current_user),
):
    sb    = get_supabase()
    query = (
        sb.table("comparison_sessions")
        .select("id, type, labels, file_names, file_count, common_columns, created_at")
        .eq("user_id", current_user.id)
        .order("created_at", desc=True)
        .limit(limit)
    )
    if type in ("two", "multi"):
        query = query.eq("type", type)

    response = query.execute()
    rows     = response.data or []

    if search:
        q    = search.lower()
        rows = [
            r for r in rows
            if any(q in lbl.lower() for lbl in (r.get("labels") or []))
            or any(q in fn.lower()  for fn  in (r.get("file_names") or []))
        ]

    return {"sessions": rows}


@router.get("/comparisons/stats")                  # ← fixed: must be before /comparisons/{session_id}
async def get_comparison_stats(current_user=Depends(get_current_user)):
    sb       = get_supabase()
    response = (
        sb.table("comparison_sessions")
        .select("type, created_at")
        .eq("user_id", current_user.id)
        .execute()
    )
    rows = response.data or []
    return {
        "total":       len(rows),
        "two_count":   sum(1 for r in rows if r.get("type") == "two"),
        "multi_count": sum(1 for r in rows if r.get("type") == "multi"),
    }


@router.get("/comparisons/{session_id}")           # ← dynamic: after all fixed /comparisons/… routes
async def get_comparison_session(session_id: str, current_user=Depends(get_current_user)):
    sb       = get_supabase()
    response = (
        sb.table("comparison_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("user_id", current_user.id)
        .single()
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Comparison session not found")
    return response.data


# ─────────────────────────────────────────────────────────────
#  Single-file dynamic GET — must come after ALL fixed GETs
# ─────────────────────────────────────────────────────────────

@router.get("/{session_id}")                       # ← dynamic catchall: declared last among GETs
async def get_session(session_id: str, current_user=Depends(get_current_user)):
    sb       = get_supabase()
    response = (
        sb.table("analysis_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("user_id", current_user.id)
        .single()
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Session not found")
    return response.data


# ─────────────────────────────────────────────────────────────
#  DELETE routes — same rule: fixed paths before dynamic
# ─────────────────────────────────────────────────────────────

@router.delete("/")                                # ← fixed
async def clear_all_history(current_user=Depends(get_current_user)):
    sb = get_supabase()
    sb.table("analysis_sessions").delete().eq("user_id", current_user.id).execute()
    return {"message": "All sessions deleted"}


@router.delete("/bulk")                            # ← fixed: before /{session_id}
async def bulk_delete(session_ids: list[str], current_user=Depends(get_current_user)):
    if not session_ids:
        return {"message": "Nothing to delete"}
    sb = get_supabase()
    sb.table("analysis_sessions").delete().in_("id", session_ids).eq("user_id", current_user.id).execute()
    return {"message": f"{len(session_ids)} session(s) deleted"}


@router.delete("/comparisons/")                    # ← fixed
async def clear_all_comparisons(current_user=Depends(get_current_user)):
    sb = get_supabase()
    sb.table("comparison_sessions").delete().eq("user_id", current_user.id).execute()
    return {"message": "All comparison sessions deleted"}


@router.delete("/comparisons/{session_id}")        # ← dynamic: after fixed /comparisons/ route
async def delete_comparison_session(session_id: str, current_user=Depends(get_current_user)):
    sb = get_supabase()
    sb.table("comparison_sessions").delete().eq("id", session_id).eq("user_id", current_user.id).execute()
    return {"message": "Comparison session deleted"}


@router.delete("/{session_id}")                    # ← dynamic catchall: declared last among DELETEs
async def delete_session(session_id: str, current_user=Depends(get_current_user)):
    sb = get_supabase()
    sb.table("analysis_sessions").delete().eq("id", session_id).eq("user_id", current_user.id).execute()
    return {"message": "Session deleted"}
