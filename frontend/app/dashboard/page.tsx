"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AnalysisResult } from "@/lib/types"
import KPICard from "@/components/dashboard/KPICard"
import DataHealthCard from "@/components/dashboard/DataHealthCard"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart3, Upload, RefreshCw, Loader2,
  Database, TrendingUp, ShieldAlert, LineChart, PieChart,
  History, LogOut, User, Settings
} from "lucide-react"
import { exportPDF } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

// ── Heavy components — lazy loaded ────────────────────────────────────────
import {
  LazyHistoricalForecastChart  as HistoricalForecastChart,
  LazyAnomalyChart             as AnomalyChart,
  LazyCorrelationHeatmap       as CorrelationHeatmap,
  LazyWhatIfSimulator          as WhatIfSimulator,
  LazyDataStory                as DataStory,
  LazyCategoryDonutChart       as CategoryDonutChart,
  LazyTopNBarChart             as TopNBarChart,
  LazyChatWidget               as ChatWidget,
  LazyInsightPanel             as InsightPanel,
} from "@/components/dashboard/LazyCharts"


const domainEmoji: Record<string, string> = {
  sales: "🛒", hr: "👥", finance: "💰",
  marketing: "📣", inventory: "📦", ecommerce: "🏪", general: "📊",
}


type Tab = "overview" | "insights" | "anomalies" | "forecast" | "segments"


const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",  label: "Overview",  icon: <BarChart3 className="w-4 h-4" /> },
  { id: "insights",  label: "Insights",  icon: <TrendingUp className="w-4 h-4" /> },
  { id: "anomalies", label: "Anomalies", icon: <ShieldAlert className="w-4 h-4" /> },
  { id: "forecast",  label: "Forecast",  icon: <LineChart className="w-4 h-4" /> },
  { id: "segments",  label: "Segments",  icon: <PieChart className="w-4 h-4" /> },
]


