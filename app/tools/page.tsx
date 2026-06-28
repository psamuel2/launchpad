"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import Sidebar from "@/components/Sidebar"

const tools = [
  { title: "CV Builder", desc: "AI-powered CV generation", path: "/careers/cv-builder", icon: "📄", badge: "AI", color: "#6366f1", category: "Career" },
  { title: "Salary Calculator", desc: "Estimate earnings & tax", path: "/finance/salary-calculator", icon: "💰", badge: null, color: "#10b981", category: "Finance" },
  { title: "Invoice Generator", desc: "Create invoices instantly", path: "/finance/invoice", icon: "🧾", badge: null, color: "#f59e0b", category: "Finance" },
  { title: "Loan Calculator", desc: "Plan repayments easily", path: "/finance/loan-calculator", icon: "🏦", badge: null, color: "#3b82f6", category: "Finance" },
  { title: "Currency Converter", desc: "Live exchange rates", path: "/finance/currency-converter", icon: "🌍", badge: "Live", color: "#06b6d4", category: "Finance" },
  { title: "Job Tools", desc: "Career preparation suite", path: "/careers", icon: "🚀", badge: null, color: "#8b5cf6", category: "Career" },
]

const categories = ["All", "Finance", "Career"]

export default function ToolsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("All")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/")
      } else {
        setUser(user)
        setLoading(false)
      }
    })
  }, [])

  const filtered = activeCategory === "All" ? tools : tools.filter(t => t.category === activeCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar user={user} />

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">

          <div className="mb-8">
            <h1 className="text-3xl font-bold">Tools</h1>
            <p className="text-slate-400 mt-1.5 text-sm">All available tools in one place</p>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tools grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {filtered.map((tool) => (
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
                  <div className="flex gap-2">
                    {tool.badge && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${tool.color}25`, color: tool.color }}
                      >
                        {tool.badge}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                      {tool.category}
                    </span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-1">{tool.title}</h3>
                <p className="text-slate-400 text-xs">{tool.desc}</p>
                <div className="mt-4 text-xs font-medium" style={{ color: tool.color }}>
                  Open →
                </div>
              </Link>
            ))}
          </div>

          {/* Coming soon */}
          <div className="mt-8 p-6 rounded-2xl border border-dashed border-white/10 text-center">
            <div className="text-2xl mb-2">🔜</div>
            <p className="text-sm font-medium text-slate-300">2 more tools coming soon</p>
            <p className="text-xs text-slate-500 mt-1">Interview Prep & Budget Planner</p>
          </div>

        </div>
      </main>
    </div>
  )
}