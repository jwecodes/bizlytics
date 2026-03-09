"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, RefreshCw, Home, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log error to console in dev
    console.error("[BizLytics Global Error]", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0d0e1a] flex flex-col items-center justify-center px-6 relative overflow-hidden">

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold">Bizlytics</span>
      </div>

      <div className="relative z-10 text-center max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-3">Something went wrong</h2>
        <p className="text-white/30 text-sm leading-relaxed mb-2">
          An unexpected error occurred. This has been noted.
        </p>

        {/* Show error message in dev only */}
        {process.env.NODE_ENV === "development" && error?.message && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
            <p className="text-xs text-red-400 font-mono break-all">{error.message}</p>
            {error.digest && (
              <p className="text-xs text-white/20 mt-1">Digest: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <Button
            onClick={reset}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 w-full sm:w-auto gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="text-white/40 hover:text-white hover:bg-white/10 w-full sm:w-auto gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
    </div>
  )
}
