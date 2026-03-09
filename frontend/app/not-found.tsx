"use client"

import { useRouter } from "next/navigation"
import { BarChart3, Home, ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0d0e1a] flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold">Bizlytics</span>
      </div>

      {/* 404 display */}
      <div className="relative z-10 text-center max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Search className="w-10 h-10 text-white/20" />
          </div>
        </div>

        <h1 className="text-7xl font-black text-white/10 leading-none mb-2">404</h1>
        <h2 className="text-xl font-semibold text-white mb-3">Page not found</h2>
        <p className="text-white/30 text-sm leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
          Head back home to upload a dataset and get started.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 w-full sm:w-auto gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-white/40 hover:text-white hover:bg-white/10 w-full sm:w-auto gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
    </div>
  )
}
