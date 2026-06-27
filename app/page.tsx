"use client"

import { useState } from "react"
import Link from "next/link"

type AuthView = "login" | "signup" | "dashboard"

interface User {
  name: string
  email: string
  plan: "free" | "pro"
  initials: string
}

export default function Home() {
  const [view, setView] = useState<AuthView>("login")
  const [activeNav, setActiveNav] = useState("dashboard")
  const [user, setUser] = useState<User | null>(null)

  // Form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const tools = [
    {
      title: "CV Builder",
      desc: "AI-powered CV generation",
      path: "/careers/cv-builder",
      icon: "📄",
      badge: "AI",
      color: "#6366f1",
    },
    {
      title: "Salary Calculator",
      desc: "Estimate earnings & tax",
      path: "/finance/salary-calculator",
      icon: "💰",
      badge: null,
      color: "#10b981",
    },
    {
      title: "Invoice Generator",
      desc: "Create invoices instantly",
      path: "/finance/invoice",
      icon: "🧾",
      badge: null,
      color: "#f59e0b",
    },
    {
      title: "Loan Calculator",
      desc: "Plan repayments easily",
      path: "/finance/loan-calculator",
      icon: "🏦",
      badge: null,
      color: "#3b82f6",
    },
    {
      title: "Currency Converter",
      desc: "Live exchange rates",
      path: "/finance/currency-converter",
      icon: "🌍",
      badge: "Live",
      color: "#06b6d4",
    },
    {
      title: "Job Tools",
      desc: "Career preparation suite",
      path: "/careers",
      icon: "🚀",
      badge: null,
      color: "#8b5cf6",
    },
  ]

  const recentActivity = [
    { tool: "CV Builder", action: "Generated a new CV", time: "2 min ago", icon: "📄" },
    { tool: "Invoice Generator", action: "Invoice #INV-042 created", time: "Yesterday" , icon: "🧾" },
    { tool: "Salary Calculator", action: "Estimated NGN 850,000/mo", time: "3 days ago", icon: "💰" },
  ]

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!loginEmail || !loginPassword) {
      setError("Please fill in all fields.")
      return
    }
    setLoading(true)
    // Simulate auth
    setTimeout(() => {
      const name = loginEmail.split("@")[0]
      const initials = name.slice(0, 2).toUpperCase()
      setUser({ name, email: loginEmail, plan: "free", initials })
      setView("dashboard")
      setLoading(false)
    }, 900)
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!signupName || !signupEmail || !signupPassword) {
      setError("Please fill in all fields.")
      return
    }
    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    setTimeout(() => {
      const initials = signupName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
      setUser({ name: signupName, email: signupEmail, plan: "free", initials })
      setView("dashboard")
      setLoading(false)
    }, 900)
  }

  function handleLogout() {
    setUser(null)
    setLoginEmail("")
    setLoginPassword("")
    setView("login")
  }

  // ─── AUTH SCREENS ───────────────────────────────────────────────────────────

  if (view === "login" || view === "signup") {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8">
            <span className="text-3xl font-bold text-white tracking-tight">
              ⚡ LaunchPad
            </span>
            <p className="text-slate-400 mt-2 text-sm">Build • Apply • Grow</p>
          </div>

          {/* Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">

            {/* Tabs */}
            <div className="flex mb-8 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => { setView("login"); setError("") }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  view === "login"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => { setView("signup"); setError("") }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  view === "signup"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create account
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            {view === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition text-sm"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-slate-300">Password</label>
                    <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition">
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>
            )}

            {/* Signup Form */}
            {view === "signup" && (
              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Full name</label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Ada Okonkwo"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
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

          </div>

          {/* Social proof */}
          <p className="text-center text-slate-500 text-xs mt-6">
            Trusted by 2,400+ professionals across Nigeria
          </p>

        </div>
      </div>
    )
  }

  // ─── DASHBOARD ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/8 p-5 hidden md:flex flex-col shrink-0">

        {/* Logo */}
        <div className="text-xl font-bold mb-8 px-2">
          ⚡ LaunchPad
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: "📊" },
            { id: "tools", label: "Tools", icon: "🧰" },
            { id: "recent", label: "Recent", icon: "🕒" },
            { id: "settings", label: "Settings", icon: "⚙️" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                activeNav === item.id
                  ? "bg-white/10 text-white font-medium"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Upgrade CTA */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20">
          <div className="text-sm font-medium mb-1">Go Pro</div>
          <p className="text-xs text-slate-400 mb-3">Unlock unlimited tools and AI features.</p>
          <button className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium transition">
            Upgrade — ₦2,500/mo
          </button>
        </div>

        {/* User */}
        <div className="mt-auto pt-5 border-t border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-white transition text-xs shrink-0"
              title="Sign out"
            >
              ↩
            </button>
          </div>
        </div>

      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* TOP BAR */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {user?.name?.split(" ")[0]} 👋
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm">
                Your productivity dashboard — {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
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

          {/* STATS */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {[
              { label: "Tools available", value: "6", icon: "🧰", sub: "+2 coming soon", color: "from-blue-600/15 to-transparent" },
              { label: "CVs generated", value: "128+", icon: "📄", sub: "across all users", color: "from-violet-600/15 to-transparent" },
              { label: "Active users", value: "2.4K", icon: "👥", sub: "this month", color: "from-emerald-600/15 to-transparent" },
            ].map((s, i) => (
              <div
                key={i}
                className={`p-5 rounded-2xl bg-gradient-to-br ${s.color} border border-white/8 relative overflow-hidden`}
              >
                <div className="text-2xl mb-3">{s.icon}</div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-slate-300 text-sm mt-0.5">{s.label}</div>
                <div className="text-slate-500 text-xs mt-1">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* TOOLS */}
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

          {/* RECENT ACTIVITY */}
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