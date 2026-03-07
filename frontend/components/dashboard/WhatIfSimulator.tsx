"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { KPI } from "@/lib/types"
import { TrendingUp, TrendingDown } from "lucide-react"

export default function WhatIfSimulator({ kpis }: { kpis: Record<string, KPI> }) {
  const [adjustment, setAdjustment] = useState(0)

  const numericKpis = Object.entries(kpis).filter(([k]) => k !== "_domain_kpis")

  return (
    <Card className="p-6 bg-card border border-border rounded-2xl">
      <h3 className="font-semibold text-foreground mb-1">🎯 What-If Scenario Simulator</h3>
      <p className="text-xs text-muted-foreground mb-5">
        Drag the slider to simulate how your KPIs change with growth or decline
      </p>

      {/* Slider */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-xs text-red-400 font-medium">-50%</span>
        <input
          type="range" min={-50} max={50} value={adjustment}
          onChange={(e) => setAdjustment(Number(e.target.value))}
          className="flex-1 h-2 rounded-full accent-blue-500 cursor-pointer"
        />
        <span className="text-xs text-green-400 font-medium">+50%</span>
        <span className={`text-sm font-bold w-16 text-center ${
          adjustment > 0 ? "text-green-400" : adjustment < 0 ? "text-red-400" : "text-muted-foreground"
        }`}>
          {adjustment > 0 ? "+" : ""}{adjustment}%
        </span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {numericKpis.map(([name, kpi]) => {
          const multiplier = 1 + adjustment / 100
          const newTotal = kpi.total * multiplier
          const newAvg = kpi.average * multiplier
          const changed = adjustment !== 0

          return (
            <div key={name} className={`p-3 rounded-xl border transition-all ${
              changed
                ? adjustment > 0 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
                : "bg-muted/30 border-border"
            }`}>
              <p className="text-xs text-muted-foreground truncate mb-1">{name.replace(/_/g, " ")}</p>
              <p className={`text-lg font-bold ${
                changed ? adjustment > 0 ? "text-green-400" : "text-red-400" : "text-foreground"
              }`}>
                {newTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {changed && (adjustment > 0
                  ? <TrendingUp className="w-3 h-3 text-green-400" />
                  : <TrendingDown className="w-3 h-3 text-red-400" />
                )}
                <p className="text-xs text-muted-foreground">
                  avg: {newAvg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {adjustment !== 0 && (
        <p className="text-xs text-center text-muted-foreground mt-4">
          Simulating a <span className={adjustment > 0 ? "text-green-400" : "text-red-400"}>
            {adjustment > 0 ? "+" : ""}{adjustment}%
          </span> change across all metrics
        </p>
      )}
    </Card>
  )
}
