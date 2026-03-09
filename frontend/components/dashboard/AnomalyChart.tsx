"use client"
import { Card } from "@/components/ui/card"
import {
  ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell
} from "recharts"

type RawPCAPoint = { x: number; y: number } | [number, number]

interface AnomalyChartProps {
  pcaCoords: RawPCAPoint[]
  segments: number[]
  anomalyIndices: number[]
  segmentCount?: number
}

const SEGMENT_COLORS = [
  "#3b82f6", "#a855f7", "#10b981",
  "#f59e0b", "#06b6d4", "#ec4899"
]

export default function AnomalyChart({ pcaCoords, segments, anomalyIndices, segmentCount }: AnomalyChartProps) {
  if (!pcaCoords || pcaCoords.length === 0) return null

  const anomalySet = new Set(anomalyIndices)

  const allPoints = pcaCoords.map((c, i) => ({
    x: Number(Array.isArray(c) ? c[0] : c.x),
    y: Number(Array.isArray(c) ? c[1] : c.y),
    segment: segments?.[i] ?? 0,
    index: i,
    isAnomaly: anomalySet.has(i),
  })).filter(p => !isNaN(p.x) && !isNaN(p.y))

  const uniqueSegments = [...new Set(allPoints.filter(p => !p.isAnomaly).map(p => p.segment))].sort()
  const segmentData = uniqueSegments.map(seg =>
    allPoints.filter(p => p.segment === seg && !p.isAnomaly)
  )
  const anomalyData = allPoints.filter(p => p.isAnomaly)
  const resolvedSegmentCount = segmentCount ?? uniqueSegments.length

  const allX = allPoints.map(p => p.x)
  const allY = allPoints.map(p => p.y)
  const xMin = Math.min(...allX), xMax = Math.max(...allX)
  const yMin = Math.min(...allY), yMax = Math.max(...allY)
  const xPad = (xMax - xMin) * 0.1 || 1
  const yPad = (yMax - yMin) * 0.1 || 1
  const xDomain: [number, number] = [xMin - xPad, xMax + xPad]
  const yDomain: [number, number] = [yMin - yPad, yMax + yPad]

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    return (
      <div className="bg-[#13141f] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
        <p className="text-white font-medium mb-1">
          Row #{d.index} {d.isAnomaly ? "⚠️ Anomaly" : `· Segment ${d.segment}`}
        </p>
        <p className="text-white/40">PC1: {d.x.toFixed(3)}</p>
        <p className="text-white/40">PC2: {d.y.toFixed(3)}</p>
      </div>
    )
  }

  return (
    <Card className="p-5 bg-white/5 border border-white/10 rounded-2xl">

      {/* ── Subtitle description ── */}
      <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <p className="text-xs text-white/50 leading-relaxed">
          Your data rows have been automatically grouped into{" "}
          <span className="text-white/80 font-medium">{resolvedSegmentCount} segments</span> based
          on patterns across all columns. Rows that behave similarly appear closer together on the
          chart. <span className="text-red-400">Red dots</span> are anomalies that don't fit any
          segment well.
        </p>
      </div>

      {/* ── Chart header ── */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-white">Segment Clusters</p>

          {/* ⓘ Info tooltip */}
          <div className="group relative inline-block">
            <span className="text-white/30 text-xs cursor-help select-none">ⓘ</span>
            <div className="absolute left-0 top-5 z-20 hidden group-hover:block w-72
              bg-[#13141f] border border-white/10 rounded-xl p-3 text-xs text-white/60 shadow-xl">
              <p className="font-semibold text-white mb-1.5">How this works</p>
              <p className="leading-relaxed mb-2">
                <span className="text-white/80 font-medium">K-Means clustering</span> groups your
                rows by mathematical similarity across all numeric columns.
              </p>
              <p className="leading-relaxed mb-2">
                <span className="text-white/80 font-medium">PCA (Principal Component Analysis)</span>{" "}
                compresses all your columns into 2 axes — PC1 and PC2 — so the clusters can be
                visualised in 2D. The closer two dots are, the more similar those rows are.
              </p>
              <p className="leading-relaxed">
                <span className="text-red-400 font-medium">Red dots</span> are statistical
                anomalies — rows that sit far from any cluster centre.
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {uniqueSegments.map((seg) => (
            <span key={seg} className="flex items-center gap-1.5 text-xs text-white/40">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: SEGMENT_COLORS[seg % SEGMENT_COLORS.length] }}
              />
              Seg {seg}
            </span>
          ))}
          {anomalyData.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Anomaly
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-white/30 mb-4">
        PCA 2D projection — each colour is a distinct segment · {allPoints.length} points
      </p>

      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="x"
            type="number"
            name="PC1"
            domain={xDomain}
            tick={{ fill: "#475569", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            tickLine={false}
            tickFormatter={(v) => Number(v).toFixed(1)}
            label={{
              value: "PC1",
              position: "insideBottom",
              offset: -15,
              fill: "#475569",
              fontSize: 11,
            }}
          />
          <YAxis
            dataKey="y"
            type="number"
            name="PC2"
            domain={yDomain}
            tick={{ fill: "#475569", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            tickLine={false}
            tickFormatter={(v) => Number(v).toFixed(1)}
            label={{
              value: "PC2",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fill: "#475569",
              fontSize: 11,
            }}
          />
          <ZAxis range={[35, 35]} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
          />

          {segmentData.map((data, idx) => (
            <Scatter
              key={uniqueSegments[idx]}
              name={`Segment ${uniqueSegments[idx]}`}
              data={data}
              fill={SEGMENT_COLORS[uniqueSegments[idx] % SEGMENT_COLORS.length]}
              fillOpacity={0.8}
              stroke={SEGMENT_COLORS[uniqueSegments[idx] % SEGMENT_COLORS.length]}
              strokeWidth={0.5}
              isAnimationActive={false}
            />
          ))}

          {anomalyData.length > 0 && (
            <Scatter
              name="Anomalies"
              data={anomalyData}
              fill="#ef4444"
              fillOpacity={1}
              stroke="#fca5a5"
              strokeWidth={1.5}
              isAnimationActive={false}
            >
              {anomalyData.map((_, i) => (
                <Cell key={i} fill="#ef4444" stroke="#fca5a5" />
              ))}
            </Scatter>
          )}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Point count summary */}
      <div className="flex gap-3 mt-3 flex-wrap">
        {uniqueSegments.map(seg => {
          const count = segmentData[uniqueSegments.indexOf(seg)]?.length ?? 0
          return (
            <span
              key={seg}
              className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10"
              style={{ color: SEGMENT_COLORS[seg % SEGMENT_COLORS.length] }}
            >
              Seg {seg}: {count} rows
            </span>
          )
        })}
        {anomalyData.length > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
            ⚠️ {anomalyData.length} anomalies
          </span>
        )}
      </div>
    </Card>
  )
}
