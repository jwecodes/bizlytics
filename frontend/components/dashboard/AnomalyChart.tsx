"use client"
import { Card } from "@/components/ui/card"
import {
  ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis
} from "recharts"

interface PCAPoint { x: number; y: number }

interface AnomalyChartProps {
  pcaCoords: PCAPoint[]
  segments: number[]
  anomalyIndices: number[]
}

const SEGMENT_COLORS = ["#3b82f6","#a855f7","#10b981","#f59e0b","#06b6d4","#ec4899"]

export default function AnomalyChart({ pcaCoords, segments, anomalyIndices }: AnomalyChartProps) {
  if (!pcaCoords || pcaCoords.length === 0) return null

  const anomalySet = new Set(anomalyIndices)

  const normalData = pcaCoords
    .map((c, i) => ({ x: c.x, y: c.y, segment: segments?.[i] ?? 0, index: i }))
    .filter((_, i) => !anomalySet.has(i))

  const anomalyData = pcaCoords
    .map((c, i) => ({ x: c.x, y: c.y, segment: segments?.[i] ?? 0, index: i }))
    .filter((_, i) => anomalySet.has(i))

  const tooltipStyle = {
    backgroundColor: "#0d0e1a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#fff",
    fontSize: 11
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    return (
      <div className="bg-[#0d0e1a] border border-white/10 rounded-xl p-3 text-xs">
        <p className="text-white font-medium mb-1">
          Row #{d.index} {anomalySet.has(d.index) ? "⚠️ Anomaly" : ""}
        </p>
        <p className="text-white/40">Segment: {d.segment}</p>
        <p className="text-white/40">PC1: {Number(d.x).toFixed(3)}</p>
        <p className="text-white/40">PC2: {Number(d.y).toFixed(3)}</p>
      </div>
    )
  }

  return (
    <Card className="p-5 bg-white/5 border border-white/10 rounded-2xl">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-white">Segment Clusters</p>
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Normal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Anomaly
          </span>
        </div>
      </div>
      <p className="text-xs text-white/30 mb-4">PCA 2D projection — each colour = a segment</p>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
          <XAxis
            dataKey="x" type="number" name="PC1"
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false} tickLine={false}
            label={{ value: "PC1", position: "insideBottom", offset: -10, fill: "#475569", fontSize: 11 }}
          />
          <YAxis
            dataKey="y" type="number" name="PC2"
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false} tickLine={false}
            label={{ value: "PC2", angle: -90, position: "insideLeft", fill: "#475569", fontSize: 11 }}
          />
          <ZAxis range={[40, 40]} />
          <Tooltip content={<CustomTooltip />} />

          {/* Normal points coloured by segment */}
          <Scatter data={normalData} name="Segments">
            {normalData.map((entry, i) => (
              <Cell
                key={i}
                fill={SEGMENT_COLORS[entry.segment % SEGMENT_COLORS.length]}
                fillOpacity={0.75}
                stroke={SEGMENT_COLORS[entry.segment % SEGMENT_COLORS.length]}
                strokeWidth={1}
              />
            ))}
          </Scatter>

          {/* Anomaly points always red */}
          <Scatter data={anomalyData} name="Anomalies">
            {anomalyData.map((_, i) => (
              <Cell key={i} fill="#ef4444" fillOpacity={0.9} stroke="#ef4444" strokeWidth={1} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </Card>
  )
}
