"use client"
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { uploadFile, fetchAnalysis } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react"

export default function FileDropzone() {
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<"idle" | "uploading" | "analyzing" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const router = useRouter()

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/)) {
      setErrorMsg("Only CSV and Excel files are supported.")
      setStatus("error")
      return
    }
    try {
      setStatus("uploading")
      const { file_id } = await uploadFile(file)
      setStatus("analyzing")

      // Store file_id and redirect to loading page immediately
      sessionStorage.setItem("bizlytics_file_id", file_id)
      sessionStorage.removeItem("bizlytics_analysis")
      router.push("/loading")
    } catch {
      setErrorMsg("Something went wrong. Please try again.")
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
  }

  const isLoading = status === "uploading" || status === "analyzing"

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-200 cursor-pointer
        ${dragging ? "border-blue-500 bg-blue-500/10" : "border-border hover:border-blue-400 hover:bg-white/5"}`}
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
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-lg font-medium text-foreground">
              {status === "uploading" ? "Uploading your file..." : "Redirecting to analysis..."}
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">Drop your file here</p>
              <p className="text-muted-foreground mt-1">or click to browse</p>
            </div>
            <p className="text-xs text-muted-foreground">Supports CSV, XLSX, XLS</p>
            {status === "error" && <p className="text-red-400 text-sm">{errorMsg}</p>}
            <Button variant="outline" className="mt-2 pointer-events-none">
              <Upload className="w-4 h-4 mr-2" /> Choose File
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
