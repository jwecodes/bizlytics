"use client"
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { uploadFile } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react"

const MAX_FILE_SIZE_MB = 50

export default function FileDropzone() {
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<"idle" | "uploading" | "redirecting" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const router = useRouter()

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setErrorMsg("Only CSV and Excel files are supported.")
      setStatus("error")
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`)
      setStatus("error")
      return
    }

    try {
      setStatus("uploading")
      setErrorMsg("")

      const { file_id } = await uploadFile(file)

      setStatus("redirecting")

      // Clear any previous session data before starting fresh
      sessionStorage.removeItem("bizlytics_analysis")
      sessionStorage.setItem("bizlytics_file_id", file_id)

      router.push("/loading")
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Upload failed"
      if (msg.toLowerCase().includes("401") || msg.toLowerCase().includes("auth")) {
        router.push("/login")
        return
      }
      setErrorMsg(msg)
      setStatus("error")
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be re-uploaded
    e.target.value = ""
  }

  const isLoading = status === "uploading" || status === "redirecting"

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-200
        ${isLoading ? "cursor-not-allowed opacity-80" : "cursor-pointer"}
        ${dragging
          ? "border-purple-500 bg-purple-500/10"
          : "border-white/10 hover:border-purple-400/50 hover:bg-white/5"
        }`}
    >
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={onFileInput}
        className="absolute inset-0 opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      <div className="flex flex-col items-center gap-4">
        {isLoading ? (
          <>
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <div>
              <p className="text-lg font-medium text-white">
                {status === "uploading" ? "Uploading your file..." : "Starting analysis..."}
              </p>
              <p className="text-sm text-white/30 mt-1">
                {status === "uploading" ? "Please wait" : "Redirecting to loading page"}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors
              ${status === "error" ? "bg-red-500/10" : "bg-purple-500/10"}`}>
              {status === "error"
                ? <AlertCircle className="w-8 h-8 text-red-400" />
                : <FileSpreadsheet className="w-8 h-8 text-purple-400" />
              }
            </div>
            <div>
              <p className="text-xl font-semibold text-white">Drop your file here</p>
              <p className="text-white/30 mt-1 text-sm">or click to browse</p>
            </div>
            {status === "error" ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-red-400 text-sm">{errorMsg}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setStatus("idle"); setErrorMsg("") }}
                  className="text-xs text-white/30 hover:text-white/60 underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <p className="text-xs text-white/20">
                CSV, XLSX, XLS · Max {MAX_FILE_SIZE_MB}MB
              </p>
            )}
            <Button
              variant="outline"
              className="mt-2 pointer-events-none border-white/10 text-white/50"
            >
              <Upload className="w-4 h-4 mr-2" /> Choose File
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
