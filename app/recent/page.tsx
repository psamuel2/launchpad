"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import Sidebar from "@/components/Sidebar"

const activity = [
  { tool: "CV Builder", action: "Generated a new CV", time: "2 min ago", icon: "📄", color: "#6366f1" },
  { tool: "Invoice Generator", action: "Invoice #INV-042 created", time: "Yesterday", icon: "🧾", color: "#f59e0b" },
  { tool: "Salary Calculator", action: "Estimated NGN 850,000/mo", time: "3 days ago", icon: "💰", color: "#10b981" },
  { tool: "Currency Converter", action: "Converted USD to NGN", time: "5 days ago", icon: "🌍", color: "#06b6d4" },
  { tool: "Loan Calculator", action: "Calculated 24-month repayment", time: "1 week ago", icon: "🏦", color: "#3b82f6" },
]

export default function RecentPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
        <div className="max-w-3xl mx-auto px-6 py-8">

          <div className="mb-8">
            <h1 className="text-3xl font-bold">Recent Activity</h1>
            <p className="text-slate-400 mt-1.5 text-sm">Your latest actions across all tools</p>
          </div>

          <div className="space-y-3">
            {activity.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: `${item.color}20` }}
                >
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

          <div className="mt-8 p-6 rounded-2xl border border-dashed border-white/10 text-center">
            <p className="text-sm text-slate-500">
              Real activity tracking coming soon — your actual usage will appear here.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}