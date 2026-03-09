import axios from "axios"
import { AnalysisResult } from "./types"
import { supabase } from "@/lib/supabase"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:8000/api"

// Axios instance with auth interceptor
const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Auto-retry once on 401 with refreshed token
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const { data: { session } } = await supabase.auth.refreshSession()
      if (session) {
        error.config.headers.Authorization = `Bearer ${session.access_token}`
        return api.request(error.config)
      }
      // Refresh failed — redirect to login
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export async function uploadFile(file: File): Promise<{ file_id: string; filename: string }> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
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

export async function askQuestion(
  fileId: string,
  question: string
): Promise<{ answer: string; question: string }> {
  const res = await api.post(`/chat/${fileId}`, { question })
  return res.data
}

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
  const res = await api.post("/compare", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}

export async function getHistory(): Promise<{ sessions: any[] }> {
  const res = await api.get("/history")
  return res.data
}

export async function getHistorySession(sessionId: string): Promise<any> {
  const res = await api.get(`/history/${sessionId}`)
  return res.data
}

export async function deleteHistorySession(sessionId: string): Promise<void> {
  await api.delete(`/history/${sessionId}`)
}
