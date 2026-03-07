"use client"
import { Card } from "@/components/ui/card"
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend
} from "recharts"

interface CategoryDonutChartProps {
  data: Record<string, any>[]
  categoricalCols: string[]
}

const COLORS = ["#a855f7","#3b82f6","#10b981","#f59e0b","#ef4444","#06b6d4"]

export default function CategoryDonutChart({ data, categoricalCols }: CategoryDonutChartProps) {
  if (!data?.length || !categoricalCols?.length) return null

  // Pick first categorical column
  const col = categoricalCols[0]

  // Count values
  const counts: Record<string, number> = {}
  data.forEach(row => {
    const val = String(row[col] ?? "Unknown")
    counts[val] = (counts[val] ?? 0) + 1
  })

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const total = sorted.reduce((s, [, v]) => s + v, 0)
  const chartData = sorted.map(([name, value]) => ({
    name,
    value,
    pct: ((value / total) * 100).toFixed(1)
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]
    return (
      <div className="bg-[#0d0e1a] border border-white/10 rounded-xl p-3 text-xs">
        <p className="text-white font-medium">{d.name}</p>
        <p className="text-white/40 mt-1">{d.value} rows ({d.payload.pct}%)</p>
      </div>
    )
  }

  const CustomLabel = ({ cx, cy }: any) => (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-0.5em" className="fill-white" fontSize={22} fontWeight="bold">
        {total}
      </tspan>
      <tspan x={cx} dy="1.6em" fill="#64748b" fontSize={11}>
        total
      </tspan>
    </text>
  )

  return (
    <Card className="p-5 bg-white/5 border border-white/10 rounded-2xl">
      <p className="text-sm font-semibold text-white mb-1 capitalize">
        {col.replace(/_/g, " ")} Distribution
      </p>
      <p className="text-xs text-white/30 mb-4">Top {chartData.length} categories</p>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={CustomLabel}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ color: "#94a3b8", fontSize: 11 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}
