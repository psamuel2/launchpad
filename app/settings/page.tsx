"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import Sidebar from "@/components/Sidebar"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
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
      data: { full_name: fullName }
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
    alert("Password reset email sent! Check your inbox.")
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
        <div className="max-w-2xl mx-auto px-6 py-8">

          <div className="mb-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-slate-400 mt-1.5 text-sm">Manage your account</p>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-8 p-5 rounded-2xl bg-white/5 border border-white/8">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
              {userInitials}
            </div>
            <div>
              <p className="font-medium">{fullName || email}</p>
              <p className="text-sm text-slate-400">{email}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-slate-400 mt-1 inline-block">
                Free plan
              </span>
            </div>
          </div>

          {/* Profile form */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-6 mb-4">
            <h2 className="text-sm font-semibold mb-4">Profile</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-500 text-sm cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              {saved && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                  ✅ Profile updated successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </form>
          </div>

          {/* Security */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-6 mb-4">
            <h2 className="text-sm font-semibold mb-4">Security</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Password</p>
                <p className="text-xs text-slate-500 mt-0.5">Send a reset link to your email</p>
              </div>
              <button
                onClick={handlePasswordReset}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm transition"
              >
                Reset password
              </button>
            </div>
          </div>

          {/* Plan */}
          <div className="bg-gradient-to-br from-blue-600/15 to-violet-600/15 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Current plan</h2>
                <p className="text-2xl font-bold mt-1">Free</p>
                <p className="text-xs text-slate-400 mt-1">Limited to basic tools</p>
              </div>
              <button className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition">
                Upgrade to Pro
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}