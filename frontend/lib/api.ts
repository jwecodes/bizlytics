import axios from "axios"
import { AnalysisResult, MultiCompareResult } from "./types"
import { supabase } from "@/lib/supabase"



const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:8000/api"



// ─────────────────────────────────────────────────────────────
//  Axios instance with auth interceptor
// ─────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: BASE_URL })


api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})


api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const { data: { session } } = await supabase.auth.refreshSession()
      if (session) {
        error.config.headers.Authorization = `Bearer ${session.access_token}`
        return api.request(error.config)
      }
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)



// ─────────────────────────────────────────────────────────────
//  Upload & Analysis
// ─────────────────────────────────────────────────────────────
export async function uploadFile(file: File): Promise<{ file_id: string; filename: string }> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await api.post("/upload", formData)
  return res.data
}


export async function fetchAnalysis(fileId: string): Promise<AnalysisResult> {
  const res = await api.get(`/analysis/${fileId}`)
  return res.data
}


export async function fetchDataStory(fileId: string): Promise<{ story: string }> {
  const res = await api.get(`/story/${fileId}`)
  return res.data
}



// ─────────────────────────────────────────────────────────────
//  Chat
// ─────────────────────────────────────────────────────────────
export async function askQuestion(
  fileId: string,
  question: string
): Promise<{ answer: string; question: string }> {
  const res = await api.post(`/chat/${fileId}`, { question })
  return res.data
}



// ─────────────────────────────────────────────────────────────
//  Export
// ─────────────────────────────────────────────────────────────
export async function exportPDF(fileId: string): Promise<void> {
  const res = await api.get(`/export/${fileId}`, { responseType: "blob" })
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }))
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", `bizlytics_report_${fileId.slice(0, 8)}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}


export async function exportComparisonPdf(payload: {
  type: "two" | "multi"
  result: unknown
}): Promise<Blob> {
  const res = await api.post("/compare/export-pdf", payload, {
    responseType: "blob",
  })
  return new Blob([res.data], { type: "application/pdf" })
}



// ─────────────────────────────────────────────────────────────
//  Compare — 2-file
// ─────────────────────────────────────────────────────────────
export async function compareDatasets(
  file1: File,
  file2: File,
  label1: string,
  label2: string
): Promise<any> {
  const formData = new FormData()
  formData.append("file1", file1)
  formData.append("file2", file2)
  formData.append("label1", label1)
  formData.append("label2", label2)
  const res = await api.post("/compare", formData)
  return res.data
}



// ─────────────────────────────────────────────────────────────
//  Compare — multi-file (2–10 files)
// ─────────────────────────────────────────────────────────────
export async function compareMultipleDatasets(
  files: File[],
  labels: string[]
): Promise<MultiCompareResult> {
  if (files.length < 2 || files.length > 10)
    throw new Error("compareMultipleDatasets requires between 2 and 10 files.")
  if (files.length !== labels.length)
    throw new Error("Each file must have a corresponding label.")

  const formData = new FormData()
  files.forEach((file) => formData.append("files", file))
  formData.append("labels", JSON.stringify(labels))

  const res = await api.post<MultiCompareResult>("/compare/multi", formData)
  return res.data
}



// ─────────────────────────────────────────────────────────────
//  History — single-file analyses
// ─────────────────────────────────────────────────────────────
export async function getHistory(opts?: {
  domain?: string
  search?: string
  limit?: number
}): Promise<{ sessions: any[] }> {
  const res = await api.get("/history", { params: opts })
  return res.data
}


export async function getHistoryStats(): Promise<{
  total: number
  domain_counts: Record<string, number>
}> {
  const res = await api.get("/history/stats")
  return res.data
}


export async function getHistorySession(sessionId: string): Promise<any> {
  const res = await api.get(`/history/${sessionId}`)
  return res.data
}


export async function deleteHistorySession(sessionId: string): Promise<void> {
  await api.delete(`/history/${sessionId}`)
}


export async function clearAllHistory(): Promise<void> {
  await api.delete("/history")
}


export async function bulkDeleteHistory(sessionIds: string[]): Promise<void> {
  await api.delete("/history/bulk", { data: sessionIds })
}



// ─────────────────────────────────────────────────────────────
//  History — comparison sessions
// ─────────────────────────────────────────────────────────────
export async function getComparisonHistory(opts?: {
  type?: "two" | "multi"
  search?: string
  limit?: number
}): Promise<{ sessions: ComparisonSession[] }> {
  const res = await api.get("/history/comparisons", { params: opts })
  return res.data
}


export async function getComparisonStats(): Promise<{
  total: number
  two_count: number
  multi_count: number
}> {
  const res = await api.get("/history/comparisons/stats")
  return res.data
}


export async function getComparisonSession(sessionId: string): Promise<any> {
  const res = await api.get(`/history/comparisons/${sessionId}`)
  return res.data
}


export async function deleteComparisonSession(sessionId: string): Promise<void> {
  await api.delete(`/history/comparisons/${sessionId}`)
}


export async function clearAllComparisons(): Promise<void> {
  await api.delete("/history/comparisons/")
}



// ─────────────────────────────────────────────────────────────
//  Shared type used by the history page
// ─────────────────────────────────────────────────────────────
export interface ComparisonSession {
  id: string
  type: "two" | "multi"
  labels: string[]
  file_names: string[]
  file_count: number
  common_columns: string[]
  created_at: string
}
