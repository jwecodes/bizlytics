import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InsightsResult } from "@/lib/types"
import { TrendingUp, AlertTriangle, Lightbulb, Zap } from "lucide-react"

export default function InsightPanel({ insights }: { insights: InsightsResult }) {
  return (
    <div className="flex flex-col gap-6">

      {/* Executive Summary */}
      <Card className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
        <p className="text-xs text-blue-400 font-semibold uppercase mb-2">Executive Summary</p>
        <p className="text-foreground text-sm leading-relaxed">{insights.executive_summary}</p>
      </Card>

      {/* Trends */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <h3 className="font-semibold text-foreground">Trends</h3>
        </div>
        <div className="flex flex-col gap-2">
          {insights.trends?.map((t, i) => (
            <Card key={i} className="p-4 bg-card border border-border rounded-xl">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm text-foreground">{t.title}</p>
                <Badge variant="outline" className={
                  t.sentiment === "positive" ? "text-green-400 border-green-400/30" :
                  t.sentiment === "negative" ? "text-red-400 border-red-400/30" :
                  "text-yellow-400 border-yellow-400/30"
                }>{t.sentiment}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Risks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h3 className="font-semibold text-foreground">Risks</h3>
        </div>
        <div className="flex flex-col gap-2">
          {insights.risks?.map((r, i) => (
            <Card key={i} className="p-4 bg-card border border-border rounded-xl">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm text-foreground">{r.title}</p>
                <Badge variant="outline" className={
                  r.impact === "high" ? "text-red-400 border-red-400/30" :
                  r.impact === "medium" ? "text-yellow-400 border-yellow-400/30" :
                  "text-muted-foreground border-border"
                }>{r.impact}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Opportunities */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <h3 className="font-semibold text-foreground">Opportunities</h3>
        </div>
        <div className="flex flex-col gap-2">
          {insights.opportunities?.map((o, i) => (
            <Card key={i} className="p-4 bg-card border border-border rounded-xl">
              <p className="font-medium text-sm text-foreground">{o.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{o.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-foreground">Recommendations</h3>
        </div>
        <div className="flex flex-col gap-2">
          {insights.recommendations?.map((rec, i) => (
            <Card key={i} className="p-4 bg-card border border-border rounded-xl">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm text-foreground">{rec.action}</p>
                <Badge variant="outline" className={
                  rec.priority === "high" ? "text-red-400 border-red-400/30" :
                  rec.priority === "medium" ? "text-yellow-400 border-yellow-400/30" :
                  "text-green-400 border-green-400/30"
                }>{rec.priority}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{rec.outcome}</p>
            </Card>
          ))}
        </div>
      </div>

    </div>
  )
}
