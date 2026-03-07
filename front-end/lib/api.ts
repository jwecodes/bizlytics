import axios from "axios"
import { AnalysisResult } from "./types"

const BASE_URL = "http://localhost:8000/api"

export async function uploadFile(file: File): Promise<{ file_id: string; filename: string }> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await axios.post(`${BASE_URL}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}

export async function fetchAnalysis(fileId: string): Promise<AnalysisResult> {
  const res = await axios.get(`${BASE_URL}/analysis/${fileId}`)
  return res.data
}

export async function fetchDataStory(fileId: string): Promise<{ story: string }> {
  const res = await axios.get(`${BASE_URL}/story/${fileId}`)
  return res.data
}

export async function askQuestion(
  fileId: string,
  question: string
): Promise<{ answer: string; question: string }> {
  const res = await axios.post(`${BASE_URL}/chat/${fileId}`, { question })
  return res.data
}

export async function exportPDF(fileId: string): Promise<void> {
  const res = await axios.get(`${BASE_URL}/export/${fileId}`, {
    responseType: "blob",
  })
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

  const res = await axios.post(`${BASE_URL}/compare`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}
