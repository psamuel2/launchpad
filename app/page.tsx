"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import Sidebar from "@/components/Sidebar"

type AuthView = "login" | "signup" | "forgot"

const tools = [
  { title: "CV Builder", desc: "AI-powered CV generation", path: "/careers/cv-builder", icon: "📄", badge: "AI", color: "#6366f1" },
  { title: "Salary Calculator", desc: "Estimate earnings & tax", path: "/finance/salary-calculator", icon: "💰", badge: null, color: "#10b981" },
  { title: "Invoice Generator", desc: "Create invoices instantly", path: "/finance/invoice", icon: "🧾", badge: null, color: "#f59e0b" },
  { title: "Loan Calculator", desc: "Plan repayments easily", path: "/finance/loan-calculator", icon: "🏦", badge: null, color: "#3b82f6" },
  { title: "Currency Converter", desc: "Live exchange rates", path: "/finance/currency-converter", icon: "🌍", badge: "Live", color: "#06b6d4" },
  { title: "Job Tools", desc: "Career preparation suite", path: "/careers", icon: "🚀", badge: null, color: "#8b5cf6" },
]

const recentActivity = [
  { tool: "CV Builder", action: "Generated a new CV", time: "2 min ago", icon: "📄" },
  { tool: "Invoice Generator", action: "Invoice #INV-042 created", time: "Yesterday", icon: "🧾" },
  { tool: "Salary Calculator", action: "Estimated NGN 850,000/mo", time: "3 days ago", icon: "💰" },
]

export default function Home() {
  const supabase = createClient()

  const [authView, setAuthView] = useState<AuthView>("login")
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotSent, setForgotSent] = useState(false)

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      setUser(user)
      setLoadingUser(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: { full_name: signupName },
      },
    })
    if (error) {
      setError(error.message)
    } else {
      setError("✅ Account created! Check your email to confirm your account, then sign in.")
    }
    setLoading(false)
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
    } else {
      setForgotSent(true)
    }
    setLoading(false)
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <span className="text-3xl font-bold text-white tracking-tight">⚡ LaunchPad</span>
            <p className="text-slate-400 mt-2 text-sm">Build • Apply • Grow</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">

            {authView !== "forgot" && (
              <div className="flex mb-8 bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => { setAuthView("login"); setError("") }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    authView === "login" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setAuthView("signup"); setError("") }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    authView === "signup" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Create account
                </button>
              </div>
            )}

            {error && (
              <div className={`mb-6 p-3 rounded-xl text-sm border ${
                error.startsWith("✅")
                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {error}
              </div>
            )}

            {authView === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => { setAuthView("forgot"); setError("") }}
                      className="text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-60 text-sm"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>
            )}

            {authView === "signup" && (
              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Full name</label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Ada Okonkwo"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-60 text-sm"
                >
                  {loading ? "Creating account…" : "Create account"}
                </button>
                <p className="text-xs text-slate-500 text-center">
                  By creating an account you agree to our{" "}
                  <span className="text-slate-400 underline cursor-pointer">Terms</span>{" "}
                  and{" "}
                  <span className="text-slate-400 underline cursor-pointer">Privacy Policy</span>.
                </p>
              </form>
            )}

            {authView === "forgot" && (
              <div>
                <h2 className="text-lg font-semibold mb-1">Reset your password</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Enter your email and we'll send you a reset link.
                </p>
                {forgotSent ? (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    ✅ Reset link sent! Check your email inbox.
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-60 text-sm"
                    >
                      {loading ? "Sending…" : "Send reset link"}
                    </button>
                  </form>
                )}
                <button
                  onClick={() => { setAuthView("login"); setError(""); setForgotSent(false) }}
                  className="mt-4 text-sm text-slate-400 hover:text-white transition"
                >
                  ← Back to sign in
                </button>
              </div>
            )}

          </div>

          <p className="text-center text-slate-500 text-xs mt-6">
            Trusted by 2,400+ professionals across Nigeria
          </p>
        </div>
      </div>
    )
  }

  // ─── DASHBOARD ────────────────────────────────────────────────────────────

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">

      <Sidebar user={user} />

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">

          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {userName.split(" ")[0]} 👋
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm">
                Your productivity dashboard —{" "}
                {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm transition">
                + New Tool
              </button>
              <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition">
                Upgrade
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {[
              { label: "Tools available", value: "6", icon: "🧰", sub: "+2 coming soon", color: "from-blue-600/15 to-transparent" },
              { label: "CVs generated", value: "128+", icon: "📄", sub: "across all users", color: "from-violet-600/15 to-transparent" },
              { label: "Active users", value: "2.4K", icon: "👥", sub: "this month", color: "from-emerald-600/15 to-transparent" },
            ].map((s, i) => (
              <div key={i} className={`p-5 rounded-2xl bg-gradient-to-br ${s.color} border border-white/8`}>
                <div className="text-2xl mb-3">{s.icon}</div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-slate-300 text-sm mt-0.5">{s.label}</div>
                <div className="text-slate-500 text-xs mt-1">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Quick tools</h2>
              <button className="text-sm text-blue-400 hover:text-blue-300 transition">View all →</button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <Link
                  key={tool.title}
                  href={tool.path}
                  className="group p-5 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/8 hover:border-white/15 hover:-translate-y-0.5 transition-all duration-200 block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${tool.color}25` }}
                    >
                      {tool.icon}
                    </div>
                    {tool.badge && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${tool.color}25`, color: tool.color }}
                      >
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold mb-1">{tool.title}</h3>
                  <p className="text-slate-400 text-xs">{tool.desc}</p>
                  <div className="mt-4 text-xs font-medium" style={{ color: tool.color }}>
                    Open →
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-5">Recent activity</h2>
            <div className="space-y-2">
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-base shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.tool}</p>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}