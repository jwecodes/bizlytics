"use client"
import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { ForecastPoint } from "@/lib/types"

export default function ForecastChart({ forecast, title }: { forecast: ForecastPoint[], title: string }) {
  const data = forecast.map(f => ({
    date: f.ds.split("T")[0],
    forecast: parseFloat(f.yhat.toFixed(2)),
    lower: parseFloat(f.yhat_lower.toFixed(2)),
    upper: parseFloat(f.yhat_upper.toFixed(2)),
  }))

  return (
    <Card className="p-5 bg-card border border-border rounded-2xl">
      <p className="text-sm font-semibold text-foreground mb-4">📈 Forecast — {title.replace(/_/g, " ")}</p>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Area type="monotone" dataKey="upper" stroke="transparent" fill="#3b82f620" />
          <Area type="monotone" dataKey="lower" stroke="transparent" fill="#0f172a" />
          <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
