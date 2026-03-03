import { Card } from "@/components/ui/card"
import { DataQuality } from "@/lib/types"

export default function DataHealthCard({ quality }: { quality: DataQuality }) {
  const totalCells = quality.total_rows * quality.total_columns
  const totalMissing = Object.values(quality.missing_values).reduce((sum, v) => sum + v.count, 0)
  const missingPct = totalCells > 0 ? ((totalMissing / totalCells) * 100).toFixed(1) : "0"
  const healthScore = Math.max(0, 100 - Number(missingPct) - (quality.duplicate_rows / quality.total_rows) * 100)
  const scoreColor = healthScore >= 90 ? "text-green-400" : healthScore >= 70 ? "text-yellow-400" : "text-red-400"
  const scoreBg = healthScore >= 90 ? "bg-green-500/10 border-green-500/20" : healthScore >= 70 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-red-500/10 border-red-500/20"

  const missingCols = Object.entries(quality.missing_values)
    .filter(([_, v]) => v.count > 0)
    .sort((a, b) => b[1].count - a[1].count)

  return (
    <Card className={`p-5 border rounded-2xl ${scoreBg}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Data Health Score</p>
          <p className={`text-4xl font-bold ${scoreColor}`}>{healthScore.toFixed(0)}%</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {healthScore >= 90 ? "✅ Excellent" : healthScore >= 70 ? "⚠️ Needs Attention" : "❌ Poor Quality"}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total Cells", value: totalCells.toLocaleString() },
          { label: "Missing Values", value: `${totalMissing} (${missingPct}%)`, highlight: Number(missingPct) > 5 },
          { label: "Duplicate Rows", value: quality.duplicate_rows, highlight: quality.duplicate_rows > 0 },
          { label: "Complete Rows", value: `${(quality.total_rows - quality.duplicate_rows).toLocaleString()}` },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={`text-sm font-bold ${s.highlight ? "text-yellow-400" : "text-foreground"}`}>
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Data Completeness</span>
          <span>{(100 - Number(missingPct)).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${healthScore >= 90 ? "bg-green-500" : healthScore >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${100 - Number(missingPct)}%` }}
          />
        </div>
      </div>

      {/* Missing value breakdown */}
      {missingCols.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Missing Values by Column:</p>
          <div className="flex flex-col gap-1">
            {missingCols.slice(0, 5).map(([col, val]) => (
              <div key={col} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-32 truncate capitalize">
                  {col.replace(/_/g, " ")}
                </span>
                <div className="flex-1 bg-muted rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-yellow-500"
                    style={{ width: `${val.pct}%` }}
                  />
                </div>
                <span className="text-xs text-yellow-400 w-12 text-right">{val.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {missingCols.length === 0 && (
        <p className="text-xs text-green-400">✅ No missing values — your dataset is complete!</p>
      )}
    </Card>
  )
}
