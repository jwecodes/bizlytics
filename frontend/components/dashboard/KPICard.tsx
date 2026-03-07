"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { KPI, NumericStats } from "@/lib/types"
import ColumnStatsModal from "./ColumnStatsModal"

interface KPICardProps {
  name: string
  kpi: KPI
  stats?: NumericStats
}

export default function KPICard({ name, kpi, stats }: KPICardProps) {
  const [showModal, setShowModal] = useState(false)
  const isUp = kpi.trend === "up"

  return (
    <>
      <Card
        onClick={() => stats && setShowModal(true)}
        className={`p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2 transition-all
          ${stats
            ? "cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 hover:shadow-lg hover:shadow-purple-500/10"
            : ""
          }`}
      >
        <div className="flex items-start justify-between">
          <p className="text-xs text-white/40 uppercase tracking-wider">
            {name.replace(/_/g, " ")}
          </p>
          {stats && (
            <span className="text-xs text-purple-400/50">↗ stats</span>
          )}
        </div>

        <p className="text-3xl font-bold text-white">
          {kpi.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>

        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-white/30">
            Avg: {kpi.average.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
          {kpi.growth_rate_pct !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
              ${isUp
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
              }`}>
              {isUp
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              {isUp ? "+" : ""}{Math.abs(kpi.growth_rate_pct).toFixed(1)}%
            </span>
          )}
        </div>
      </Card>

      {showModal && stats && (
        <ColumnStatsModal
          name={name}
          stats={stats}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
