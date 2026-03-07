"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { compareDatasets } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, ArrowLeft, Upload, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts"

export default function ComparePage() {
  const router = useRouter()
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const [label1, setLabel1] = useState("Dataset A")
  const [label2, setLabel2] = useState("Dataset B")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCompare = async () => {
    if (!file1 || !file2) { setError("Please upload both files"); return }
    setLoading(true)
    setError("")
    try {
      const data = await compareDatasets(file1, file2, label1, label2)
      setResult(data)
    } catch {
      setError("Comparison failed. Make sure both files have shared columns.")
    }
    setLoading(false)
  }

  const directionIcon = (dir: string) => {
    if (dir === "improved") return <TrendingUp className="w-4 h-4 text-green-400" />
    if (dir === "declined") return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-muted-foreground" />
  }

  const directionColor = (dir: string) =>
    dir === "improved" ? "text-green-400" : dir === "declined" ? "text-red-400" : "text-muted-foreground"

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground">Bizlytics</span>
          <span className="text-muted-foreground text-sm">/ Dataset Comparison</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* Upload Section */}
        {!result && (
          <Card className="p-8 bg-card border border-border rounded-2xl">
            <h2 className="text-xl font-bold text-foreground mb-2">Compare Two Datasets</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Upload two CSV/Excel files with shared columns — e.g. Jan vs Feb sales, before vs after campaign.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* File 1 */}
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={label1}
                  onChange={e => setLabel1(e.target.value)}
                  placeholder="Label (e.g. January)"
                  className="bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <label className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                  ${file1 ? "border-blue-500 bg-blue-500/10" : "border-border hover:border-blue-400"}`}>
                  <input
                    type="file" accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={e => setFile1(e.target.files?.[0] ?? null)}
                  />
                  <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  {file1
                    ? <p className="text-sm text-blue-400 font-medium">{file1.name}</p>
                    : <p className="text-sm text-muted-foreground">Upload first file</p>
                  }
                </label>
              </div>

              {/* File 2 */}
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={label2}
                  onChange={e => setLabel2(e.target.value)}
                  placeholder="Label (e.g. February)"
                  className="bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <label className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                  ${file2 ? "border-green-500 bg-green-500/10" : "border-border hover:border-green-400"}`}>
                  <input
                    type="file" accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={e => setFile2(e.target.files?.[0] ?? null)}
                  />
                  <Upload className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  {file2
                    ? <p className="text-sm text-green-400 font-medium">{file2.name}</p>
                    : <p className="text-sm text-muted-foreground">Upload second file</p>
                  }
                </label>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <Button
              onClick={handleCompare}
              disabled={!file1 || !file2 || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Comparing Datasets...</>
                : "⚡ Run Comparison"
              }
            </Button>
          </Card>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Reset Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">Comparison Results</h2>
              <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                ↺ New Comparison
              </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: `${result.label1} Rows`, value: result.overview[result.label1]?.rows },
                { label: `${result.label2} Rows`, value: result.overview[result.label2]?.rows },
                { label: "Metrics Compared", value: result.summary.total_metrics_compared },
                { label: "Significant Changes", value: result.summary.significant_changes },
              ].map(s => (
                <Card key={s.label} className="p-4 bg-card border border-border rounded-2xl text-center">
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </Card>
              ))}
            </div>

            {/* AI Narrative */}
            {result.narrative && (
              <Card className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                <p className="text-xs text-blue-400 font-semibold uppercase mb-3">🤖 AI Comparison Analysis</p>
                {result.narrative.split("\n\n").filter((p: string) => p.trim().length > 20).map((para: string, i: number) => (
                  <p key={i} className="text-sm text-foreground leading-relaxed mb-3">{para.trim()}</p>
                ))}
              </Card>
            )}

            {/* Improved vs Declined */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                <p className="text-sm font-semibold text-green-400 mb-2">
                  ✅ Improved Metrics ({result.summary.improved_metrics.length})
                </p>
                {result.summary.improved_metrics.length > 0
                  ? result.summary.improved_metrics.map((m: string) => (
                    <span key={m} className="inline-block text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full mr-2 mb-2">
                      {m.replace(/_/g, " ")}
                    </span>
                  ))
                  : <p className="text-xs text-muted-foreground">No significant improvements</p>
                }
              </Card>
              <Card className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <p className="text-sm font-semibold text-red-400 mb-2">
                  ⚠️ Declined Metrics ({result.summary.declined_metrics.length})
                </p>
                {result.summary.declined_metrics.length > 0
                  ? result.summary.declined_metrics.map((m: string) => (
                    <span key={m} className="inline-block text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full mr-2 mb-2">
                      {m.replace(/_/g, " ")}
                    </span>
                  ))
                  : <p className="text-xs text-muted-foreground">No significant declines</p>
                }
              </Card>
            </div>

            {/* Bar Chart — Mean Comparison */}
            {result.metric_comparison.length > 0 && (
              <Card className="p-5 bg-card border border-border rounded-2xl">
                <p className="text-sm font-semibold text-foreground mb-4">
                  📊 Metric Mean Comparison
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={result.metric_comparison.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="column" tick={{ fill: "#64748b", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                    />
                    <Legend />
                    <Bar dataKey={`${result.label1}_mean`} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={`${result.label2}_mean`} fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Detailed Metric Table */}
            <Card className="bg-card border border-border rounded-2xl overflow-auto">
              <p className="text-sm font-semibold text-foreground p-4 border-b border-border">
                📋 Detailed Metric Breakdown
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-3 text-left text-muted-foreground">Metric</th>
                    <th className="p-3 text-right text-blue-400">{result.label1} Avg</th>
                    <th className="p-3 text-right text-green-400">{result.label2} Avg</th>
                    <th className="p-3 text-center text-muted-foreground">Change</th>
                    <th className="p-3 text-center text-muted-foreground">Direction</th>
                  </tr>
                </thead>
                <tbody>
                  {result.metric_comparison.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-white/5">
                      <td className="p-3 text-foreground font-medium capitalize">
                        {row.column.replace(/_/g, " ")}
                      </td>
                      <td className="p-3 text-right text-blue-300">
                        {row[`${result.label1}_mean`].toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-green-300">
                        {row[`${result.label2}_mean`].toLocaleString()}
                      </td>
                      <td className={`p-3 text-center font-semibold ${directionColor(row.direction)}`}>
                        {row.mean_change_pct > 0 ? "+" : ""}{row.mean_change_pct}%
                      </td>
                      <td className="p-3 text-center flex justify-center">
                        {directionIcon(row.direction)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
