"use client"
import { Card } from "@/components/ui/card"

export default function CorrelationHeatmap({ correlations }: { correlations: Record<string, Record<string, number>> }) {
  const cols = Object.keys(correlations)
  if (cols.length === 0) return null

  const getColor = (val: number) => {
    if (val >= 0.7) return "bg-blue-600 text-white"
    if (val >= 0.4) return "bg-blue-400/50 text-white"
    if (val >= 0) return "bg-slate-700 text-muted-foreground"
    if (val >= -0.4) return "bg-orange-400/40 text-white"
    return "bg-red-600 text-white"
  }

  return (
    <Card className="p-5 bg-card border border-border rounded-2xl overflow-auto">
      <p className="text-sm font-semibold text-foreground mb-4">🔗 Correlation Matrix</p>
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr>
            <th className="p-2" />
            {cols.map(c => (
              <th key={c} className="p-2 text-muted-foreground font-medium text-center max-w-16 truncate">
                {c.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cols.map(row => (
            <tr key={row}>
              <td className="p-2 text-muted-foreground font-medium truncate max-w-24">{row.replace(/_/g, " ")}</td>
              {cols.map(col => {
                const val = correlations[row]?.[col] ?? 0
                return (
                  <td key={col} className={`p-2 text-center rounded font-semibold ${getColor(val)}`}>
                    {val.toFixed(2)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
