"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { compareDatasets, compareMultipleDatasets, getComparisonSession, exportComparisonPdf } from "@/lib/api"
import { MultiCompareResult, PartialColumnEntry } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  BarChart3, ArrowLeft, Upload, Loader2, TrendingUp,
  TrendingDown, Minus, History, Settings, PlusCircle, Trash2,
  CheckCircle2, XCircle, AlertCircle, ShieldCheck, FileDown,
} from "lucide-react"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"

const COLORS = [
  "#a855f7", "#3b82f6", "#22c55e", "#f59e0b",
  "#ef4444", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#84cc16",
]

function labelFromFile(file: File, index: number): string {
  const name = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim()
  return name || `File ${index + 1}`
}

interface FileEntry { file: File | null }
const emptyEntry = (): FileEntry => ({ file: null })

// ─────────────────────────────────────────────────────────────
export default function ComparePage() {
  const router = useRouter()

  // ── unified upload state ──
  const [entries, setEntries]   = useState<FileEntry[]>([emptyEntry(), emptyEntry()])

  // ── two-file result state ──
  const [twoResult, setTwoResult] = useState<any>(null)
  const [label1, setLabel1]       = useState("Dataset A")
  const [label2, setLabel2]       = useState("Dataset B")

  // ── multi-file result state ──
  const [multiResult, setMultiResult] = useState<MultiCompareResult | null>(null)
  const [selectedCol, setSelectedCol] = useState("")

  const [loading, setLoading]     = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError]           = useState("")

  // derived: how many files are filled in
  const filledEntries = entries.filter(e => e.file)
  const fileCount     = filledEntries.length
  const isTwoMode     = fileCount <= 2

  // ─────────────────────────────────────────────────────────────
  //  Restore from history — runs once on mount
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const sessionId = sessionStorage.getItem("comparison_session_id")
    if (!sessionId) return
    sessionStorage.removeItem("comparison_session_id")

    setLoading(true)
    getComparisonSession(sessionId)
      .then((session) => {
        const result = session.result
        if (session.type === "two") {
          setTwoResult(result)
          setLabel1(session.labels?.[0] ?? "Dataset A")
          setLabel2(session.labels?.[1] ?? "Dataset B")
        } else {
          setMultiResult(result)
          setSelectedCol(result.common_columns?.[0] ?? "")
        }
      })
      .catch(() => toast.error("Could not restore comparison session"))
      .finally(() => setLoading(false))
  }, [])

  // ── helpers ──────────────────────────────────────────────────
  const addEntry    = () => { if (entries.length < 10) setEntries([...entries, emptyEntry()]) }
  const removeEntry = (i: number) => { if (entries.length > 2) setEntries(entries.filter((_, idx) => idx !== i)) }
  const setFile     = (i: number, file: File | null) => {
    const next = [...entries]; next[i] = { file }; setEntries(next)
  }

  const directionIcon = (dir: string) => {
    if (dir === "improved") return <TrendingUp  className="w-4 h-4 text-green-400" />
    if (dir === "declined") return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-white/30" />
  }
  const directionColor = (dir: string) =>
    dir === "improved" ? "text-green-400" : dir === "declined" ? "text-red-400" : "text-white/30"

  const stabilityColor = (score: number) =>
    score >= 80 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400"
  const stabilityLabel = (score: number) =>
    score >= 80 ? "Stable" : score >= 50 ? "Moderate" : "Unstable"


  // ── PDF export ────────────────────────────────────────────────
  const handleExportPdf = async () => {
    setPdfLoading(true)
    try {
      const payload = twoResult
        ? { type: "two" as const,   result: twoResult }
        : { type: "multi" as const, result: multiResult }
      const blob = await exportComparisonPdf(payload)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = twoResult
        ? `comparison-${twoResult.label1}-vs-${twoResult.label2}.pdf`
        : `multi-comparison-${multiResult!.labels.join("-")}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("PDF exported successfully")
    } catch {
      toast.error("Failed to export PDF")
    }
    setPdfLoading(false)
  }

  // ── unified handler — auto-routes based on file count ────────
  const handleCompare = async () => {
    if (filledEntries.length < 2) { setError("Please upload at least 2 files"); return }
    setLoading(true); setError("")

    try {
      if (filledEntries.length === 2) {
        // ── two-file path ──
        const [f1, f2] = filledEntries.map(e => e.file!)
        const l1 = labelFromFile(f1, 0)
        const l2 = labelFromFile(f2, 1)
        setLabel1(l1); setLabel2(l2)
        const data = await compareDatasets(f1, f2, l1, l2)
        setTwoResult(data)
      } else {
        // ── multi-file path ──
        const files  = filledEntries.map(e => e.file!)
        const labels = files.map((f, i) => labelFromFile(f, i))
        const data   = await compareMultipleDatasets(files, labels)
        setMultiResult(data)
        setSelectedCol(data.common_columns[0] ?? "")
      }
    } catch (e: any) {
      setError(e.message ?? "Comparison failed. Make sure files share numeric columns.")
    }
    setLoading(false)
  }

  // ── chart data ────────────────────────────────────────────────
  const trendData = multiResult && selectedCol
    ? multiResult.labels.map((lbl, i) => ({
        label: lbl,
        Mean:  multiResult.trend_analysis[selectedCol]?.means[i],
        Total: multiResult.trend_analysis[selectedCol]?.totals[i],
      }))
    : []

  const growthData = multiResult && selectedCol
    ? multiResult.growth_rates[selectedCol]?.map(g => ({
        period: `${g.from}→${g.to}`,
        "Growth %": g.growth_pct,
      }))
    : []

  // ── restore loading overlay ───────────────────────────────────
  if (loading && !twoResult && !multiResult) {
    return (
      <div className="min-h-screen bg-[#0d0e1a] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          <p className="text-white/50 text-sm">Restoring comparison…</p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0d0e1a] text-white">

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0d0e1a]/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}
            className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl">
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
          <a href="/history" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 px-3 py-1.5 rounded-lg hover:bg-white/5">
            <History className="w-3.5 h-3.5" /><span className="hidden sm:block">History</span>
          </a>
          <a href="/settings" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 px-3 py-1.5 rounded-lg hover:bg-white/5">
            <Settings className="w-3.5 h-3.5" /><span className="hidden sm:block">Settings</span>
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* ════════════════════════════════════════════════════
            UPLOAD FORM  (shown when no result yet)
        ════════════════════════════════════════════════════ */}
        {!twoResult && !multiResult && (
          <Card className="p-8 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Compare Datasets</h2>
                <p className="text-sm text-white/40 leading-relaxed">
                  Upload 2 files for a side-by-side diff, or up to 10 files for multi-period trend analysis.
                  Labels are auto-detected from filenames.
                </p>
              </div>
              {/* live badge — updates as user adds files */}
              <span className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                fileCount >= 3
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-300"
                  : "bg-purple-500/10 border-purple-500/20 text-purple-300"
              }`}>
                {fileCount >= 3 ? `Multi-period (${entries.length} files)` : `Side-by-side (2 files)`}
              </span>
            </div>

            {/* File slots */}
            <div className="flex flex-col gap-3 mb-6">
              {entries.map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                    {i + 1}
                  </div>
                  <label className={`flex-1 flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                    entry.file ? "border-opacity-60 bg-opacity-10" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                  }`} style={entry.file ? { borderColor: COLORS[i % COLORS.length] + "99", backgroundColor: COLORS[i % COLORS.length] + "15" } : {}}>
                    <input type="file" accept=".csv,.xlsx,.xls" className="hidden"
                      onChange={e => setFile(i, e.target.files?.[0] ?? null)} />
                    <Upload className="w-4 h-4 flex-shrink-0"
                      style={{ color: entry.file ? COLORS[i % COLORS.length] : "#ffffff33" }} />
                    <div className="flex-1 min-w-0">
                      {entry.file ? (
                        <div>
                          <p className="text-sm font-medium truncate" style={{ color: COLORS[i % COLORS.length] }}>
                            {entry.file.name}
                          </p>
                          <p className="text-xs text-white/30 mt-0.5">
                            Label: <span className="text-white/50">{labelFromFile(entry.file, i)}</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-white/30">Click to upload CSV / Excel</p>
                      )}
                    </div>
                  </label>
                  <button onClick={() => removeEntry(i)} disabled={entries.length <= 2}
                    className="text-white/20 hover:text-red-400 disabled:opacity-0 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add file + mode hint */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <Button variant="ghost" onClick={addEntry} disabled={entries.length >= 10}
                className="text-white/40 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl gap-2">
                <PlusCircle className="w-4 h-4" /> Add File
              </Button>
              {entries.length === 2 && (
                <p className="text-xs text-white/20">
                  Add a 3rd file to switch to multi-period trend mode
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              onClick={handleCompare}
              disabled={filledEntries.length < 2 || loading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 rounded-xl py-3 font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-40">
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing {filledEntries.length} files…</>
                : `⚡ ${filledEntries.length >= 3 ? `Analyze ${filledEntries.length} Files` : "Run Comparison"}`}
            </Button>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════
            TWO-FILE RESULTS
        ════════════════════════════════════════════════════ */}
        {twoResult && (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Comparison Results</h2>
                <p className="text-sm text-white/30 mt-0.5">{twoResult.label1} vs {twoResult.label2}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost" size="sm"
                  onClick={handleExportPdf}
                  disabled={pdfLoading}
                  className="text-white/40 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl gap-1.5 disabled:opacity-40">
                  {pdfLoading
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Exporting…</>
                    : <><FileDown className="w-3.5 h-3.5" />Export PDF</>}
                </Button>
                <Button variant="ghost" size="sm"
                  onClick={() => { setTwoResult(null); setEntries([emptyEntry(), emptyEntry()]) }}
                  className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl gap-1.5">↺ New Comparison</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: `${twoResult.label1} Rows`,  value: twoResult.overview?.[twoResult.label1]?.rows ?? "—", color: "text-purple-300" },
                { label: `${twoResult.label2} Rows`,  value: twoResult.overview?.[twoResult.label2]?.rows ?? "—", color: "text-blue-300" },
                { label: "Metrics Compared",          value: twoResult.summary?.total_metrics_compared ?? "—",    color: "text-white" },
                { label: "Significant Changes",       value: twoResult.summary?.significant_changes ?? "—",       color: "text-yellow-300" },
              ].map(s => (
                <Card key={s.label} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-white/30 mt-1">{s.label}</p>
                </Card>
              ))}
            </div>
            {twoResult.narrative && (
              <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl">
                <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-3">🤖 AI Comparison Analysis</p>
                {twoResult.narrative.split("\n\n").filter((p: string) => p.trim().length > 20).map((para: string, i: number) => (
                  <p key={i} className="text-sm text-white/70 leading-relaxed mb-3">{para.trim()}</p>
                ))}
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                <p className="text-sm font-semibold text-green-400 mb-3">✅ Improved ({twoResult.summary?.improved_metrics?.length ?? 0})</p>
                {twoResult.summary?.improved_metrics?.length > 0
                  ? twoResult.summary.improved_metrics.map((m: string) => <span key={m} className="inline-block text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full mr-2 mb-2">{m.replace(/_/g, " ")}</span>)
                  : <p className="text-xs text-white/20">No significant improvements</p>}
              </Card>
              <Card className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <p className="text-sm font-semibold text-red-400 mb-3">⚠️ Declined ({twoResult.summary?.declined_metrics?.length ?? 0})</p>
                {twoResult.summary?.declined_metrics?.length > 0
                  ? twoResult.summary.declined_metrics.map((m: string) => <span key={m} className="inline-block text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full mr-2 mb-2">{m.replace(/_/g, " ")}</span>)
                  : <p className="text-xs text-white/20">No significant declines</p>}
              </Card>
            </div>
            {twoResult.metric_comparison?.length > 0 && (
              <Card className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-sm font-semibold text-white mb-4">📊 Metric Mean Comparison</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={twoResult.metric_comparison.slice(0, 8)} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="column" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#13141f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 11 }} />
                    <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                    <Bar dataKey={`${twoResult.label1}_mean`} name={twoResult.label1} fill="#a855f7" radius={[4,4,0,0]} fillOpacity={0.85} />
                    <Bar dataKey={`${twoResult.label2}_mean`} name={twoResult.label2} fill="#3b82f6" radius={[4,4,0,0]} fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
            <Card className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <p className="text-sm font-semibold text-white p-4 border-b border-white/10">📋 Detailed Metric Breakdown</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="p-3 text-left text-white/40 font-medium">Metric</th>
                      <th className="p-3 text-right text-purple-400 font-medium">{twoResult.label1} Avg</th>
                      <th className="p-3 text-right text-blue-400 font-medium">{twoResult.label2} Avg</th>
                      <th className="p-3 text-center text-white/40 font-medium">Change %</th>
                      <th className="p-3 text-center text-white/40 font-medium">Direction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {twoResult.metric_comparison.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3 text-white font-medium capitalize">{row.column.replace(/_/g, " ")}</td>
                        <td className="p-3 text-right text-purple-300 font-mono">{Number(row[`${twoResult.label1}_mean`]).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right text-blue-300 font-mono">{Number(row[`${twoResult.label2}_mean`]).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className={`p-3 text-center font-semibold font-mono ${directionColor(row.direction)}`}>{row.mean_change_pct > 0 ? "+" : ""}{row.mean_change_pct}%</td>
                        <td className="p-3"><div className="flex justify-center">{directionIcon(row.direction)}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            MULTI-FILE RESULTS
        ════════════════════════════════════════════════════ */}
        {multiResult && (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Multi-Period Results</h2>
                <p className="text-sm text-white/30 mt-0.5">{multiResult.labels.join(" → ")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost" size="sm"
                  onClick={handleExportPdf}
                  disabled={pdfLoading}
                  className="text-white/40 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl gap-1.5 disabled:opacity-40">
                  {pdfLoading
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Exporting…</>
                    : <><FileDown className="w-3.5 h-3.5" />Export PDF</>}
                </Button>
                <Button variant="ghost" size="sm"
                  onClick={() => { setMultiResult(null); setEntries([emptyEntry(), emptyEntry()]) }}
                  className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl gap-1.5">
                  ↺ New Comparison
                </Button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Files Compared",    value: multiResult.file_count,                      color: "text-purple-300" },
                { label: "Metrics Tracked",   value: multiResult.summary.total_metrics_compared,  color: "text-blue-300" },
                { label: "Improving Metrics", value: multiResult.summary.improved_metrics.length, color: "text-green-400" },
                { label: "Declining Metrics", value: multiResult.summary.declined_metrics.length, color: "text-red-400" },
              ].map(s => (
                <Card key={s.label} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-white/30 mt-1">{s.label}</p>
                </Card>
              ))}
            </div>

            {/* Schema health banner */}
            {multiResult.column_evolution && (
              <Card className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-5 h-5 ${stabilityColor(multiResult.column_evolution.schema_stability)}`} />
                    <div>
                      <p className="text-xs text-white/30 leading-none mb-0.5">Schema Stability</p>
                      <p className={`text-lg font-bold ${stabilityColor(multiResult.column_evolution.schema_stability)}`}>
                        {multiResult.column_evolution.schema_stability}%
                        <span className="text-sm font-normal ml-1">— {stabilityLabel(multiResult.column_evolution.schema_stability)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  {[
                    { label: "Common",  value: multiResult.column_evolution.common_columns.length,  color: "text-green-400",  icon: <CheckCircle2 className="w-4 h-4" /> },
                    { label: "Partial", value: multiResult.column_evolution.partial_columns.length, color: "text-yellow-400", icon: <AlertCircle  className="w-4 h-4" /> },
                    { label: "Unique",  value: multiResult.column_evolution.unique_columns.length,  color: "text-white/40",   icon: <XCircle      className="w-4 h-4" /> },
                    { label: "New",     value: multiResult.column_evolution.new_columns.length,     color: "text-blue-400",   icon: <PlusCircle   className="w-4 h-4" /> },
                    { label: "Dropped", value: multiResult.column_evolution.dropped_columns.length, color: "text-red-400",    icon: <Trash2       className="w-4 h-4" /> },
                  ].map(b => (
                    <div key={b.label} className={`flex items-center gap-2 ${b.color}`}>
                      {b.icon}
                      <div>
                        <p className="text-sm font-bold leading-none">{b.value}</p>
                        <p className="text-xs text-white/30 leading-none mt-0.5">{b.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* AI Narrative */}
            {multiResult.narrative && (
              <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl">
                <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-3">🤖 AI Multi-Period Analysis</p>
                {multiResult.narrative.split("\n\n").filter(p => p.trim().length > 20).map((para, i) => (
                  <p key={i} className="text-sm text-white/70 leading-relaxed mb-3">{para.trim()}</p>
                ))}
              </Card>
            )}

            {/* Metric selector */}
            {multiResult.common_columns.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/40">Metric:</span>
                <select value={selectedCol} onChange={e => setSelectedCol(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                  {multiResult.common_columns.map(col => (
                    <option key={col} value={col} className="bg-[#13141f]">{col.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="trend">
              <TabsList className="bg-white/5 border border-white/10 rounded-xl p-1 flex-wrap gap-1">
                {["trend", "growth", "schema", "partial", "performance"].map(t => (
                  <TabsTrigger key={t} value={t}
                    className="rounded-lg text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
                    {t === "trend" ? "📈 Trend" : t === "growth" ? "📊 YoY Growth" : t === "schema" ? "🗂️ Schema" : t === "partial" ? "⚠️ Partial Cols" : "🏆 Performance"}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="trend">
                <Card className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-sm font-semibold text-white mb-4">"{selectedCol.replace(/_/g, " ")}" — Mean Across Files</p>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#13141f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 11 }} />
                      <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                      <Line type="monotone" dataKey="Mean" stroke={COLORS[0]} strokeWidth={2.5} dot={{ r: 5, fill: COLORS[0] }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="Total" stroke={COLORS[1]} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: COLORS[1] }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </TabsContent>

              <TabsContent value="growth">
                <Card className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-sm font-semibold text-white mb-4">"{selectedCol.replace(/_/g, " ")}" — Growth % Between Files</p>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="period" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: "#13141f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 11 }}
                        formatter={(v: any) => [`${v}%`, "Growth"]} />
                      <Bar dataKey="Growth %" radius={[4, 4, 0, 0]} fill={COLORS[2]} fillOpacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </TabsContent>

              <TabsContent value="schema">
                <div className="flex flex-col gap-4">
                  {multiResult.column_evolution.per_period_stats.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-white mb-3">File-by-File Schema Changes</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {multiResult.column_evolution.per_period_stats.map((ps, i) => (
                          <Card key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                <span className="font-semibold text-white text-sm">{ps.label}</span>
                              </div>
                              <span className="text-xs text-white/30">{ps.total_cols} cols</span>
                            </div>
                            {i === 0 ? (
                              <p className="text-xs text-white/30 italic">Baseline file</p>
                            ) : (
                              <>
                                {ps.new_vs_prev.length > 0 && (
                                  <div>
                                    <p className="text-xs text-green-400 font-medium mb-1">+ Added ({ps.new_vs_prev.length})</p>
                                    <div className="flex flex-wrap gap-1">
                                      {ps.new_vs_prev.map(c => <span key={c} className="text-xs bg-green-500/15 text-green-300 px-2 py-0.5 rounded-full">{c.replace(/_/g, " ")}</span>)}
                                    </div>
                                  </div>
                                )}
                                {ps.dropped_vs_prev.length > 0 && (
                                  <div>
                                    <p className="text-xs text-red-400 font-medium mb-1">− Removed ({ps.dropped_vs_prev.length})</p>
                                    <div className="flex flex-wrap gap-1">
                                      {ps.dropped_vs_prev.map(c => <span key={c} className="text-xs bg-red-500/15 text-red-300 px-2 py-0.5 rounded-full">{c.replace(/_/g, " ")}</span>)}
                                    </div>
                                  </div>
                                )}
                                {ps.new_vs_prev.length === 0 && ps.dropped_vs_prev.length === 0 && (
                                  <p className="text-xs text-white/30 italic flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-green-400" /> Same schema as previous file
                                  </p>
                                )}
                              </>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  <Card className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <p className="text-sm font-semibold text-white p-4 border-b border-white/10">
                      Column Presence Matrix
                      <span className="text-xs text-white/30 font-normal ml-2">— ✓ present / ✗ missing per file</span>
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5">
                            <th className="p-3 text-left text-white/40 font-medium sticky left-0 bg-[#181927] z-10">Column</th>
                            {multiResult.labels.map((lbl, i) => (
                              <th key={i} className="p-3 text-center font-medium" style={{ color: COLORS[i] }}>{lbl}</th>
                            ))}
                            <th className="p-3 text-center text-white/40 font-medium">Coverage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {multiResult.column_evolution.all_columns.map(col => {
                            const row   = multiResult.column_evolution.presence_matrix[col]
                            const count = Object.values(row).filter(Boolean).length
                            const pct   = Math.round(count / multiResult.labels.length * 100)
                            const isCommon = count === multiResult.labels.length
                            const isUnique = count === 1
                            return (
                              <tr key={col} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-3 sticky left-0 bg-[#0d0e1a] z-10">
                                  <span className={`font-medium capitalize ${isCommon ? "text-white" : isUnique ? "text-white/30" : "text-yellow-300"}`}>
                                    {col.replace(/_/g, " ")}
                                  </span>
                                </td>
                                {multiResult.labels.map((lbl, i) => (
                                  <td key={i} className="p-3 text-center">
                                    {row[lbl]
                                      ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                                      : <XCircle      className="w-4 h-4 text-white/15 mx-auto" />}
                                  </td>
                                ))}
                                <td className="p-3 text-center">
                                  <span className={`font-mono font-semibold ${pct === 100 ? "text-green-400" : pct >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                                    {pct}%
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="partial">
                {multiResult.partial_analysis.length === 0 ? (
                  <Card className="p-10 bg-white/5 border border-white/10 rounded-2xl text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="text-white font-semibold">All columns are consistent across every file!</p>
                    <p className="text-sm text-white/30 mt-1">There are no partially-present columns to analyse.</p>
                  </Card>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-white/40">Columns present in some files but not all — still analysed with available data.</p>
                    {multiResult.partial_analysis.map((entry: PartialColumnEntry, i) => (
                      <Card key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-white capitalize">{entry.column.replace(/_/g, " ")}</p>
                              <p className="text-xs text-white/30 mt-0.5">
                                Present in {entry.available_in.length} of {multiResult.file_count} files ({entry.coverage_pct}% coverage)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-yellow-400" style={{ width: `${entry.coverage_pct}%` }} />
                            </div>
                            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                              entry.overall_trend === "upward"   ? "bg-green-500/10 border-green-500/20 text-green-400" :
                              entry.overall_trend === "downward" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                              "bg-white/5 border-white/10 text-white/40"
                            }`}>
                              {entry.overall_trend === "upward"   ? <TrendingUp   className="w-3 h-3" /> :
                               entry.overall_trend === "downward" ? <TrendingDown className="w-3 h-3" /> :
                               <Minus className="w-3 h-3" />}
                              {entry.overall_trend}
                            </span>
                          </div>
                        </div>
                        <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2">
                          {multiResult.labels.map((lbl, li) => {
                            const present = entry.available_in.includes(lbl)
                            return (
                              <span key={li} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${present ? "bg-green-500/15 text-green-300" : "bg-white/5 text-white/20 line-through"}`}>
                                {present ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {lbl}
                              </span>
                            )
                          })}
                        </div>
                        <div className="overflow-x-auto px-4 pb-4">
                          <table className="w-full text-xs mt-2">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="pb-2 text-left text-white/40 font-medium">File</th>
                                <th className="pb-2 text-right text-white/40 font-medium">Mean</th>
                                <th className="pb-2 text-right text-white/40 font-medium">Total</th>
                                <th className="pb-2 text-right text-white/40 font-medium">Std Dev</th>
                                <th className="pb-2 text-right text-white/40 font-medium">Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.per_period.map((pp, pi) => (
                                <tr key={pi} className="border-b border-white/5">
                                  <td className="py-2 text-white font-medium">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: COLORS[multiResult.labels.indexOf(pp.label)] ?? "#fff" }} />
                                      {pp.label}
                                      {pp.label === entry.best_period  && <span className="text-green-400 text-xs">(best)</span>}
                                      {pp.label === entry.worst_period && <span className="text-red-400 text-xs">(worst)</span>}
                                    </div>
                                  </td>
                                  <td className="py-2 text-right text-white/70 font-mono">{pp.mean.toLocaleString()}</td>
                                  <td className="py-2 text-right text-white/70 font-mono">{pp.total.toLocaleString()}</td>
                                  <td className="py-2 text-right text-white/50 font-mono">{pp.std.toLocaleString()}</td>
                                  <td className="py-2 text-right text-white/50 font-mono">{pp.count.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="performance">
                <Card className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <p className="text-sm font-semibold text-white p-4 border-b border-white/10">🏆 Best / Worst File by Metric</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="p-3 text-left text-white/40 font-medium">Metric</th>
                          <th className="p-3 text-left text-green-400 font-medium">Best</th>
                          <th className="p-3 text-left text-red-400 font-medium">Worst</th>
                          <th className="p-3 text-left text-white/40 font-medium">Total Growth</th>
                          <th className="p-3 text-left text-white/40 font-medium">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(multiResult.performance).map(([col, p]) => (
                          <tr key={col} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-3 text-white font-medium capitalize">{col.replace(/_/g, " ")}</td>
                            <td className="p-3 text-green-400 font-semibold">{p.best}</td>
                            <td className="p-3 text-red-400 font-semibold">{p.worst}</td>
                            <td className={`p-3 font-mono font-semibold ${(p.total_growth_pct ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {p.total_growth_pct != null ? `${p.total_growth_pct > 0 ? "+" : ""}${p.total_growth_pct}%` : "—"}
                            </td>
                            <td className="p-3">
                              {p.overall_trend === "upward"
                                ? <span className="flex items-center gap-1 text-green-400"><TrendingUp className="w-3.5 h-3.5" /> Upward</span>
                                : <span className="flex items-center gap-1 text-red-400"><TrendingDown className="w-3.5 h-3.5" /> Downward</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Per-file summary cards */}
            <div>
              <p className="text-sm font-semibold text-white mb-3">📁 Per-File Summary</p>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {multiResult.per_file.map((f, i) => (
                  <Card key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                      <span className="font-semibold text-white text-sm truncate">{f.label}</span>
                    </div>
                    <p className="text-xs text-white/30">{f.rows.toLocaleString()} rows · {f.columns} cols</p>
                    {selectedCol && f.means[selectedCol] !== undefined && (
                      <div className="text-xs space-y-1 pt-1 border-t border-white/5">
                        <div className="flex justify-between">
                          <span className="text-white/30">Mean</span>
                          <span className="text-white font-mono">{f.means[selectedCol].toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/30">Total</span>
                          <span className="text-white font-mono">{f.totals[selectedCol].toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  )
}
