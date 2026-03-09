"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchAnalysis } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { BarChart3, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
}

const STEPS = [
  "📊 Profiling your dataset...",
  "🔍 Detecting anomalies...",
  "📈 Running forecasts...",
  "🤖 Generating AI insights...",
  "✨ Almost done...",
]

const ANALYSIS_TIMEOUT_MS = 60_000 // 60 seconds max

export default function LoadingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState("")
  const hasFetched = useRef(false) // prevent double-fetch in React Strict Mode

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  // Cycle through step messages
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Run analysis — guarded against double execution
  useEffect(() => {
    if (authLoading || !user) return
    if (hasFetched.current) return
    hasFetched.current = true

    const fileId = sessionStorage.getItem("bizlytics_file_id")
    if (!fileId) {
      router.push("/")
      return
    }

    // Hard timeout — never hang forever
    const timeout = setTimeout(() => {
      setError("Analysis is taking too long. Please try again with a smaller file.")
    }, ANALYSIS_TIMEOUT_MS)

    fetchAnalysis(fileId)
      .then((analysis) => {
        clearTimeout(timeout)
        sessionStorage.setItem("bizlytics_analysis", JSON.stringify(analysis))
        sessionStorage.removeItem("bizlytics_file_id") // clean up
        router.push("/dashboard")
      })
      .catch((err) => {
        clearTimeout(timeout)
        const msg = err?.response?.data?.detail || err?.message || "Analysis failed"
        if (msg.toLowerCase().includes("401") || msg.toLowerCase().includes("auth")) {
          router.push("/login")
        } else {
          setError(msg)
        }
      })
  }, [user, authLoading, router])

  // Auth loading
  if (authLoading) return (
    <div className="min-h-screen bg-[#0d0e1a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Error state
  if (error) return (
    <div className="min-h-screen bg-[#0d0e1a] flex flex-col items-center justify-center gap-5 px-6">
      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-lg mb-1">Analysis Failed</p>
        <p className="text-white/40 text-sm max-w-sm">{error}</p>
      </div>
      <div className="flex gap-3">
        <Button
          onClick={() => {
            sessionStorage.removeItem("bizlytics_file_id")
            sessionStorage.removeItem("bizlytics_analysis")
            router.push("/")
          }}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0"
        >
          Try Again
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="text-white/40 hover:text-white"
        >
          Go Home
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0d0e1a]">
      {/* Fake Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white leading-none">Bizlytics</p>
            <p className="text-xs text-white/30">AI-Powered Business Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-32 h-7" />
          <Skeleton className="w-24 h-7" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-10">

        {/* Status message */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-purple-400 font-medium transition-all duration-500">
              {STEPS[stepIndex]}
            </p>
          </div>
          <p className="text-xs text-white/20">
            This usually takes 5–15 seconds depending on file size
          </p>
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i <= stepIndex
                    ? "bg-purple-500 w-4"
                    : "bg-white/10 w-1.5"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
              <Skeleton className="w-8 h-8 mx-auto mb-2" />
              <Skeleton className="w-16 h-7 mx-auto mb-2" />
              <Skeleton className="w-20 h-3 mx-auto" />
            </div>
          ))}
        </div>

        {/* Executive summary skeleton */}
        <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex flex-col gap-2">
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
              <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3">
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
            <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-2xl">
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
              <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-2">
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
