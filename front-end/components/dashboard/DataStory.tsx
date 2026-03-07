"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchDataStory } from "@/lib/api"
import { BookOpen, Loader2 } from "lucide-react"

function cleanStory(raw: string): string[] {
  // Remove any JSON artifacts that might slip through
  let text = raw
    .replace(/[{}\[\]"]/g, "")          // remove JSON chars
    .replace(/^\s*\w+\s*:/gm, "")       // remove "key:" patterns
    .replace(/\\n/g, "\n")              // fix escaped newlines
    .trim()

  // Split into paragraphs and filter empty ones
  return text
    .split(/\n{2,}/)
    .map(p => p.replace(/\n/g, " ").trim())
    .filter(p => p.length > 40)         // remove very short fragments
}

export default function DataStory({ fileId }: { fileId: string }) {
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchDataStory(fileId)
      setParagraphs(cleanStory(res.story))
    } catch (e) {
      setParagraphs(["Failed to generate story. Please try again."])
    }
    setLoading(false)
  }

  return (
    <Card className="p-6 bg-card border border-border rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-foreground">Data Story</h3>
          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
            AI Generated
          </span>
        </div>
        {paragraphs.length === 0 && (
          <Button onClick={load} disabled={loading} size="sm" variant="outline">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</>
              : "✨ Generate Story"
            }
          </Button>
        )}
        {paragraphs.length > 0 && (
          <Button onClick={load} disabled={loading} size="sm" variant="ghost" className="text-xs text-muted-foreground">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "↺ Regenerate"}
          </Button>
        )}
      </div>

      {paragraphs.length > 0 ? (
        <div className="flex flex-col gap-4 border-l-2 border-purple-500/30 pl-4">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-sm text-foreground leading-7">{para}</p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Click "Generate Story" to get a professional narrative analysis of your data written by AI.
        </p>
      )}
    </Card>
  )
}
