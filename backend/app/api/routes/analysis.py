from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import json
import numpy as np
from app.core.file_handler import load_dataframe
from app.utils.column_detector import classify_columns, detect_domain, get_domain_kpis
from app.services.data_profiler import profile_dataset
from app.services.kpi_generator import generate_kpis
from app.services.anomaly_detector import detect_anomalies
from app.services.ml_analyzer import run_ml_analysis
from app.services.forecaster import run_forecast
from app.services.insight_engine import generate_insights
from fastapi.responses import Response
from app.services.pdf_generator import generate_pdf

router = APIRouter()

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer,)): return int(obj)
        if isinstance(obj, (np.floating,)): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)): return None
        return super().default(obj)

def clean(obj):
    return json.loads(json.dumps(obj, cls=NumpyEncoder))

@router.get("/analysis/{file_id}")
def get_full_analysis(file_id: str):
    try:
        df = load_dataframe(file_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")

    cols = classify_columns(df)
    domain_info = detect_domain(df.columns.tolist())
    domain_kpis = get_domain_kpis(domain_info["domain"], df, cols["numeric_cols"])

    profile = clean(profile_dataset(df))
    kpis = clean(generate_kpis(df, cols["numeric_cols"], cols["date_cols"]))
    kpis["_domain_kpis"] = clean(domain_kpis)

    anomalies = clean(detect_anomalies(df, cols["numeric_cols"]))
    ml = clean(run_ml_analysis(df, cols["numeric_cols"]))

    forecast = {}
    if cols["date_cols"] and cols["numeric_cols"]:
        forecast = clean(run_forecast(df, cols["date_cols"][0], cols["numeric_cols"][0]))

    insights = generate_insights(profile, kpis, anomalies, ml)

    return JSONResponse(content=clean({
        "file_id": file_id,
        "domain": domain_info,
        "column_profile": cols,
        "data_quality": profile,
        "kpis": kpis,
        "anomalies": anomalies,
        "ml_analysis": ml,
        "forecast": forecast,
        "insights": insights,
    }))

@router.get("/story/{file_id}")
def get_data_story(file_id: str):
    try:
        df = load_dataframe(file_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")

    from app.services.insight_engine import generate_data_story

    cols = classify_columns(df)
    profile = clean(profile_dataset(df))
    kpis = clean(generate_kpis(df, cols["numeric_cols"], cols["date_cols"]))
    anomalies = clean(detect_anomalies(df, cols["numeric_cols"]))
    insights = clean(generate_insights(profile, kpis, anomalies, {}))

    story = generate_data_story(profile, kpis, anomalies, insights)
    return JSONResponse(content={"story": story})

@router.get("/export/{file_id}")
def export_pdf(file_id: str):
    try:
        df = load_dataframe(file_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")

    cols = classify_columns(df)
    domain_info = clean(detect_domain(df.columns.tolist()))
    profile = clean(profile_dataset(df))
    kpis = clean(generate_kpis(df, cols["numeric_cols"], cols["date_cols"]))
    anomalies = clean(detect_anomalies(df, cols["numeric_cols"]))
    insights = generate_insights(profile, kpis, anomalies, {})

    pdf_bytes = generate_pdf(
        domain=domain_info,
        data_quality=profile,
        kpis=kpis,
        anomalies=anomalies,
        insights=insights,
        file_id=file_id
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=bizlytics_report_{file_id[:8]}.pdf"}
    )
