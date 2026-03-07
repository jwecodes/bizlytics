"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { fetchAnalysis } from "@/lib/api"
import { BarChart3 } from "lucide-react"

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
  )
}

export default function LoadingPage() {
  const router = useRouter()

  useEffect(() => {
    const fileId = sessionStorage.getItem("bizlytics_file_id")
    if (!fileId) { router.push("/"); return }

    fetchAnalysis(fileId).then((analysis) => {
      sessionStorage.setItem("bizlytics_analysis", JSON.stringify(analysis))
      router.push("/dashboard")
    }).catch(() => {
      router.push("/")
    })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Fake Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground">Bizlytics</span>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-32 h-7" />
          <Skeleton className="w-24 h-7" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-10">

        {/* Status message */}
        <div className="text-center py-4">
          <p className="text-blue-400 font-medium animate-pulse">
            🤖 Running AI analysis on your data...
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Profiling • Detecting anomalies • Forecasting • Generating insights
          </p>
        </div>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-card border border-border rounded-2xl text-center">
              <Skeleton className="w-8 h-8 mx-auto mb-2" />
              <Skeleton className="w-16 h-7 mx-auto mb-2" />
              <Skeleton className="w-20 h-3 mx-auto" />
            </div>
          ))}
        </div>

        {/* Executive summary skeleton */}
        <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex flex-col gap-2">
          <Skeleton className="w-40 h-3 mb-2" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-3/4 h-4" />
        </div>

        {/* KPI cards skeleton */}
        <div>
          <Skeleton className="w-48 h-6 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-5 bg-card border border-border rounded-2xl flex flex-col gap-3">
                <Skeleton className="w-24 h-3" />
                <Skeleton className="w-32 h-8" />
                <Skeleton className="w-20 h-3" />
              </div>
            ))}
          </div>
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-5 bg-card border border-border rounded-2xl">
              <Skeleton className="w-40 h-4 mb-4" />
              <Skeleton className="w-full h-56" />
            </div>
          ))}
        </div>

        {/* Insights skeleton */}
        <div>
          <Skeleton className="w-48 h-6 mb-4" />
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-card border border-border rounded-xl flex flex-col gap-2">
                <Skeleton className="w-48 h-4" />
                <Skeleton className="w-full h-3" />
                <Skeleton className="w-3/4 h-3" />
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
