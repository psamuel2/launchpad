"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) {
          setError(error.message)
        } else {
          setMessage("Password reset link sent. Check your email.")
        }
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        })
        if (error) {
          setError(error.message)
        } else {
          setMessage("Account created! Check your email to confirm, then sign in.")
          setMode("signin")
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(error.message)
        } else {
          router.push("/")
          router.refresh()
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold mb-1">⚡ LaunchPad</div>
          <p className="text-slate-400 text-sm">
            {mode === "signin" && "Sign in to your account"}
            {mode === "signup" && "Create your account"}
            {mode === "forgot" && "Reset your password"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.04] border border-white/8 rounded-2xl p-6 flex flex-col gap-4"
        >
          {mode === "signup" && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-blue-500/50 transition"
                placeholder="Jane Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-blue-500/50 transition"
              placeholder="you@example.com"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-slate-400">Password</label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot")
                      setError(null)
                      setMessage(null)
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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
          )}

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all mt-1"
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
              ? "Sign in"
              : mode === "signup"
              ? "Sign up"
              : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-5">
          {mode === "forgot" ? (
            <button
              type="button"
              onClick={() => {
                setMode("signin")
                setError(null)
                setMessage(null)
              }}
              className="text-blue-400 hover:text-blue-300 font-medium transition"
            >
              Back to sign in
            </button>
          ) : (
            <>
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin")
                  setError(null)
                  setMessage(null)
                }}
                className="text-blue-400 hover:text-blue-300 font-medium transition"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}