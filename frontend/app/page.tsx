"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, TrendingUp, Shield, Brain, Zap, GitCompare, History, LogOut, User, Settings } from "lucide-react"
import FileDropzone from "@/components/upload/FileDropzone"
import { useAuth } from "@/context/AuthContext"

const features = [
  { icon: <TrendingUp className="w-5 h-5 text-purple-400" />, label: "Auto KPIs", desc: "Generated from your columns instantly" },
  { icon: <Shield className="w-5 h-5 text-blue-400" />, label: "Anomaly Detection", desc: "ML-powered outlier detection" },
  { icon: <BarChart3 className="w-5 h-5 text-green-400" />, label: "Forecasting", desc: "90-day Prophet predictions" },
  { icon: <Brain className="w-5 h-5 text-yellow-400" />, label: "AI Insights", desc: "Trends, risks & recommendations" },
  { icon: <Zap className="w-5 h-5 text-pink-400" />, label: "Chat with Data", desc: "Ask questions in plain English" },
  { icon: <GitCompare className="w-5 h-5 text-cyan-400" />, label: "Compare Datasets", desc: "Side-by-side diff analysis" },
]

export default function Home() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Show nothing while checking auth state
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0d0e1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "there"

  return (
    <main className="min-h-screen bg-[#0d0e1a] flex flex-col items-center justify-center p-8 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top nav bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0d0e1a]/80 backdrop-blur-md">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Bizlytics</span>
        </div>

        {/* Right side — user info + actions */}
        <div className="flex items-center gap-1">
          <a
            href="/history"
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <History className="w-3.5 h-3.5" />
            Histo
          </a>

          <a
            href="/settings"
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Settings</span>
          </a>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-white/60 max-w-[120px] truncate hidden sm:block">
              {user.email}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Sign out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center mt-16">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-none">Bizlytics</p>
            <p className="text-xs text-white/30 mt-0.5">AI-Powered Business Intelligence</p>
          </div>
        </div>

        {/* Personalised greeting */}
        <div className="mb-3 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
          👋 Welcome back, {displayName}
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center leading-tight mb-3">
          Turn your data into
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> insights</span>
        </h1>
        <p className="text-white/40 text-center mb-8 max-w-md text-sm leading-relaxed">
          Upload any CSV or Excel file and get instant AI-powered analysis — KPIs, anomalies, forecasts, charts, and recommendations in seconds.
        </p>

        {/* Format badges */}
        <div className="flex gap-2 mb-8">
          {["CSV", "XLSX", "XLS"].map((fmt) => (
            <span key={fmt} className="text-xs bg-white/10 text-white/50 px-3 py-1.5 rounded-full font-medium border border-white/10">
              {fmt}
            </span>
          ))}
        </div>

        {/* Upload Box */}
        <div className="w-full mb-8">
          <FileDropzone />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full mb-8">
          {features.map((f) => (
            <div key={f.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3 hover:bg-white/[0.08] transition-colors">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-sm text-white">{f.label}</p>
                <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom links */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-white/20">Already have two datasets to compare?</p>
          <a
            href="/compare"
            className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <GitCompare className="w-4 h-4" />
            Compare two datasets side by side →
          </a>
        </div>

        {/* History shortcut — only if user has used before */}
        <div className="mt-4">
          <a
            href="/history"
            className="flex items-center gap-2 text-xs text-white/20 hover:text-white/50 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            View past analyses →
          </a>
        </div>

      </div>
    </main>
  )
}
