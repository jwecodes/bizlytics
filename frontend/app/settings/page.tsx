"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import {
  loadPreferences, savePreferences, updateProfile,
  updatePassword, UserPreferences, DEFAULT_PREFERENCES
} from "@/lib/settings"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3, ArrowLeft, User, Key, Brain,
  Bell, Shield, Save, Eye, EyeOff, Trash2,
  CheckCircle, History, LogOut
} from "lucide-react"

type Section = "profile" | "analysis" | "api" | "security" | "account"

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "profile",  label: "Profile",           icon: <User className="w-4 h-4" /> },
  { id: "analysis", label: "Analysis Settings",  icon: <Brain className="w-4 h-4" /> },
  { id: "api",      label: "API Configuration",  icon: <Key className="w-4 h-4" /> },
  { id: "security", label: "Security",           icon: <Shield className="w-4 h-4" /> },
  { id: "account",  label: "Account",            icon: <Bell className="w-4 h-4" /> },
]

function SectionTitle({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-xs text-white/30 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function InputField({
  label, value, onChange, type = "text", placeholder = "", hint = ""
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-white/60">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm
          focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
          placeholder:text-white/20 transition-all"
      />
      {hint && <p className="text-xs text-white/20">{hint}</p>}
    </div>
  )
}

function ToggleField({
  label, desc, checked, onChange
}: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-xs text-white/30 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200
          ${checked ? "bg-purple-500" : "bg-white/10"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
          ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  const [activeSection, setActiveSection] = useState<Section>("profile")
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Profile fields
  const [fullName, setFullName] = useState("")
  const [nameChanged, setNameChanged] = useState(false)

  // Security fields
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword]         = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword]       = useState(false)

  // API key visibility
  const [showApiKey, setShowApiKey] = useState(false)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState("")

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  // Load preferences
  useEffect(() => {
    if (!user) return
    setFullName(user.user_metadata?.full_name || "")
    loadPreferences()
      .then(p => setPrefs(p))
      .catch(() => toast.error("Failed to load preferences"))
      .finally(() => setLoading(false))
  }, [user])

  const handleSavePrefs = async () => {
    setSaving(true)
    try {
      await savePreferences(prefs)
      if (nameChanged) {
        await updateProfile(fullName)
        setNameChanged(false)
      }
      toast.success("Settings saved!")
    } catch (e: any) {
      toast.error(e.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    setSaving(true)
    try {
      await updatePassword(newPassword)
      toast.success("Password updated!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (e: any) {
      toast.error(e.message || "Failed to update password")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) return (
    <div className="min-h-screen bg-[#0d0e1a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0d0e1a] text-white">

      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#0d0e1a] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white leading-none">Settings</p>
            <p className="text-xs text-white/30">Manage your account & preferences</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/history")}
            className="text-white/40 hover:text-white hover:bg-white/10 gap-1.5 hidden sm:flex"
          >
            <History className="w-3.5 h-3.5" />
            History
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-white/30 hover:text-red-400 hover:bg-red-500/10 gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Sign out</span>
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">

        {/* Sidebar nav */}
        <aside className="lg:w-56 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2 flex flex-row lg:flex-col gap-1">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left
                  ${activeSection === item.id
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/20"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                  }`}
              >
                {item.icon}
                <span className="hidden sm:block">{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">

          {/* ── PROFILE ────────────────────────────────── */}
          {activeSection === "profile" && (
            <Card className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <SectionTitle
                icon={<User className="w-4 h-4" />}
                title="Profile"
                desc="Your public name and email address"
              />
              <div className="space-y-4">
                <InputField
                  label="Full Name"
                  value={fullName}
                  onChange={v => { setFullName(v); setNameChanged(true) }}
                  placeholder="Your name"
                />
                <div className="space-y-1.5">
                  <label className="text-sm text-white/60">Email</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/30 text-sm cursor-not-allowed"
                    />
                    <Badge className="bg-green-500/20 text-green-400 border-0 shrink-0 gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </Badge>
                  </div>
                  <p className="text-xs text-white/20">Email cannot be changed</p>
                </div>
              </div>
              <div className="mt-6 pt-5 border-t border-white/10">
                <Button
                  onClick={handleSavePrefs}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Card>
          )}

          {/* ── ANALYSIS SETTINGS ──────────────────────── */}
          {activeSection === "analysis" && (
            <Card className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <SectionTitle
                icon={<Brain className="w-4 h-4" />}
                title="Analysis Settings"
                desc="Control how Bizlytics analyses your datasets"
              />
              <div className="space-y-6">

                {/* Forecast horizon */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white/60">Forecast Horizon</label>
                    <span className="text-sm font-semibold text-purple-400">
                      {prefs.forecast_horizon_days} days
                    </span>
                  </div>
                  <input
                    type="range"
                    min={30} max={365} step={30}
                    value={prefs.forecast_horizon_days}
                    onChange={e => setPrefs(p => ({
                      ...p, forecast_horizon_days: Number(e.target.value)
                    }))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-white/20">
                    <span>30 days</span>
                    <span>180 days</span>
                    <span>365 days</span>
                  </div>
                  <p className="text-xs text-white/20">
                    How far into the future Prophet should forecast
                  </p>
                </div>

                {/* Anomaly sensitivity */}
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Anomaly Detection Sensitivity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["low", "medium", "high"] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => setPrefs(p => ({ ...p, anomaly_sensitivity: level }))}
                        className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all border
                          ${prefs.anomaly_sensitivity === level
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                            : "bg-white/5 text-white/30 border-white/10 hover:border-white/20 hover:text-white/60"
                          }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-white/20">
                    High = more flags (more false positives). Low = fewer flags (may miss anomalies).
                  </p>
                </div>

                {/* Default tab */}
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Default Dashboard Tab</label>
                  <select
                    value={prefs.default_tab}
                    onChange={e => setPrefs(p => ({
                      ...p, default_tab: e.target.value as UserPreferences["default_tab"]
                    }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
                  >
                    <option value="overview">Overview</option>
                    <option value="insights">Insights</option>
                    <option value="anomalies">Anomalies</option>
                    <option value="forecast">Forecast</option>
                    <option value="segments">Segments</option>
                  </select>
                  <p className="text-xs text-white/20">
                    Which tab opens first when you land on the dashboard
                  </p>
                </div>

              </div>

              <div className="mt-6 pt-5 border-t border-white/10">
                <Button
                  onClick={handleSavePrefs}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </Card>
          )}

          {/* ── API CONFIGURATION ──────────────────────── */}
          {activeSection === "api" && (
            <Card className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <SectionTitle
                icon={<Key className="w-4 h-4" />}
                title="API Configuration"
                desc="Configure your LLM provider keys"
              />
              <div className="space-y-4">

                {/* Groq key */}
                <div className="space-y-1.5">
                  <label className="text-sm text-white/60">Groq API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={prefs.groq_api_key}
                      onChange={e => setPrefs(p => ({ ...p, groq_api_key: e.target.value }))}
                      placeholder="gsk_..."
                      className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/20"
                    />
                    <button
                      onClick={() => setShowApiKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-white/20">
                    Get your key from{" "}
                    <a
                      href="https://console.groq.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:underline"
                    >
                      console.groq.com
                    </a>
                    {" "}— stored encrypted in your profile
                  </p>
                </div>

                {/* Info box */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-blue-400 font-medium mb-1">💡 How it works</p>
                  <p className="text-xs text-white/30 leading-relaxed">
                    Bizlytics uses the Groq API to generate AI insights, data stories, and chat responses.
                    If you leave this blank, the server-side key is used instead.
                    Your own key gives you higher rate limits and priority access.
                  </p>
                </div>

              </div>

              <div className="mt-6 pt-5 border-t border-white/10">
                <Button
                  onClick={handleSavePrefs}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save API Key"}
                </Button>
              </div>
            </Card>
          )}

          {/* ── SECURITY ───────────────────────────────── */}
          {activeSection === "security" && (
            <Card className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <SectionTitle
                icon={<Shield className="w-4 h-4" />}
                title="Security"
                desc="Update your password"
              />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-white/60">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/20"
                    />
                    <button
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <InputField
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  type="password"
                  placeholder="Repeat new password"
                />
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-400">Passwords don't match</p>
                )}
                {newPassword && confirmPassword && newPassword === confirmPassword && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-white/10">
                <Button
                  onClick={handlePasswordChange}
                  disabled={saving || !newPassword || newPassword !== confirmPassword}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 gap-2"
                >
                  <Shield className="w-4 h-4" />
                  {saving ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </Card>
          )}

          {/* ── ACCOUNT ────────────────────────────────── */}
          {activeSection === "account" && (
            <div className="space-y-4">

              {/* Notifications */}
              <Card className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <SectionTitle
                  icon={<Bell className="w-4 h-4" />}
                  title="Notifications"
                  desc="Control email notifications"
                />
                <ToggleField
                  label="Analysis complete emails"
                  desc="Get an email when a long-running analysis finishes"
                  checked={prefs.email_notifications}
                  onChange={v => setPrefs(p => ({ ...p, email_notifications: v }))}
                />
                <div className="mt-5 pt-4 border-t border-white/10">
                  <Button
                    onClick={handleSavePrefs}
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </Card>

              {/* Danger zone */}
              <Card className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                <SectionTitle
                  icon={<Trash2 className="w-4 h-4 text-red-400" />}
                  title="Danger Zone"
                  desc="Irreversible actions — proceed with caution"
                />
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm text-white/60">
                      Type <span className="text-red-400 font-mono">DELETE</span> to confirm account deletion
                    </label>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                      placeholder="DELETE"
                      className="w-full px-3 py-2.5 rounded-xl bg-red-500/5 border border-red-500/20 text-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-white/20"
                    />
                    <p className="text-xs text-white/20">
                      This will permanently delete your account and all analysis history.
                    </p>
                  </div>
                  <Button
                    disabled={deleteConfirm !== "DELETE"}
                    onClick={logout}
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 gap-2
                      disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete My Account
                  </Button>
                </div>
              </Card>

            </div>
          )}

        </main>
      </div>
    </div>
  )
}
