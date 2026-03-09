"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Upload, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error("[Dashboard Error]", error)
  }, [error])

  const handleRetry = () => {
    // Clear potentially corrupt session data
    sessionStorage.removeItem("bizlytics_analysis")
    sessionStorage.removeItem("bizlytics_file_id")
    reset()
  }

  return (
    <div className="min-h-screen bg-[#0d0e1a] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mb-5 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white mb-2">Dashboard failed to load</h2>
        <p className="text-white/30 text-sm mb-2 leading-relaxed">
          Something went wrong while rendering your analysis.
          This is usually caused by unexpected data format.
        </p>

        {process.env.NODE_ENV === "development" && error?.message && (
          <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
            <p className="text-xs text-red-400 font-mono break-all">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Button
            onClick={handleRetry}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="text-white/40 hover:text-white hover:bg-white/10 gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload New File
          </Button>
        </div>
      </div>
    </div>
  )
}
