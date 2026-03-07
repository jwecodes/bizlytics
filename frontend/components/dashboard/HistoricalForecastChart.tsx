"use client"
import { Card } from "@/components/ui/card"
import {
  ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from "recharts"
import { ForecastPoint } from "@/lib/types"

interface HistoricalForecastChartProps {
  forecast: ForecastPoint[]
  historicalData?: { date: string; value: number }[]
  title: string
  trendDirection?: string
}

export default function HistoricalForecastChart({
  forecast, historicalData, title, trendDirection
}: HistoricalForecastChartProps) {
  if (!forecast?.length) return null

  // Merge historical + forecast into one timeline
  const historicalPoints = (historicalData ?? []).map(d => ({
    date: d.date,
    actual: d.value,
    forecast: null,
    upper: null,
    lower: null,
    isForecast: false,
  }))

  const forecastPoints = forecast.map(f => ({
    date: f.ds,
    actual: null,
    forecast: Math.round(f.yhat * 100) / 100,
    upper: Math.round(f.yhat_upper * 100) / 100,
    lower: Math.round(f.yhat_lower * 100) / 100,
    isForecast: true,
  }))

  // If no historical data passed, use first forecast point as separator
  const allData = historicalPoints.length > 0
    ? [...historicalPoints, ...forecastPoints]
    : forecastPoints

  const splitDate = forecastPoints[0]?.date

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#0d0e1a] border border-white/10 rounded-xl p-3 text-xs min-w-[140px]">
        <p className="text-white/50 mb-2">{label}</p>
        {payload.map((p: any) => p.value !== null && (
          <p key={p.name} style={{ color: p.color }} className="mb-0.5">
            {p.name}: {Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </p>
        ))}
      </div>
    )
  }

  const trendColor = trendDirection === "up" ? "text-green-400" : trendDirection === "down" ? "text-red-400" : "text-blue-400"
  const trendArrow = trendDirection === "up" ? "↑" : trendDirection === "down" ? "↓" : "→"

  return (
    <Card className="p-5 bg-white/5 border border-white/10 rounded-2xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-white capitalize">{title} — 90 Day Forecast</p>
          <p className="text-xs text-white/30 mt-0.5">
            Prophet model prediction with confidence band
          </p>
        </div>
        {trendDirection && (
          <span className={`text-sm font-bold ${trendColor} bg-white/5 px-3 py-1 rounded-full`}>
            {trendArrow} {trendDirection}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={allData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <defs>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            tickFormatter={(v) => v?.slice(0, 7)}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Confidence band */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="url(#bandGrad)"
            name="Upper bound"
            dot={false}
            activeDot={false}
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="transparent"
            name="Lower bound"
            dot={false}
            activeDot={false}
          />

          {/* Actual historical line */}
          {historicalPoints.length > 0 && (
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Actual"
              connectNulls={false}
            />
          )}

          {/* Forecast line */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#a855f7"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            name="Forecast"
            connectNulls={false}
          />

          {/* Split line between past and future */}
          {splitDate && historicalPoints.length > 0 && (
            <ReferenceLine
              x={splitDate}
              stroke="#ffffff20"
              strokeDasharray="4 4"
              label={{ value: "Today", fill: "#64748b", fontSize: 10, position: "top" }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-3 text-xs text-white/30">
        {historicalPoints.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-green-500 inline-block rounded" /> Actual
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-purple-500 inline-block rounded border-dashed" /> Forecast
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-2 bg-blue-500/20 inline-block rounded" /> Confidence band
        </span>
      </div>
    </Card>
  )
}
