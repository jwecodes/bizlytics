from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse, Response
import json
import math
import logging
import numpy as np
import pandas as pd
from app.core.file_handler import load_dataframe
from app.utils.column_detector import classify_columns, detect_domain, get_domain_kpis
from app.services.data_profiler import profile_dataset
from app.services.kpi_generator import generate_kpis
from app.services.anomaly_detector import detect_anomalies
from app.services.ml_analyzer import run_ml_analysis
from app.services.forecaster import run_forecast
from app.services.insight_engine import generate_insights
from app.services.pdf_generator import generate_pdf
from app.core.auth_middleware import get_current_user
from app.database import get_supabase


router = APIRouter()
logger = logging.getLogger(__name__)


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return None if (np.isnan(obj) or np.isinf(obj)) else float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
            return None
        try:
            if pd.isna(obj):
                return None
        except (TypeError, ValueError):
            pass
        return super().default(obj)


def clean(obj):
    """Recursively strip NaN/Inf/NA from any nested dict/list."""
    if isinstance(obj, dict):
        return {k: clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean(v) for v in obj]
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, np.floating):
        return None if (np.isnan(obj) or np.isinf(obj)) else float(obj)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.ndarray):
        return clean(obj.tolist())
    try:
        if pd.isna(obj):
            return None
    except (TypeError, ValueError):
        pass
    return obj


# ── /analysis/{file_id} ───────────────────────────────────────────────────

@router.get("/analysis/{file_id}")
def get_full_analysis(file_id: str, current_user=Depends(get_current_user)):
    try:
        df = load_dataframe(file_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")

    cols        = classify_columns(df)
    domain_info = detect_domain(df.columns.tolist())
    domain_kpis = get_domain_kpis(domain_info["domain"], df, cols["numeric_cols"])

    profile   = clean(profile_dataset(df))
    kpis      = clean(generate_kpis(df, cols["numeric_cols"], cols["date_cols"]))
    kpis["_domain_kpis"] = clean(domain_kpis)

    anomalies = clean(detect_anomalies(df, cols["numeric_cols"]))
    ml        = clean(run_ml_analysis(df, cols["numeric_cols"]))

    forecast = {}
    if cols["date_cols"] and cols["numeric_cols"]:
        try:
            forecast = clean(run_forecast(df, cols["date_cols"][0], cols["numeric_cols"][0]))
        except Exception as e:
            logger.warning(f"Forecast failed for {file_id}: {e}")

    insights = generate_insights(profile, kpis, anomalies, ml)

    result = clean({
        "file_id":        file_id,
        "domain":         domain_info,
        "column_profile": cols,
        "data_quality":   profile,
        "kpis":           kpis,
        "anomalies":      anomalies,
        "ml_analysis":    ml,
        "forecast":       forecast,
        "insights":       insights,
    })

    # ── Persist to Supabase ───────────────────────────────────────────────
    try:
        sb = get_supabase()

        file_meta = sb.table("uploaded_files") \
            .select("original_name") \
            .eq("file_id", file_id) \
            .eq("user_id", current_user.id) \
            .maybe_single() \
            .execute()

        original_name = (
            file_meta.data.get("original_name", "Unknown")
            if file_meta and file_meta.data else "Unknown"
        )

        existing = sb.table("analysis_sessions") \
            .select("file_id") \
            .eq("file_id", file_id) \
            .eq("user_id", current_user.id) \
            .maybe_single() \
            .execute()

        existing_data = existing.data if existing else None

        if not existing_data:
            storable = {
                "file_id":        result["file_id"],
                "domain":         result["domain"],
                "column_profile": result["column_profile"],
                "data_quality": {
                    "total_rows":    result["data_quality"]["total_rows"],
                    "total_columns": result["data_quality"]["total_columns"],
                    "quality_score": result["data_quality"].get("quality_score"),
                    "missing_pct":   result["data_quality"].get("missing_pct"),
                },
                "kpis": {
                    k: v for k, v in result["kpis"].items()
                    if k != "_domain_kpis"
                },
                "anomalies": {
                    "anomaly_count": result["anomalies"]["anomaly_count"],
                    "note":          result["anomalies"].get("note"),
                },
                "insights": {
                    "executive_summary": result["insights"].get("executive_summary"),
                },
            }

            sb.table("analysis_sessions").insert({
                "user_id":         current_user.id,
                "file_id":         file_id,
                "original_name":   original_name,
                "domain":          domain_info.get("domain", "unknown"),
                "analysis_result": storable,
            }).execute()

            logger.info(f"Session saved for file {file_id}")
        else:
            logger.info(f"Session already exists for {file_id} — skipping write")

    except Exception as e:
        logger.warning(f"Failed to persist session for {file_id}: {e}")

    # Double-pass through NumpyEncoder to guarantee no NaN leaks through
    safe_result = json.loads(json.dumps(result, cls=NumpyEncoder))
    return JSONResponse(content=safe_result)


# ── /story/{file_id} ──────────────────────────────────────────────────────

@router.get("/story/{file_id}")
def get_data_story(file_id: str, current_user=Depends(get_current_user)):
    try:
        df = load_dataframe(file_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")

    from app.services.insight_engine import generate_data_story

    cols      = classify_columns(df)
    profile   = clean(profile_dataset(df))
    kpis      = clean(generate_kpis(df, cols["numeric_cols"], cols["date_cols"]))
    anomalies = clean(detect_anomalies(df, cols["numeric_cols"]))
    insights  = clean(generate_insights(profile, kpis, anomalies, {}))

    story = generate_data_story(profile, kpis, anomalies, insights)
    return JSONResponse(content={"story": story})


# ── /export/{file_id} ─────────────────────────────────────────────────────

@router.get("/export/{file_id}")
def export_pdf(file_id: str, current_user=Depends(get_current_user)):
    try:
        df = load_dataframe(file_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")

    cols        = classify_columns(df)
    domain_info = clean(detect_domain(df.columns.tolist()))
    domain_kpis = get_domain_kpis(domain_info["domain"], df, cols["numeric_cols"])

    profile   = clean(profile_dataset(df))
    kpis      = clean(generate_kpis(df, cols["numeric_cols"], cols["date_cols"]))
    kpis["_domain_kpis"] = clean(domain_kpis)

    anomalies = clean(detect_anomalies(df, cols["numeric_cols"]))
    ml        = clean(run_ml_analysis(df, cols["numeric_cols"]))
    insights  = generate_insights(profile, kpis, anomalies, {})

    forecast = {}
    if cols["date_cols"] and cols["numeric_cols"]:
        try:
            forecast = clean(run_forecast(df, cols["date_cols"][0], cols["numeric_cols"][0]))
        except Exception as e:
            logger.warning(f"Forecast skipped for PDF {file_id}: {e}")

    pdf_bytes = generate_pdf(
        domain=domain_info,
        data_quality=profile,
        kpis=kpis,
        anomalies=anomalies,
        insights=insights,
        file_id=file_id,
        forecast=forecast,
        ml_analysis=ml,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=bizlytics_report_{file_id[:8]}.pdf"
        }
    )
