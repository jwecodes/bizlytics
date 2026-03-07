"use client"
import { Card } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts"

interface TopNBarChartProps {
  data: Record<string, any>[]
  categoricalCols: string[]
  numericCols: string[]
}

const COLORS = ["#a855f7","#9333ea","#7c3aed","#6d28d9","#5b21b6","#4c1d95","#3b0764","#2e1065"]

export default function TopNBarChart({ data, categoricalCols, numericCols }: TopNBarChartProps) {
  if (!data?.length || !categoricalCols?.length || !numericCols?.length) return null

  const catCol = categoricalCols[0]
  const numCol = numericCols[0]

  // Sum numeric col grouped by categorical col
  const grouped: Record<string, number> = {}
  data.forEach(row => {
    const key = String(row[catCol] ?? "Unknown")
    const val = Number(row[numCol]) || 0
    grouped[key] = (grouped[key] ?? 0) + val
  })

  const chartData = Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))

  const maxVal = Math.max(...chartData.map(d => d.value))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#0d0e1a] border border-white/10 rounded-xl p-3 text-xs">
        <p className="text-white font-medium mb-1">{label}</p>
        <p className="text-purple-300">
          {numCol.replace(/_/g, " ")}: {payload[0].value.toLocaleString()}
        </p>
      </div>
    )
  }

  return (
    <Card className="p-5 bg-white/5 border border-white/10 rounded-2xl">
      <p className="text-sm font-semibold text-white mb-1">
        Top {chartData.length} by{" "}
        <span className="text-purple-400 capitalize">{numCol.replace(/_/g, " ")}</span>
      </p>
      <p className="text-xs text-white/30 mb-4 capitalize">
        Grouped by {catCol.replace(/_/g, " ")}
      </p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={`rgba(168, 85, 247, ${1 - (i / chartData.length) * 0.5})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
