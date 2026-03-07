"use client"
import { useEffect } from "react"
import { X } from "lucide-react"
import { NumericStats } from "@/lib/types"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts"

interface ColumnStatsModalProps {
  name: string
  stats: NumericStats
  onClose: () => void
}

export default function ColumnStatsModal({ name, stats, onClose }: ColumnStatsModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const distributionData = [
    { label: "Min",    value: stats.min },
    { label: "Q1",     value: stats.q1 },
    { label: "Median", value: stats.median },
    { label: "Mean",   value: stats.mean },
    { label: "Q3",     value: stats.q3 },
    { label: "Max",    value: stats.max },
  ]

  const skewLabel =
    stats.skewness > 1    ? "Highly Right-Skewed" :
    stats.skewness > 0.5  ? "Right-Skewed" :
    stats.skewness < -1   ? "Highly Left-Skewed" :
    stats.skewness < -0.5 ? "Left-Skewed" : "Approximately Normal"

  const skewColor =
    Math.abs(stats.skewness) > 1   ? "text-red-400" :
    Math.abs(stats.skewness) > 0.5 ? "text-yellow-400" : "text-green-400"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 bg-[#13142a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
          <div>
            <p className="text-lg font-bold text-white capitalize">
              {name.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-white/40 mt-0.5">Column Statistics</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Chart */}
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
              Distribution Overview
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={distributionData}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d0e1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 12
                  }}
                  formatter={(val: any) => [val.toLocaleString(), "Value"]}
                />
                <ReferenceLine y={stats.mean} stroke="#a855f7" strokeDasharray="4 4" strokeWidth={1.5} />
                <Bar dataKey="value" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-center text-white/30 mt-1">
              Purple dashed = Mean ({stats.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })})
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Mean",    value: stats.mean },
              { label: "Median", value: stats.median },
              { label: "Std Dev", value: stats.std },
              { label: "Min",    value: stats.min },
              { label: "Max",    value: stats.max },
              { label: "IQR",    value: stats.iqr },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-white">
                  {s.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Skewness + Outliers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Distribution Shape</p>
              <p className={`text-sm font-semibold ${skewColor}`}>{skewLabel}</p>
              <p className="text-xs text-white/30 mt-1">
                Skewness: {stats.skewness.toFixed(3)}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Outliers (IQR method)</p>
              <p className={`text-sm font-semibold ${stats.outlier_count > 0 ? "text-yellow-400" : "text-green-400"}`}>
                {stats.outlier_count} found
              </p>
              <p className="text-xs text-white/30 mt-1">
                Kurtosis: {stats.kurtosis.toFixed(3)}
              </p>
            </div>
          </div>

          <p className="text-xs text-center text-white/20">
            Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/30">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  )
}
