import dynamic from "next/dynamic"

// ── Shared skeleton placeholders ───────────────────────────────────────────

function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`w-full ${height} rounded-2xl bg-white/5 border border-white/10 animate-pulse flex flex-col gap-3 p-5`}>
      <div className="h-4 w-40 bg-white/10 rounded-lg" />
      <div className="flex-1 bg-white/5 rounded-xl" />
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl animate-pulse flex flex-col gap-3">
      <div className="h-4 w-32 bg-white/10 rounded-lg" />
      <div className="h-32 bg-white/5 rounded-xl" />
      <div className="h-3 w-full bg-white/10 rounded" />
      <div className="h-3 w-3/4 bg-white/10 rounded" />
    </div>
  )
}

function HeatmapSkeleton() {
  return (
    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl animate-pulse">
      <div className="h-4 w-44 bg-white/10 rounded-lg mb-4" />
      <div className="grid grid-cols-5 gap-1">
        {[...Array(25)].map((_, i) => (
          <div key={i} className="h-10 rounded bg-white/5" />
        ))}
      </div>
    </div>
  )
}

function SimulatorSkeleton() {
  return (
    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl animate-pulse flex flex-col gap-4">
      <div className="h-4 w-36 bg-white/10 rounded-lg" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-3 w-24 bg-white/10 rounded" />
          <div className="h-2 w-full bg-white/10 rounded-full" />
        </div>
      ))}
    </div>
  )
}

// ── Lazy-loaded heavy chart components ────────────────────────────────────

export const LazyHistoricalForecastChart = dynamic(
  () => import("@/components/dashboard/HistoricalForecastChart"),
  {
    loading: () => <ChartSkeleton height="h-80" />,
    ssr: false,
  }
)

export const LazyAnomalyChart = dynamic(
  () => import("@/components/dashboard/AnomalyChart"),
  {
    loading: () => <ChartSkeleton height="h-72" />,
    ssr: false,
  }
)

export const LazyCorrelationHeatmap = dynamic(
  () => import("@/components/dashboard/CorrelationHeatmap"),
  {
    loading: () => <HeatmapSkeleton />,
    ssr: false,
  }
)

export const LazyWhatIfSimulator = dynamic(
  () => import("@/components/dashboard/WhatIfSimulator"),
  {
    loading: () => <SimulatorSkeleton />,
    ssr: false,
  }
)

export const LazyDataStory = dynamic(
  () => import("@/components/dashboard/DataStory"),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
)

export const LazyCategoryDonutChart = dynamic(
  () => import("@/components/dashboard/CategoryDonutChart"),
  {
    loading: () => <ChartSkeleton height="h-64" />,
    ssr: false,
  }
)

export const LazyTopNBarChart = dynamic(
  () => import("@/components/dashboard/TopNBarChart"),
  {
    loading: () => <ChartSkeleton height="h-64" />,
    ssr: false,
  }
)

export const LazyChatWidget = dynamic(
  () => import("@/components/dashboard/ChatWidget"),
  {
    loading: () => null, // chat widget loads silently
    ssr: false,
  }
)

export const LazyInsightPanel = dynamic(
  () => import("@/components/dashboard/InsightPanel"),
  {
    loading: () => (
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl animate-pulse flex flex-col gap-2">
            <div className="h-4 w-48 bg-white/10 rounded" />
            <div className="h-3 w-full bg-white/10 rounded" />
            <div className="h-3 w-3/4 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    ),
    ssr: false,
  }
)
