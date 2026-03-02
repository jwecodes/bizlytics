import pandas as pd
from prophet import Prophet

def run_forecast(df: pd.DataFrame, date_col: str, value_col: str, periods: int = 90) -> dict:
    try:
        df_p = df[[date_col, value_col]].dropna()
        df_p = df_p.rename(columns={date_col: "ds", value_col: "y"})
        df_p["ds"] = pd.to_datetime(df_p["ds"])

        model = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
        model.fit(df_p)

        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)

        return {
            "forecast": forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]]
                        .tail(periods).assign(ds=lambda x: x["ds"].astype(str))
                        .to_dict("records"),
            "trend_direction": "up" if forecast["trend"].iloc[-1] > forecast["trend"].iloc[0] else "down"
        }
    except Exception as e:
        return {"error": str(e)}
