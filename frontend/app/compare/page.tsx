"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { compareDatasets } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart3, ArrowLeft, Upload, Loader2,
  TrendingUp, TrendingDown, Minus, History, Settings
} from "lucide-react"
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
      setError("Comparison failed. Make sure both files have shared numeric columns.")
    }
    setLoading(false)
  }

  const directionIcon = (dir: string) => {
    if (dir === "improved") return <TrendingUp className="w-4 h-4 text-green-400" />
    if (dir === "declined")  return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-white/30" />
  }

  const directionColor = (dir: string) =>
    dir === "improved" ? "text-green-400" : dir === "declined" ? "text-red-400" : "text-white/30"

  return (
    <div className="min-h-screen bg-[#0d0e1a] text-white">

      {/* ── Header ───────────────────────────────────── */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0d0e1a]/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost" size="icon"
            onClick={() => router.push("/")}
            className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white leading-none">Bizlytics</p>
            <p className="text-xs text-white/30">Dataset Comparison</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <a
            href="/history"
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:block">History</span>
          </a>
          <a
            href="/settings"
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Settings</span>
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* ── Upload Section ───────────────────────────── */}
        {!result && (
          <Card className="p-8 bg-white/5 border border-white/10 rounded-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Compare Two Datasets</h2>
              <p className="text-sm text-white/40 leading-relaxed">
                Upload two CSV/Excel files with shared columns — e.g. Jan vs Feb sales, before vs after a campaign.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              {/* File 1 */}
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={label1}
                  onChange={e => setLabel1(e.target.value)}
                  placeholder="Label (e.g. January)"
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white
                    placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50
                    focus:border-purple-500/50 transition-all"
                />
                <label className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                  ${file1
                    ? "border-purple-500/60 bg-purple-500/10"
                    : "border-white/10 hover:border-purple-400/50 hover:bg-white/5"
                  }`}>
                  <input
                    type="file" accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={e => setFile1(e.target.files?.[0] ?? null)}
                  />
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${file1 ? "text-purple-400" : "text-white/20"}`} />
                  {file1
                    ? <p className="text-sm text-purple-400 font-medium">{file1.name}</p>
                    : <>
                        <p className="text-sm text-white/40">Upload first file</p>
                        <p className="text-xs text-white/20 mt-1">CSV, XLSX, XLS</p>
                      </>
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
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white
                    placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50
                    focus:border-blue-500/50 transition-all"
                />
                <label className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                  ${file2
                    ? "border-blue-500/60 bg-blue-500/10"
                    : "border-white/10 hover:border-blue-400/50 hover:bg-white/5"
                  }`}>
                  <input
                    type="file" accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={e => setFile2(e.target.files?.[0] ?? null)}
                  />
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${file2 ? "text-blue-400" : "text-white/20"}`} />
                  {file2
                    ? <p className="text-sm text-blue-400 font-medium">{file2.name}</p>
                    : <>
                        <p className="text-sm text-white/40">Upload second file</p>
                        <p className="text-xs text-white/20 mt-1">CSV, XLSX, XLS</p>
                      </>
                  }
                </label>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              onClick={handleCompare}
              disabled={!file1 || !file2 || loading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500
                hover:from-purple-600 hover:to-blue-600
                text-white border-0 rounded-xl py-3 font-semibold
                shadow-lg shadow-purple-500/20 disabled:opacity-40"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Comparing Datasets...</>
                : "⚡ Run Comparison"
              }
            </Button>
          </Card>
        )}

        {/* ── Results ──────────────────────────────────── */}
        {result && (
          <>
            {/* Results header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Comparison Results</h2>
                <p className="text-sm text-white/30 mt-0.5">
                  {result.label1} vs {result.label2}
                </p>
              </div>
              <Button
                variant="ghost" size="sm"
                onClick={() => setResult(null)}
                className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl gap-1.5"
              >
                ↺ New Comparison
              </Button>
            </div>

            {/* Overview stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: `${result.label1} Rows`,    value: result.overview?.[result.label1]?.rows  ?? "—", color: "text-purple-300" },
                { label: `${result.label2} Rows`,    value: result.overview?.[result.label2]?.rows  ?? "—", color: "text-blue-300" },
                { label: "Metrics Compared",         value: result.summary?.total_metrics_compared  ?? "—", color: "text-white" },
                { label: "Significant Changes",      value: result.summary?.significant_changes     ?? "—", color: "text-yellow-300" },
              ].map(s => (
                <Card key={s.label} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-white/30 mt-1">{s.label}</p>
                </Card>
              ))}
            </div>

            {/* AI Narrative */}
            {result.narrative && (
              <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl">
                <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-3">
                  🤖 AI Comparison Analysis
                </p>
                {result.narrative
                  .split("\n\n")
                  .filter((p: string) => p.trim().length > 20)
                  .map((para: string, i: number) => (
                    <p key={i} className="text-sm text-white/70 leading-relaxed mb-3">{para.trim()}</p>
                  ))
                }
              </Card>
            )}

            {/* Improved vs Declined */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                <p className="text-sm font-semibold text-green-400 mb-3">
                  ✅ Improved Metrics ({result.summary?.improved_metrics?.length ?? 0})
                </p>
                {result.summary?.improved_metrics?.length > 0
                  ? result.summary.improved_metrics.map((m: string) => (
                      <span key={m} className="inline-block text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full mr-2 mb-2">
                        {m.replace(/_/g, " ")}
                      </span>
                    ))
                  : <p className="text-xs text-white/20">No significant improvements</p>
                }
              </Card>
              <Card className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <p className="text-sm font-semibold text-red-400 mb-3">
                  ⚠️ Declined Metrics ({result.summary?.declined_metrics?.length ?? 0})
                </p>
                {result.summary?.declined_metrics?.length > 0
                  ? result.summary.declined_metrics.map((m: string) => (
                      <span key={m} className="inline-block text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full mr-2 mb-2">
                        {m.replace(/_/g, " ")}
                      </span>
                    ))
                  : <p className="text-xs text-white/20">No significant declines</p>
                }
              </Card>
            </div>

            {/* Bar Chart — Mean Comparison */}
            {result.metric_comparison?.length > 0 && (
              <Card className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-sm font-semibold text-white mb-4">
                  📊 Metric Mean Comparison
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={result.metric_comparison.slice(0, 8)} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="column"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false} tickLine={false}
                      angle={-30} textAnchor="end"
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#13141f",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        color: "#fff",
                        fontSize: 11,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: "#94a3b8", fontSize: 12 }}
                    />
                    <Bar
                      dataKey={`${result.label1}_mean`}
                      name={result.label1}
                      fill="#a855f7"
                      radius={[4, 4, 0, 0]}
                      fillOpacity={0.85}
                    />
                    <Bar
                      dataKey={`${result.label2}_mean`}
                      name={result.label2}
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      fillOpacity={0.85}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Detailed Metric Table */}
            <Card className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <p className="text-sm font-semibold text-white p-4 border-b border-white/10">
                📋 Detailed Metric Breakdown
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="p-3 text-left text-white/40 font-medium">Metric</th>
                      <th className="p-3 text-right text-purple-400 font-medium">{result.label1} Avg</th>
                      <th className="p-3 text-right text-blue-400 font-medium">{result.label2} Avg</th>
                      <th className="p-3 text-center text-white/40 font-medium">Change %</th>
                      <th className="p-3 text-center text-white/40 font-medium">Direction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.metric_comparison.map((row: any, i: number) => (
                      <tr
                        key={i}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-3 text-white font-medium capitalize">
                          {row.column.replace(/_/g, " ")}
                        </td>
                        <td className="p-3 text-right text-purple-300 font-mono">
                          {Number(row[`${result.label1}_mean`]).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right text-blue-300 font-mono">
                          {Number(row[`${result.label2}_mean`]).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td className={`p-3 text-center font-semibold font-mono ${directionColor(row.direction)}`}>
                          {row.mean_change_pct > 0 ? "+" : ""}{row.mean_change_pct}%
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center">
                            {directionIcon(row.direction)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
