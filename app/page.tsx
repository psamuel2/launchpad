"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import Sidebar from "@/components/Sidebar"
import {
  FileText,
  DollarSign,
  Receipt,
  Building2,
  Globe,
  Rocket,
  Wrench,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
  Sparkles,
  Menu,
  X,
} from "lucide-react"

const tools = [
  {
    title: "CV Builder",
    desc: "AI-powered CV generation",
    path: "/careers/cv-builder",
    icon: FileText,
    badge: "AI",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.12)",
  },
  {
    title: "Salary Calculator",
    desc: "Estimate earnings & tax",
    path: "/finance/salary-calculator",
    icon: DollarSign,
    badge: null,
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
  },
  {
    title: "Invoice Generator",
    desc: "Create invoices instantly",
    path: "/finance/invoice",
    icon: Receipt,
    badge: null,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
  },
  {
    title: "Loan Calculator",
    desc: "Plan repayments easily",
    path: "/finance/loan-calculator",
    icon: Building2,
    badge: null,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
  },
  {
    title: "Currency Converter",
    desc: "Live exchange rates",
    path: "/finance/currency-converter",
    icon: Globe,
    badge: "Live",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.12)",
  },
  {
    title: "Job Tools",
    desc: "Career preparation suite",
    path: "/careers",
    icon: Rocket,
    badge: null,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
  },
]

const activityIcons: Record<string, any> = {
  "CV Builder": FileText,
  "Invoice Generator": Receipt,
  "Salary Calculator": DollarSign,
}

export default function Home() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activity, setActivity] = useState([
    { tool: "CV Builder", action: "Generated a new CV", time: "2 min ago" },
    { tool: "Invoice Generator", action: "Invoice #INV-042 created", time: "Yesterday" },
    { tool: "Salary Calculator", action: "Estimated NGN 850,000/mo", time: "3 days ago" },
  ])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      if (!user) {
        router.push("/")
      } else {
        setUser(user)
        setLoadingUser(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"
  const firstName = userName.split(" ")[0]

  const stats = [
    {
      label: "Tools available",
      value: "6",
      sub: "+2 coming soon",
      icon: Wrench,
      color: "from-blue-600/20 to-blue-600/5",
      iconColor: "#3b82f6",
    },
    {
      label: "CVs generated",
      value: "128+",
      sub: "across all users",
      icon: FileText,
      color: "from-violet-600/20 to-violet-600/5",
      iconColor: "#8b5cf6",
    },
    {
      label: "Active users",
      value: "2.4K",
      sub: "this month",
      icon: Users,
      color: "from-emerald-600/20 to-emerald-600/5",
      iconColor: "#10b981",
    },
  ]

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar user={user} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar user={user} />
      </div>

      {/* MAIN */}
      <main className="flex-1 overflow-auto">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-white/8">
          <span className="text-lg font-bold">⚡ LaunchPad</span>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
          >
            <Menu size={18} />
          </button>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">

          {/* TOP BAR */}
          <div className="flex items-start justify-between mb-8 md:mb-10">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, {firstName} 👋
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm">
                {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href="/tools"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm transition"
              >
                <Wrench size={14} />
                All tools
              </Link>
              <Link
                href="/settings"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                Upgrade
              </Link>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 md:mb-10">
            {stats.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className={`p-5 rounded-2xl bg-gradient-to-br ${s.color} border border-white/8`}>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${s.iconColor}20` }}
                  >
                    <Icon size={18} style={{ color: s.iconColor }} />
                  </div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-slate-300 text-sm mt-0.5">{s.label}</div>
                  <div className="text-slate-500 text-xs mt-1">{s.sub}</div>
                </div>
              )
            })}
          </div>

          {/* TOOLS */}
          <div className="mb-8 md:mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">Quick tools</h2>
              <Link
                href="/tools"
                className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
              >
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {tools.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link
                    key={tool.title}
                    href={tool.path}
                    className="group p-5 rounded-2xl bg-white/[0.04] border border-white/8 hover:bg-white/[0.07] hover:border-white/15 hover:-translate-y-0.5 transition-all duration-200 block"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: tool.bg }}
                      >
                        <Icon size={18} style={{ color: tool.color }} />
                      </div>
                      {tool.badge && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${tool.color}20`, color: tool.color }}
                        >
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold mb-1">{tool.title}</h3>
                    <p className="text-slate-400 text-xs">{tool.desc}</p>
                    <div className="mt-4 text-xs font-medium flex items-center gap-1" style={{ color: tool.color }}>
                      Open <ChevronRight size={12} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">Recent activity</h2>
              <Link
                href="/recent"
                className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
              >
                View all <ChevronRight size={14} />
              </Link>
            </div>

            {activity.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-white/[0.03] border border-white/8">
                <Clock size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">No activity yet</p>
                <p className="text-slate-600 text-xs mt-1">Start using a tool to see your history here</p>
                <Link
                  href="/tools"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition"
                >
                  <Wrench size={13} /> Explore tools
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {activity.map((item, i) => {
                  const Icon = activityIcons[item.tool] || FileText
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/8 hover:bg-white/[0.07] transition cursor-default"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
                        <Icon size={16} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.action}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.tool}</p>
                      </div>
                      <span className="text-xs text-slate-600 shrink-0">{item.time}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}