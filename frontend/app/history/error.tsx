"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Home, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error("[History Error]", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0d0e1a] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mb-5 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white mb-2">Failed to load history</h2>
        <p className="text-white/30 text-sm mb-6 leading-relaxed">
          Could not fetch your past analyses. Check your connection
          or try again in a moment.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="text-white/40 hover:text-white hover:bg-white/10 gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