export default function DashboardPage() {
  const [data, setData] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [exporting, setExporting] = useState(false)
  const router = useRouter()
  const { user, loading, logout } = useAuth()


  // Auth guard
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])


  // Load analysis from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("bizlytics_analysis")
    if (!stored) { router.push("/"); return }
    setData(JSON.parse(stored))
  }, [])


  const handleExport = async () => {
    if (!data) return
    setExporting(true)
    try { await exportPDF(data.file_id) }
    catch { alert("Export failed. Please try again.") }
    setExporting(false)
  }


  // Auth loading state
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0e1a]">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )


  // Analysis loading state
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0e1a]">
      <p className="text-white/40 animate-pulse">Loading analysis...</p>
    </div>
  )


  const {
    data_quality, kpis, anomalies, ml_analysis,
    forecast, insights, column_profile, domain
  } = data


  const hasForecast = forecast?.forecast?.length > 0
  const hasML = ml_analysis?.pca_coords?.length > 0
  const hasCorrelations = Object.keys(data_quality?.correlations || {}).length > 1
  const mainKpis = Object.fromEntries(
    Object.entries(kpis).filter(([k]) => k !== "_domain_kpis")
  )
  const domainKpis = (kpis as any)._domain_kpis ?? {}
  const sampleRows = (data_quality as any).sample_rows ?? []


  return (
    <div className="min-h-screen bg-[#0d0e1a] text-white">


      {/* ── Header ─────────────────────────────────────── */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#0d0e1a] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg text-white leading-none">Bizlytics</p>
            <p className="text-xs text-white/30">AI-Powered Business Intelligence</p>
          </div>
        </div>


        <div className="flex items-center gap-2">
          {domain && (
            <Badge className="bg-white/10 text-white/60 border-0 text-xs hover:bg-white/10">
              {domainEmoji[domain.domain] ?? "📊"} {domain.label}
            </Badge>
          )}

          {/* History */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push("/history")}
            className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl gap-1.5 hidden sm:flex"
          >
            <History className="w-4 h-4" />
            History
          </Button>

          {/* Settings */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push("/settings")}
            className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl gap-1.5 hidden sm:flex"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>

          {/* User pill */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-white/50 max-w-[120px] truncate">
                {user.email}
              </span>
            </div>
          )}

          {/* Export PDF */}
          <Button
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 rounded-xl px-4 shadow-lg shadow-purple-500/20"
          >
            {exporting
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporting...</>
              : <><Upload className="w-4 h-4 mr-2" />Export PDF</>
            }
          </Button>

          {/* New Upload */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => router.push("/")}
            className="rounded-xl text-white/40 hover:text-white hover:bg-white/10"
            title="New Upload"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* Sign out */}
          <Button
            size="icon"
            variant="ghost"
            onClick={logout}
            className="rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>


      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="border-b border-white/10 px-6 bg-[#0d0e1a] sticky top-[73px] z-10">
        <div className="flex items-center max-w-7xl mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all border-b-2 -mb-px
                ${activeTab === tab.id
                  ? "border-purple-500 text-white"
                  : "border-transparent text-white/30 hover:text-white/60 hover:border-white/20"
                }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "anomalies" && anomalies.anomaly_count > 0 && (
                <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full leading-none">
                  {anomalies.anomaly_count}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => router.push("/compare")}
            className="ml-auto text-xs text-purple-400 hover:text-purple-300 transition-colors py-4 flex items-center gap-1"
          >
            ⚡ Compare →
          </button>
        </div>
      </div>


      {/* ── Tab Content ────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8">


        {/* ══ OVERVIEW ══════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8">

            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(mainKpis).slice(0, 4).map(([name, kpi]) => (
                <KPICard
                  key={name}
                  name={name}
                  kpi={kpi}
                  stats={data_quality.numeric_stats?.[name]}
                />
              ))}
            </div>

            {/* Domain Smart KPIs */}
            {Object.keys(domainKpis).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">
                  {domainEmoji[domain?.domain]} {domain?.label} — Smart KPIs
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(domainKpis).map(([key, val]) => (
                    <Card key={key} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                      <p className="text-xl font-bold text-purple-300">
                        {typeof val === "number"
                          ? (val as number).toLocaleString(undefined, { maximumFractionDigits: 2 })
                          : String(val)}
                      </p>
                      <p className="text-xs text-white/40 mt-1 capitalize">
                        {key.replace(/_/g, " ")}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Data Health + Executive Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DataHealthCard quality={data_quality} />
              {insights?.executive_summary && (
                <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl flex flex-col">
                  <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-3">
                    🤖 AI Executive Summary
                  </p>
                  <p className="text-white/70 text-sm leading-relaxed flex-1">
                    {insights.executive_summary}
                  </p>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <span className="text-xs bg-white/10 text-white/40 px-2 py-1 rounded-full">
                      {data_quality.total_rows} rows
                    </span>
                    <span className="text-xs bg-white/10 text-white/40 px-2 py-1 rounded-full">
                      {data_quality.total_columns} columns
                    </span>
                    <span className="text-xs bg-white/10 text-white/40 px-2 py-1 rounded-full">
                      {anomalies.anomaly_count} anomalies
                    </span>
                  </div>
                </Card>
              )}
            </div>

            {/* Donut + Bar Charts */}
            {sampleRows.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {column_profile.categorical_cols.length > 0 && (
                  <CategoryDonutChart
                    data={sampleRows}
                    categoricalCols={column_profile.categorical_cols}
                  />
                )}
                {column_profile.categorical_cols.length > 0 && column_profile.numeric_cols.length > 0 && (
                  <TopNBarChart
                    data={sampleRows}
                    categoricalCols={column_profile.categorical_cols}
                    numericCols={column_profile.numeric_cols}
                  />
                )}
              </div>
            )}

            {/* Correlation Heatmap */}
            {hasCorrelations && (
              <CorrelationHeatmap correlations={data_quality.correlations} />
            )}

            {/* What-If Simulator */}
            {Object.keys(mainKpis).length > 0 && (
              <WhatIfSimulator kpis={mainKpis} />
            )}

            {/* Data Story */}
            <div>
              <p className="text-sm font-semibold text-white mb-3">📖 Data Story</p>
              <DataStory fileId={data.file_id} />
            </div>

          </div>
        )}


        {/* ══ INSIGHTS ══════════════════════════════════ */}
        {activeTab === "insights" && (
          <div className="flex flex-col gap-8">
            {Object.keys(mainKpis).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  All Key Performance Indicators
                  <span className="text-xs text-white/30 font-normal ml-1">
                    — click any card for column stats
                  </span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(mainKpis).map(([name, kpi]) => (
                    <KPICard
                      key={name}
                      name={name}
                      kpi={kpi}
                      stats={data_quality.numeric_stats?.[name]}
                    />
                  ))}
                </div>
              </div>
            )}
            {insights && (
              <div>
                <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  AI-Generated Insights
                </p>
                <InsightPanel insights={insights} />
              </div>
            )}
          </div>
        )}


        {/* ══ ANOMALIES ══════════════════════════════════ */}
        {activeTab === "anomalies" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <ShieldAlert className={`w-8 h-8 flex-shrink-0 ${anomalies.anomaly_count > 0 ? "text-red-400" : "text-green-400"}`} />
              <div className="flex-1">
                <p className="font-semibold text-white">
                  {anomalies.anomaly_count > 0
                    ? `${anomalies.anomaly_count} Anomalies Detected`
                    : "No Anomalies Detected"}
                </p>
                <p className="text-xs text-white/30 mt-0.5">
                  Isolation Forest + DBSCAN — flagged only when both models agree
                </p>
              </div>
              {anomalies.anomaly_count > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border-0">
                  {((anomalies.anomaly_count / data_quality.total_rows) * 100).toFixed(1)}% of rows
                </Badge>
              )}
            </div>

            {anomalies.note && (
              <Card className="p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                <p className="text-sm text-yellow-400">⚠️ {anomalies.note}</p>
                <p className="text-xs text-white/30 mt-1">
                  Upload a dataset with 20+ rows for anomaly detection to work effectively.
                </p>
              </Card>
            )}

            {!anomalies.note && anomalies.anomaly_count === 0 && (
              <Card className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl">
                <p className="text-sm text-green-400">
                  ✅ No anomalies detected — your data looks healthy!
                </p>
              </Card>
            )}

            {anomalies.anomaly_count > 0 && (
              <div className="flex flex-col gap-3">
                {anomalies.root_causes?.slice(0, 10).map((rc, i) => (
                  <Card key={i} className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
                    <span className="text-xs font-semibold text-red-400 mb-3 block">
                      ⚠️ Row #{rc.row_index} — Anomaly Detected
                    </span>
                    {rc.top_reasons?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {rc.top_reasons.map((reason, j) => (
                          <div key={j} className="bg-white/5 border border-white/10 rounded-xl p-3">
                            <p className="text-xs text-white/40 mb-1 capitalize">
                              {reason.column.replace(/_/g, " ")}
                            </p>
                            <p className="text-sm font-bold text-white">
                              {reason.value.toLocaleString()}
                            </p>
                            <p className="text-xs text-white/30">
                              Normal avg: {reason.normal_avg.toLocaleString()}
                            </p>
                            <p className={`text-xs font-semibold mt-1 ${reason.pct_diff > 0 ? "text-red-400" : "text-blue-400"}`}>
                              {reason.pct_diff > 0 ? "+" : ""}{reason.pct_diff}% deviation
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/30">
                        Insufficient variance to compute root cause.
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}


        {/* ══ FORECAST ══════════════════════════════════ */}
        {activeTab === "forecast" && (
          <div className="flex flex-col gap-6">
            {hasForecast ? (
              <>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                  <LineChart className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="font-semibold text-white">90-Day Forecast</p>
                    <p className="text-xs text-white/30">
                      Prophet model — trend:{" "}
                      <span className="text-blue-400 font-medium">
                        {forecast.trend_direction ?? "stable"}
                      </span>
                    </p>
                  </div>
                </div>
                <HistoricalForecastChart
                  forecast={forecast.forecast}
                  title={column_profile.numeric_cols[0] ?? "Value"}
                  trendDirection={forecast.trend_direction}
                />
                <WhatIfSimulator kpis={mainKpis} />
              </>
            ) : (
              <Card className="p-12 bg-white/5 border border-white/10 rounded-2xl text-center">
                <LineChart className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white font-medium mb-1">No Forecast Available</p>
                <p className="text-sm text-white/30">
                  Forecasting requires a date column and a numeric column in your dataset.
                </p>
              </Card>
            )}
          </div>
        )}


        {/* ══ SEGMENTS ══════════════════════════════════ */}
        {activeTab === "segments" && (
          <div className="flex flex-col gap-6">
            {hasML ? (
              <>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                  <PieChart className="w-6 h-6 text-purple-400" />
                  <div>
                    <p className="font-semibold text-white">
                      {ml_analysis.segment_count} Segments Identified
                    </p>
                    <p className="text-xs text-white/30">
                      K-Means clustering with PCA visualization — each colour is a distinct segment
                    </p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <Badge className="bg-purple-500/20 text-purple-300 border-0">K-Means</Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border-0">PCA</Badge>
                  </div>
                </div>

                <AnomalyChart
                  pcaCoords={ml_analysis.pca_coords}
                  segments={ml_analysis.segments}
                  anomalyIndices={anomalies.anomaly_indices}
                  segmentCount={ml_analysis.segment_count}
                />

                {ml_analysis.segment_sizes && Object.keys(ml_analysis.segment_sizes).length > 0 && (
                  <Card className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-sm font-semibold text-white mb-5">Segment Size Breakdown</p>
                    <div className="flex flex-col gap-4">
                      {Object.entries(ml_analysis.segment_sizes).map(([seg, count], idx) => {
                        const pct = ((Number(count) / data_quality.total_rows) * 100).toFixed(1)
                        const colors = [
                          "from-blue-500 to-blue-600", "from-purple-500 to-purple-600",
                          "from-green-500 to-green-600", "from-yellow-500 to-yellow-600",
                          "from-red-500 to-red-600", "from-cyan-500 to-cyan-600",
                        ]
                        const dotColors = ["bg-blue-500","bg-purple-500","bg-green-500","bg-yellow-500","bg-red-500","bg-cyan-500"]
                        return (
                          <div key={seg}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${dotColors[idx % dotColors.length]}`} />
                                <span className="text-sm text-white font-medium">Segment {seg}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-white/40">{Number(count)} rows</span>
                                <span className="text-sm font-bold text-white">{pct}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full bg-gradient-to-r ${colors[idx % colors.length]} transition-all duration-700`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6">
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-white">{ml_analysis.segment_count}</p>
                        <p className="text-xs text-white/30 mt-0.5">Total Segments</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-white">
                          {Math.round(data_quality.total_rows / ml_analysis.segment_count)}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">Avg per Segment</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-white">
                          {Math.max(...Object.values(ml_analysis.segment_sizes).map(Number))}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">Largest Segment</p>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-12 bg-white/5 border border-white/10 rounded-2xl text-center">
                <PieChart className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white font-medium mb-1">No Segments Available</p>
                <p className="text-sm text-white/30">
                  Segmentation requires at least 2 numeric columns in your dataset.
                </p>
              </Card>
            )}
          </div>
        )}

      </main>

      <ChatWidget fileId={data.file_id} />

    </div>
  )
}
