"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import Sidebar from "@/components/Sidebar"

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <h3 className="text-lg font-semibold text-white mt-1">{value}</h3>
    </div>
  )
}

export default function SalaryCalculator() {
  const [supabase] = useState(() => createClient())
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [currency, setCurrency] = useState("₦")

  // FINANCE INPUTS
  const [salary, setSalary] = useState(0)
  const [family, setFamily] = useState(0)
  const [debt, setDebt] = useState(0)
  const [feeding, setFeeding] = useState(0)
  const [transport, setTransport] = useState(0)
  const [misc, setMisc] = useState(0)

  // PROJECT
  const [goalName, setGoalName] = useState("Laptop")
  const [goalCost, setGoalCost] = useState(0)
  const [targetMonths, setTargetMonths] = useState("")

  // CHECKBOX STATE
  const [savedThisMonth, setSavedThisMonth] = useState(false)

  useEffect(() => {
    let isMounted = true
    supabase.auth
      .getUser()
      .then(({ data: { user } }: { data: { user: any } }) => {
        if (!isMounted) return
        if (!user) {
          router.push("/login")
        } else {
          setUser(user)
          setLoadingUser(false)
        }
      })
      .catch(() => {
        if (isMounted) router.push("/login")
      })
    return () => {
      isMounted = false
    }
  }, [])

  // TOTAL EXPENSES
  const totalExpenses = useMemo(
    () => family + debt + feeding + transport + misc,
    [family, debt, feeding, transport, misc]
  )

  const savings = salary - totalExpenses

  const status =
    savings <= 0
      ? "Not Sustainable"
      : savings < salary * 0.2
      ? "Risky"
      : savings < salary * 0.4
      ? "Manageable"
      : "Excellent"

  const statusColor =
    status === "Excellent"
      ? "text-emerald-400"
      : status === "Manageable"
      ? "text-blue-400"
      : status === "Risky"
      ? "text-amber-400"
      : "text-red-400"

  // PROJECT ENGINE
  const monthlyGoalTarget =
    goalCost > 0 && Number(targetMonths) > 0 ? goalCost / Number(targetMonths) : 0

  const netAfterExpenses = salary - totalExpenses
  const projectContribution = monthlyGoalTarget
  const remainingAfterAll = netAfterExpenses - projectContribution

  const recommendedMonthlySavings = remainingAfterAll > 0 ? remainingAfterAll * 0.5 : 0
  const freeMoney = remainingAfterAll > 0 ? remainingAfterAll * 0.5 : 0

  const affordabilityRatio = salary > 0 ? (monthlyGoalTarget / salary) * 100 : 0

  const goalStatus =
    affordabilityRatio === 0
      ? "No Goal Set"
      : affordabilityRatio < 15
      ? "Comfortable"
      : affordabilityRatio < 30
      ? "Stretch"
      : "Aggressive"

  const progressPercent =
    goalCost > 0 && savings > 0 ? Math.min(100, (Math.abs(savings) / goalCost) * 100) : 0

  const estimatedMonths = monthlyGoalTarget > 0 ? goalCost / monthlyGoalTarget : null

  const estimatedDate =
    estimatedMonths && !isNaN(estimatedMonths)
      ? new Date(new Date().setMonth(new Date().getMonth() + estimatedMonths)).toLocaleDateString()
      : "N/A"

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <div className="hidden md:block">
        <Sidebar user={user} />
      </div>

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">

          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-white transition flex items-center gap-1 mb-6 w-fit"
          >
            ← Back to dashboard
          </Link>

          <div className="mb-10">
            <h1 className="text-3xl font-bold">Salary Calculator</h1>
            <p className="text-slate-400 mt-1.5 text-sm">Real financial clarity after expenses</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {/* LEFT SIDE INPUTS */}
            <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-5">Monthly breakdown</h2>

              <div className="space-y-3">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={inputClass}
                >
                  <option value="₦">NGN (₦)</option>
                  <option value="$">USD ($)</option>
                  <option value="£">GBP (£)</option>
                  <option value="€">EUR (€)</option>
                </select>

                <input
                  type="number"
                  placeholder="Monthly salary"
                  value={salary || ""}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className={inputClass}
                />

                <input
                  type="number"
                  placeholder="Family support"
                  value={family || ""}
                  onChange={(e) => setFamily(Number(e.target.value))}
                  className={inputClass}
                />

                <input
                  type="number"
                  placeholder="Debt repayment"
                  value={debt || ""}
                  onChange={(e) => setDebt(Number(e.target.value))}
                  className={inputClass}
                />

                <input
                  type="number"
                  placeholder="Feeding"
                  value={feeding || ""}
                  onChange={(e) => setFeeding(Number(e.target.value))}
                  className={inputClass}
                />

                <input
                  type="number"
                  placeholder="Transport"
                  value={transport || ""}
                  onChange={(e) => setTransport(Number(e.target.value))}
                  className={inputClass}
                />

                <input
                  type="number"
                  placeholder="Miscellaneous"
                  value={misc || ""}
                  onChange={(e) => setMisc(Number(e.target.value))}
                  className={inputClass}
                />

                {/* PROJECT */}
                <div className="mt-7 border-t border-white/8 pt-6">
                  <h3 className="text-sm font-semibold mb-4">Project planner</h3>

                  <div className="space-y-3">
                    <select
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      className={inputClass}
                    >
                      <option value="Laptop">💻 Laptop</option>
                      <option value="Car">🚗 Car</option>
                      <option value="Land">🏡 Land</option>
                      <option value="Rent">🏠 Rent</option>
                      <option value="Business">📊 Business</option>
                      <option value="Savings">💰 Savings</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Goal cost"
                      value={goalCost || ""}
                      onChange={(e) => setGoalCost(Number(e.target.value))}
                      className={inputClass}
                    />

                    <select
                      value={targetMonths}
                      onChange={(e) => setTargetMonths(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Duration (months)</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {m} month{m > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE OUTPUT */}
            <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-6">

              {/* SAVINGS */}
              <div className="text-center py-2">
                <div className="text-4xl mb-3">💰</div>
                <h2 className="text-4xl font-bold text-emerald-400">
                  {currency}
                  {savings.toLocaleString()}
                </h2>
                <p className="text-sm text-slate-400 mt-1.5">Monthly savings</p>
              </div>

              {/* PROGRESS BAR */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Goal progress</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <StatCard label="Salary" value={`${currency}${salary.toLocaleString()}`} />
                <StatCard label="Expenses" value={`${currency}${totalExpenses.toLocaleString()}`} />
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-slate-400">Status</p>
                  <h3 className={`text-lg font-semibold mt-1 ${statusColor}`}>{status}</h3>
                </div>
                <StatCard
                  label="Recommended monthly savings"
                  value={`${currency}${recommendedMonthlySavings.toLocaleString()}`}
                />
              </div>

              {/* FREE MONEY */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-3">
                <p className="text-xs text-slate-400">Free money after savings</p>
                <h3 className="text-lg font-semibold text-white mt-1">
                  {currency}
                  {freeMoney.toLocaleString()}
                </h3>
              </div>

              {/* REMARK */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-3">
                <p className="text-xs text-slate-400">Financial remark</p>
                <h3 className="text-sm text-slate-200 mt-1.5 leading-relaxed">
                  {status === "Excellent"
                    ? "You are in a strong financial position. Keep scaling wisely."
                    : status === "Manageable"
                    ? "You are doing okay, but discipline will improve results."
                    : status === "Risky"
                    ? "Expenses are too high. Adjust spending quickly."
                    : "Critical situation. Reduce expenses immediately."}
                </h3>
              </div>

              {/* CHECKBOX CONFIRMATION */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-3">
                <p className="text-xs text-slate-400">Monthly savings confirmation</p>

                <label className="flex items-center gap-2.5 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={savedThisMonth}
                    onChange={(e) => setSavedThisMonth(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-200">I have saved my recommended amount</span>
                </label>

                <p className="text-xs text-slate-500 mt-2">
                  {savedThisMonth ? "✅ Great discipline. Keep it up." : "Tick when you complete your savings target."}
                </p>
              </div>

              {/* PROJECT RESULT */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-3">
                <p className="text-xs text-slate-400">Active project</p>
                <h3 className="text-base font-semibold text-white mt-1">{goalName}</h3>

                <p className="text-sm text-slate-300 mt-2">
                  Monthly target: {currency}
                  {monthlyGoalTarget.toLocaleString()}
                </p>
                <p className="text-sm text-slate-300 mt-1">Status: {goalStatus}</p>
                <p className="text-sm text-slate-300 mt-1">Completion date: {estimatedDate}</p>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}