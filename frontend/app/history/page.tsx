"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  getHistory, deleteHistorySession, getHistoryStats, clearAllHistory,
  getComparisonHistory, deleteComparisonSession, getComparisonStats, clearAllComparisons,
  ComparisonSession,
} from "@/lib/api"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Trash2, BarChart3, Clock, ArrowLeft, Search, X,
  CheckSquare, Square, Database, Layers, AlertTriangle,
  ShoppingCart, TrendingUp, History, Settings, RefreshCw,
  RotateCcw, CheckCircle2, GitCompare, PlusCircle,
} from "lucide-react"

// ── Types ───────────────────────────────────────────────────────
interface Session {
  id: string
  file_id: string
  original_name: string
  domain: string
  created_at: string
}

// ── Constants ────────────────────────────────────────────────────
const DOMAIN_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  sales:     { icon: <TrendingUp    className="w-3.5 h-3.5" />, color: "text-green-400",  bg: "bg-green-500/15 border-green-500/20"   },
  finance:   { icon: <BarChart3     className="w-3.5 h-3.5" />, color: "text-blue-400",   bg: "bg-blue-500/15 border-blue-500/20"     },
  inventory: { icon: <Database      className="w-3.5 h-3.5" />, color: "text-yellow-400", bg: "bg-yellow-500/15 border-yellow-500/20" },
  ecommerce: { icon: <ShoppingCart  className="w-3.5 h-3.5" />, color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/20" },
  hr:        { icon: <Layers        className="w-3.5 h-3.5" />, color: "text-pink-400",   bg: "bg-pink-500/15 border-pink-500/20"     },
  unknown:   { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-white/30",   bg: "bg-white/5 border-white/10"            },
}
const domainMeta = (d: string) => DOMAIN_META[d?.toLowerCase()] ?? DOMAIN_META.unknown

// ── Helpers ──────────────────────────────────────────────────────
function groupByDate<T extends { created_at: string }>(items: T[]) {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yest  = new Date(today); yest.setDate(today.getDate() - 1)
  const week  = new Date(today); week.setDate(today.getDate() - 7)
  const groups = [
    { label: "Today",     items: [] as T[] },
    { label: "Yesterday", items: [] as T[] },
    { label: "This Week", items: [] as T[] },
    { label: "Earlier",   items: [] as T[] },
  ]
  for (const item of items) {
    const d   = new Date(item.created_at)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if      (day >= today) groups[0].items.push(item)
    else if (day >= yest)  groups[1].items.push(item)
    else if (day >= week)  groups[2].items.push(item)
    else                   groups[3].items.push(item)
  }
  return groups.filter(g => g.items.length > 0)
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-white/10 rounded w-48" />
        <div className="h-2.5 bg-white/5 rounded w-32" />
      </div>
      <div className="h-7 w-20 bg-white/10 rounded-xl" />
      <div className="h-7 w-7 bg-white/10 rounded-xl" />
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────
export default function HistoryPage() {
  const router = useRouter()

  // Tab state
  const [tab, setTab] = useState<"analyses" | "comparisons">("analyses")

  // ── Analyses state ────────────────────────────────────────────
  const [sessions, setSessions]     = useState<Session[]>([])
  const [stats,    setStats]        = useState<{ total: number; domain_counts: Record<string, number> } | null>(null)
  const [loadingA, setLoadingA]     = useState(true)

  // ── Comparisons state ─────────────────────────────────────────
  const [comparisons,  setComparisons]  = useState<ComparisonSession[]>([])
  const [cmpStats,     setCmpStats]     = useState<{ total: number; two_count: number; multi_count: number } | null>(null)
  const [loadingC,     setLoadingC]     = useState(true)
  const [typeFilter,   setTypeFilter]   = useState<"two" | "multi" | null>(null)

  // ── Shared state ──────────────────────────────────────────────
  const [search,       setSearch]       = useState("")
  const [domainFilter, setDomainFilter] = useState<string | null>(null)
  const [confirmId,    setConfirmId]    = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [selected,     setSelected]     = useState<Set<string>>(new Set())
  const [selectMode,   setSelectMode]   = useState(false)

  // ── Load ──────────────────────────────────────────────────────
  const loadAnalyses = async () => {
    setLoadingA(true)
    try {
      const [h, s] = await Promise.all([getHistory(), getHistoryStats()])
      setSessions(h.sessions)
      setStats(s)
    } catch { toast.error("Failed to load analyses") }
    finally { setLoadingA(false) }
  }

  const loadComparisons = async () => {
    setLoadingC(true)
    try {
      const [c, s] = await Promise.all([getComparisonHistory(), getComparisonStats()])
      setComparisons(c.sessions)
      setCmpStats(s)
    } catch { toast.error("Failed to load comparisons") }
    finally { setLoadingC(false) }
  }

  useEffect(() => { loadAnalyses(); loadComparisons() }, [])

  // Reset shared UI when switching tabs
  useEffect(() => {
    setSearch(""); setConfirmId(null); setConfirmClear(false)
    setSelected(new Set()); setSelectMode(false)
  }, [tab])

  // ── Filtered lists ────────────────────────────────────────────
  const filteredSessions = useMemo(() => {
    let s = sessions
    if (domainFilter) s = s.filter(x => x.domain?.toLowerCase() === domainFilter)
    if (search.trim()) s = s.filter(x => x.original_name.toLowerCase().includes(search.toLowerCase()))
    return s
  }, [sessions, domainFilter, search])

  const filteredComparisons = useMemo(() => {
    let c = comparisons
    if (typeFilter)    c = c.filter(x => x.type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      c = c.filter(x =>
        x.labels.some(l => l.toLowerCase().includes(q)) ||
        x.file_names.some(f => f.toLowerCase().includes(q))
      )
    }
    return c
  }, [comparisons, typeFilter, search])

  const sessionGroups    = useMemo(() => groupByDate(filteredSessions),    [filteredSessions])
  const comparisonGroups = useMemo(() => groupByDate(filteredComparisons), [filteredComparisons])

  // ── Actions ───────────────────────────────────────────────────
  const handleDeleteSession = async (id: string) => {
    await deleteHistorySession(id)
    setSessions(p => p.filter(s => s.id !== id))
    setConfirmId(null)
    toast.success("Session deleted")
  }

  const handleDeleteComparison = async (id: string) => {
    await deleteComparisonSession(id)
    setComparisons(p => p.filter(c => c.id !== id))
    setConfirmId(null)
    toast.success("Comparison deleted")
  }

  const handleClearAll = async () => {
    try {
      if (tab === "analyses") {
        await clearAllHistory()
        setSessions([])
        setStats(s => s ? { ...s, total: 0, domain_counts: {} } : s)
      } else {
        await clearAllComparisons()
        setComparisons([])
        setCmpStats(s => s ? { ...s, total: 0, two_count: 0, multi_count: 0 } : s)
      }
      setConfirmClear(false)
      toast.success("History cleared")
    } catch { toast.error("Failed to clear") }
  }

  const handleReopenAnalysis = (s: Session) => {
    sessionStorage.setItem("file_id", s.file_id)
    router.push("/dashboard")
  }

  const handleReopenComparison = (c: ComparisonSession) => {
    sessionStorage.setItem("comparison_session_id", c.id)
    router.push("/compare")
  }

  const domainList = stats ? Object.entries(stats.domain_counts).sort((a, b) => b[1] - a[1]) : []
  const isEmpty    = tab === "analyses" ? sessions.length === 0    : comparisons.length === 0
  const isLoading  = tab === "analyses" ? loadingA                 : loadingC
  const hasResults = tab === "analyses" ? filteredSessions.length > 0 : filteredComparisons.length > 0

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0d0e1a] text-white">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0d0e1a]/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}
            className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <History className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white leading-none">Analysis History</p>
            <p className="text-xs text-white/30">
              {stats ? `${stats.total} analysis` : "…"}
              {cmpStats ? ` · ${cmpStats.total} comparison${cmpStats.total !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { loadAnalyses(); loadComparisons() }}
            className="text-white/30 hover:text-white hover:bg-white/10 rounded-xl">
            <RefreshCw className={`w-4 h-4 ${(loadingA || loadingC) ? "animate-spin" : ""}`} />
          </Button>
          <a href="/settings" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 px-3 py-1.5 rounded-lg hover:bg-white/5">
            <Settings className="w-3.5 h-3.5" /><span className="hidden sm:block">Settings</span>
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* ── Tab switcher ──────────────────────────────────── */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit border border-white/10">
          <button onClick={() => setTab("analyses")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "analyses"
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/20"
                : "text-white/40 hover:text-white"
            }`}>
            <BarChart3 className="w-4 h-4" />
            Analyses
            {stats && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "analyses" ? "bg-white/20" : "bg-white/10 text-white/30"}`}>{stats.total}</span>}
          </button>
          <button onClick={() => setTab("comparisons")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "comparisons"
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/20"
                : "text-white/40 hover:text-white"
            }`}>
            <GitCompare className="w-4 h-4" />
            Comparisons
            {cmpStats && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "comparisons" ? "bg-white/20" : "bg-white/10 text-white/30"}`}>{cmpStats.total}</span>}
          </button>
        </div>

        {/* ── Search + controls row ──────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
            <input type="text" placeholder={tab === "analyses" ? "Search by filename…" : "Search by label or filename…"}
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Clear all */}
          {!isEmpty && (
            confirmClear ? (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3">
                <span className="text-xs text-red-400">Clear all?</span>
                <button onClick={handleClearAll} className="text-xs font-semibold text-red-400 hover:text-red-300">Yes</button>
                <button onClick={() => setConfirmClear(false)} className="text-xs text-white/30 hover:text-white">No</button>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmClear(true)}
                className="text-sm border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 rounded-xl gap-2">
                <RotateCcw className="w-4 h-4" /> Clear All
              </Button>
            )
          )}
        </div>

        {/* ── Domain pills (analyses tab) ────────────────────── */}
        {tab === "analyses" && domainList.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setDomainFilter(null)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                !domainFilter ? "bg-white/10 border-white/20 text-white" : "border-white/10 text-white/30 hover:text-white hover:bg-white/5"
              }`}>
              All <span className="font-mono text-white/50">{stats?.total}</span>
            </button>
            {domainList.map(([d, count]) => {
              const m = domainMeta(d); const active = domainFilter === d
              return (
                <button key={d} onClick={() => setDomainFilter(active ? null : d)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${active ? `${m.bg} ${m.color}` : "border-white/10 text-white/30 hover:text-white hover:bg-white/5"}`}>
                  <span className={active ? m.color : "text-white/20"}>{m.icon}</span>
                  {d} <span className="font-mono text-white/40">{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Type pills (comparisons tab) ───────────────────── */}
        {tab === "comparisons" && cmpStats && cmpStats.total > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setTypeFilter(null)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${!typeFilter ? "bg-white/10 border-white/20 text-white" : "border-white/10 text-white/30 hover:text-white hover:bg-white/5"}`}>
              All <span className="font-mono text-white/50">{cmpStats.total}</span>
            </button>
            {[
              { key: "two"   as const, label: "2-File",    count: cmpStats.two_count,   color: "bg-blue-500/15 border-blue-500/20 text-blue-400"   },
              { key: "multi" as const, label: "Multi-File", count: cmpStats.multi_count, color: "bg-purple-500/15 border-purple-500/20 text-purple-400" },
            ].map(t => t.count > 0 && (
              <button key={t.key} onClick={() => setTypeFilter(typeFilter === t.key ? null : t.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${typeFilter === t.key ? t.color : "border-white/10 text-white/30 hover:text-white hover:bg-white/5"}`}>
                {t.label} <span className="font-mono opacity-60">{t.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Loading skeletons ──────────────────────────────── */}
        {isLoading && (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
        )}

        {/* ── Empty state ────────────────────────────────────── */}
        {!isLoading && isEmpty && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              {tab === "analyses" ? <History className="w-8 h-8 text-white/20" /> : <GitCompare className="w-8 h-8 text-white/20" />}
            </div>
            <p className="text-white font-semibold mb-1">
              {tab === "analyses" ? "No analyses yet" : "No comparisons yet"}
            </p>
            <p className="text-sm text-white/30 mb-6 max-w-xs">
              {tab === "analyses"
                ? "Upload a dataset to run your first analysis."
                : "Use the Compare page to compare 2–10 datasets."}
            </p>
            <Button onClick={() => router.push(tab === "analyses" ? "/" : "/compare")}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 rounded-xl px-6 gap-2">
              <PlusCircle className="w-4 h-4" />
              {tab === "analyses" ? "Upload a dataset" : "Start a comparison"}
            </Button>
          </div>
        )}

        {/* ── No results after filter ────────────────────────── */}
        {!isLoading && !isEmpty && !hasResults && (
          <div className="flex flex-col items-center py-16 text-center">
            <Search className="w-8 h-8 text-white/20 mb-3" />
            <p className="text-white/50 font-medium">Nothing matches your search</p>
            <button onClick={() => { setSearch(""); setDomainFilter(null); setTypeFilter(null) }}
              className="text-xs text-purple-400 hover:text-purple-300 mt-2 underline underline-offset-2">
              Clear filters
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            ANALYSES TAB
        ════════════════════════════════════════════════════ */}
        {!isLoading && tab === "analyses" && sessionGroups.map(group => (
          <section key={group.label}>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">{group.label}</p>
            <div className="space-y-2">
              {group.items.map(session => {
                const m = domainMeta(session.domain)
                const isConfirm = confirmId === session.id
                return (
                  <Card key={session.id}
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${m.bg} ${m.color}`}>
                      {m.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{session.original_name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className={`text-xs capitalize font-medium ${m.color}`}>{session.domain || "unknown"}</span>
                        <span className="text-xs text-white/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{fmt(session.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isConfirm ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleReopenAnalysis(session)}
                            className="text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl px-3 opacity-0 group-hover:opacity-100 transition-all">
                            Re-open
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmId(session.id)}
                            className="text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-1">
                          <span className="text-xs text-red-400">Delete?</span>
                          <button onClick={() => handleDeleteSession(session.id)} className="text-xs font-semibold text-red-400 hover:text-red-300">Yes</button>
                          <button onClick={() => setConfirmId(null)} className="text-xs text-white/30 hover:text-white">No</button>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        ))}

        {/* ════════════════════════════════════════════════════
            COMPARISONS TAB
        ════════════════════════════════════════════════════ */}
        {!isLoading && tab === "comparisons" && comparisonGroups.map(group => (
          <section key={group.label}>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">{group.label}</p>
            <div className="space-y-2">
              {group.items.map(cmp => {
                const isConfirm = confirmId === cmp.id
                const isMulti   = cmp.type === "multi"
                return (
                  <Card key={cmp.id}
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all">

                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${isMulti ? "bg-purple-500/15 border-purple-500/20 text-purple-400" : "bg-blue-500/15 border-blue-500/20 text-blue-400"}`}>
                      <GitCompare className="w-3.5 h-3.5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Label pills */}
                      <div className="flex flex-wrap gap-1 mb-1">
                        {cmp.labels.map((lbl, i) => (
                          <span key={i} className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">{lbl}</span>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {/* Type badge */}
                        <span className={`text-xs font-medium ${isMulti ? "text-purple-400" : "text-blue-400"}`}>
                          {isMulti ? `${cmp.file_count}-file` : "2-file"} comparison
                        </span>
                        {/* Common columns count */}
                        {cmp.common_columns?.length > 0 && (
                          <span className="text-xs text-white/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-400/60" />
                            {cmp.common_columns.length} shared {cmp.common_columns.length === 1 ? "metric" : "metrics"}
                          </span>
                        )}
                        <span className="text-xs text-white/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{fmt(cmp.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isConfirm ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleReopenComparison(cmp)}
                            className="text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl px-3 opacity-0 group-hover:opacity-100 transition-all">
                            Re-open
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmId(cmp.id)}
                            className="text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-1">
                          <span className="text-xs text-red-400">Delete?</span>
                          <button onClick={() => handleDeleteComparison(cmp.id)} className="text-xs font-semibold text-red-400 hover:text-red-300">Yes</button>
                          <button onClick={() => setConfirmId(null)} className="text-xs text-white/30 hover:text-white">No</button>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        ))}

      </main>
    </div>
  )
}
