"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Upload, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LoadingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error("[Loading Error]", error)
  }, [error])

  const handleRetry = () => {
    sessionStorage.removeItem("bizlytics_file_id")
    sessionStorage.removeItem("bizlytics_analysis")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-[#0d0e1a] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mb-5 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white mb-2">Analysis failed to start</h2>
        <p className="text-white/30 text-sm mb-6 leading-relaxed">
          Something went wrong while loading your analysis.
          Please upload your file again.
        </p>

        <Button
          onClick={handleRetry}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Again
        </Button>
      </div>
    </div>
  )
}
