"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Eye, EyeOff } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setLoading(false)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold mb-1">⚡ LaunchPad</div>
          <p className="text-slate-400 text-sm">Set a new password</p>
        </div>

        {done ? (
          <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-6 text-center">
            <p className="text-emerald-400 text-sm">
              Password updated! Redirecting you to sign in…
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white/[0.04] border border-white/8 rounded-2xl p-6 flex flex-col gap-4"
          >
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-blue-500/50 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all mt-1"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}