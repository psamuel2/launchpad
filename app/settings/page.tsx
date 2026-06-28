"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import Sidebar from "@/components/Sidebar"

type Tab = "profile" | "security" | "billing" | "notifications"

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "security", label: "Security", icon: "🔒" },
  { id: "billing", label: "Billing & Plan", icon: "💳" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
]

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [resetSent, setResetSent] = useState(false)
  const [notifications, setNotifications] = useState({
    productUpdates: true,
    weeklyDigest: false,
    securityAlerts: true,
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      if (!user) {
        router.push("/")
      } else {
        setUser(user)
        setFullName(user.user_metadata?.full_name || "")
        setEmail(user.email || "")
        setLoading(false)
      }
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    })
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  async function handlePasswordReset() {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetSent(true)
    setTimeout(() => setResetSent(false), 4000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    )
  }

  const userInitials = fullName
    ? fullName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar user={user} />

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-10">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-slate-400 mt-1 text-sm">Manage your account preferences and security</p>
          </div>

          <div className="flex gap-8">

            {/* Left tab nav */}
            <aside className="w-48 shrink-0">
              <nav className="flex flex-col gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all ${
                      activeTab === tab.id
                        ? "bg-white/10 text-white font-medium"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="text-base">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Danger zone */}
              <div className="mt-8 pt-6 border-t border-white/8">
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push("/")
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all w-full text-left"
                >
                  <span>↩</span>
                  Sign out
                </button>
              </div>
            </aside>

            {/* Right content */}
            <div className="flex-1 min-w-0">

              {/* ── PROFILE TAB ── */}
              {activeTab === "profile" && (
                <div className="space-y-5">

                  {/* Avatar card */}
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
                    <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wider">
                      Profile Photo
                    </h2>
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xl font-bold shrink-0">
                        {userInitials}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{fullName || "No name set"}</p>
                        <p className="text-sm text-slate-400 mt-0.5">{email}</p>
                        <span className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                          Free plan
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Personal info */}
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
                    <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wider">
                      Personal Information
                    </h2>
                    <form onSubmit={handleSave} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                            Email Address
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              value={email}
                              disabled
                              className="w-full bg-white/[0.02] border border-white/8 rounded-xl px-4 py-2.5 text-slate-500 text-sm cursor-not-allowed pr-16"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 bg-white/5 px-2 py-0.5 rounded-md">
                              locked
                            </span>
                          </div>
                        </div>
                      </div>

                      {saved && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                          <span>✅</span> Profile updated successfully!
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-white/8">
                        <p className="text-xs text-slate-500">Changes are saved to your account immediately</p>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-all disabled:opacity-60 flex items-center gap-2"
                        >
                          {saving ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Saving…
                            </>
                          ) : "Save changes"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ── SECURITY TAB ── */}
              {activeTab === "security" && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
                    <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wider">
                      Password
                    </h2>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Change your password</p>
                        <p className="text-xs text-slate-500 mt-1">
                          We'll send a secure reset link to <span className="text-slate-400">{email}</span>
                        </p>
                        {resetSent && (
                          <p className="text-xs text-emerald-400 mt-2">
                            ✅ Reset link sent — check your inbox!
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handlePasswordReset}
                        className="shrink-0 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm transition"
                      >
                        Send reset link
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
                    <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wider">
                      Active Sessions
                    </h2>
                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-base">💻</div>
                        <div>
                          <p className="text-sm font-medium">Current session</p>
                          <p className="text-xs text-slate-500 mt-0.5">Abuja, Nigeria · Chrome</p>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        Active now
                      </span>
                    </div>
                    <div className="pt-4">
                      <button
                        onClick={async () => {
                          await supabase.auth.signOut()
                          router.push("/")
                        }}
                        className="text-sm text-red-400 hover:text-red-300 transition"
                      >
                        Sign out of all sessions →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── BILLING TAB ── */}
              {activeTab === "billing" && (
                <div className="space-y-5">
                  {/* Current plan */}
                  <div className="rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-600/10 to-violet-600/10 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Current Plan</h2>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-slate-400">Active</span>
                        </div>
                        <p className="text-3xl font-bold mt-2">Free</p>
                        <p className="text-sm text-slate-400 mt-1">Access to 6 core tools · 10 CV exports/month</p>
                      </div>
                      <button className="shrink-0 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition">
                        Upgrade to Pro
                      </button>
                    </div>
                  </div>

                  {/* Pro features */}
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
                    <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wider">
                      Pro Plan — ₦2,500/mo
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        "Unlimited CV exports",
                        "AI cover letter generator",
                        "Priority support",
                        "Advanced salary insights",
                        "Invoice history & tracking",
                        "Early access to new tools",
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                          <span className="text-blue-400">✓</span>
                          {feature}
                        </div>
                      ))}
                    </div>
                    <button className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-sm font-medium transition">
                      Upgrade now — ₦2,500/mo
                    </button>
                  </div>
                </div>
              )}

              {/* ── NOTIFICATIONS TAB ── */}
              {activeTab === "notifications" && (
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
                  <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wider">
                    Email Notifications
                  </h2>
                  <div className="space-y-1">
                    {[
                      { key: "productUpdates", label: "Product updates", desc: "New tools and feature announcements" },
                      { key: "weeklyDigest", label: "Weekly digest", desc: "A summary of your activity each week" },
                      { key: "securityAlerts", label: "Security alerts", desc: "Login attempts and account changes" },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between py-4 border-b border-white/5 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          onClick={() =>
                            setNotifications((prev) => ({
                              ...prev,
                              [item.key]: !prev[item.key as keyof typeof prev],
                            }))
                          }
                          className={`relative w-10 h-5.5 rounded-full transition-colors ${
                            notifications[item.key as keyof typeof notifications]
                              ? "bg-blue-600"
                              : "bg-white/10"
                          }`}
                          style={{ height: "22px", width: "40px" }}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              notifications[item.key as keyof typeof notifications]
                                ? "translate-x-[18px]"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}