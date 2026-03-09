"use client"
import { useState, useRef, useEffect } from "react"
import { askQuestion } from "@/lib/api"
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED = [
  "What are the key trends in this data?",
  "Which metric has the highest growth?",
  "What are the biggest risks?",
  "Summarize the data in one sentence",
]

export default function ChatWidget({ fileId }: { fileId: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your data analyst. Ask me anything about your uploaded dataset 👋"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async (question?: string) => {
    const q = question ?? input.trim()
    if (!q || loading) return

    setMessages(prev => [...prev, { role: "user", content: q }])
    setInput("")
    setLoading(true)

    try {
      const res = await askQuestion(fileId, q)
      setMessages(prev => [...prev, { role: "assistant", content: res.answer }])
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again."
      }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl
                   bg-gradient-to-br from-purple-500 to-blue-600
                   hover:from-purple-600 hover:to-blue-700
                   text-white flex items-center justify-center
                   transition-all duration-200 hover:scale-110
                   shadow-purple-500/30"
      >
        {open
          ? <X className="w-6 h-6" />
          : <MessageCircle className="w-6 h-6" />
        }
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[520px]
                        bg-[#13141f] border border-white/10
                        rounded-2xl shadow-2xl shadow-black/50
                        flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Ask Your Data</p>
              <p className="text-white/60 text-xs">Powered by AI</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#13141f]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center
                  ${msg.role === "user"
                    ? "bg-gradient-to-br from-purple-500 to-blue-600"
                    : "bg-white/10 border border-white/10"
                  }`}>
                  {msg.role === "user"
                    ? <User className="w-3 h-3 text-white" />
                    : <Bot className="w-3 h-3 text-white/60" />
                  }
                </div>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                  ${msg.role === "user"
                    ? "bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-tr-sm"
                    : "bg-white/10 text-white/80 rounded-tl-sm border border-white/5"
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white/60" />
                </div>
                <div className="bg-white/10 border border-white/5 px-3 py-2 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-white/30">Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested Questions — only at start */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 bg-[#13141f]">
              {SUGGESTED.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="text-xs bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70
                             px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20
                             transition-all text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-white/10 bg-[#13141f] flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask anything about your data..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2
                         text-sm text-white placeholder:text-white/20
                         focus:outline-none focus:ring-2 focus:ring-purple-500/50
                         focus:border-purple-500/50 transition-all"
            />
            <Button
              size="sm"
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-purple-500 to-blue-500
                         hover:from-purple-600 hover:to-blue-600
                         text-white border-0 rounded-xl px-3
                         disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
