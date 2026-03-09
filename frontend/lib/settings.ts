import { supabase } from "@/lib/supabase"

export interface UserPreferences {
  forecast_horizon_days: number
  anomaly_sensitivity: "low" | "medium" | "high"
  default_tab: "overview" | "insights" | "anomalies" | "forecast" | "segments"
  groq_api_key: string
  email_notifications: boolean
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  forecast_horizon_days: 90,
  anomaly_sensitivity: "medium",
  default_tab: "overview",
  groq_api_key: "",
  email_notifications: false,
}

export async function loadPreferences(): Promise<UserPreferences> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return DEFAULT_PREFERENCES

  const { data } = await supabase
    .from("profiles")
    .select("preferences, full_name, email")
    .eq("id", user.id)
    .single()

  return {
    ...DEFAULT_PREFERENCES,
    ...(data?.preferences ?? {}),
  }
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Load existing first to merge
  const existing = await loadPreferences()
  const merged = { ...existing, ...prefs }

  const { error } = await supabase
    .from("profiles")
    .update({ preferences: merged })
    .eq("id", user.id)

  if (error) throw new Error(error.message)
}

export async function updateProfile(fullName: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id)

  if (error) throw new Error(error.message)

  // Also update auth metadata
  await supabase.auth.updateUser({ data: { full_name: fullName } })
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
}

export async function deleteAccount(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  // Sign out — actual deletion requires service role (backend)
  await supabase.auth.signOut()
}
