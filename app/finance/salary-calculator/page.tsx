"use client";

import { useMemo, useState } from "react";

export default function SalaryCalculator() {
const [currency, setCurrency] = useState("₦");

// FINANCE INPUTS
const [salary, setSalary] = useState(0);
const [family, setFamily] = useState(0);
const [debt, setDebt] = useState(0);
const [feeding, setFeeding] = useState(0);
const [transport, setTransport] = useState(0);
const [misc, setMisc] = useState(0);

// PROJECT
const [goalName, setGoalName] = useState("Laptop");
const [goalCost, setGoalCost] = useState(0);
const [targetMonths, setTargetMonths] = useState("");

// FEATURES
const [salaryDay, setSalaryDay] = useState(25);
const [buffer, setBuffer] = useState(50000);
const [viewMode, setViewMode] = useState("monthly");

// 🆕 CHECKBOX STATE
const [savedThisMonth, setSavedThisMonth] = useState(false);

// TOTAL EXPENSES
const totalExpenses = useMemo(
() => family + debt + feeding + transport + misc,
[family, debt, feeding, transport, misc]
);

const savings = salary - totalExpenses;

const savingsPercent =
salary > 0 ? Math.max(0, Math.round((savings / salary) * 100)) : 0;

const status =
savings <= 0
? "Not Sustainable"
: savings < salary * 0.2
? "Risky"
: savings < salary * 0.4
? "Manageable"
: "Excellent";

// PROJECT ENGINE
const monthlyGoalTarget =
goalCost > 0 && Number(targetMonths) > 0
? goalCost / Number(targetMonths)
: 0;

const netAfterExpenses = salary - totalExpenses;

const projectContribution = monthlyGoalTarget;

const remainingAfterAll =
netAfterExpenses - projectContribution;

// 🧠 NEW SAVINGS LOGIC (50/50 RULE)
const recommendedMonthlySavings =
remainingAfterAll > 0 ? remainingAfterAll * 0.5 : 0;

const freeMoney =
remainingAfterAll > 0 ? remainingAfterAll * 0.5 : 0;

const affordabilityRatio =
salary > 0 ? (monthlyGoalTarget / salary) * 100 : 0;

const goalStatus =
affordabilityRatio === 0
? "No Goal Set"
: affordabilityRatio < 15
? "Comfortable"
: affordabilityRatio < 30
? "Stretch"
: "Aggressive";

// 🎯 PROGRESS %
const progressPercent =
goalCost > 0 && savings > 0
? Math.min(100, (Math.abs(savings) / goalCost) * 100)
: 0;

// 📅 ESTIMATED COMPLETION DATE
const estimatedMonths =
monthlyGoalTarget > 0 ? goalCost / monthlyGoalTarget : null;

const estimatedDate =
estimatedMonths && !isNaN(estimatedMonths)
? new Date(
new Date().setMonth(new Date().getMonth() + estimatedMonths)
).toLocaleDateString()
: "N/A";

return (
<>
  {/* HEADER */}
  <div className="text-center mb-16">
    <h1 className="text-7xl font-black">Salary Calculator</h1>
    <p className="text-slate-400 mt-6 text-xl">
      Real financial clarity after expenses
    </p>
  </div>

  <div className="grid lg:grid-cols-2 gap-10">

    {/* LEFT SIDE INPUTS */}
    <div className="bg-[#071947] rounded-[40px] p-10">
      <h2 className="text-5xl font-bold mb-10">Monthly Breakdown</h2>

      <div className="space-y-5">

        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="input"
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
          className="input"
        />

        <input
          type="number"
          placeholder="Family support"
          value={family || ""}
          onChange={(e) => setFamily(Number(e.target.value))}
          className="input"
        />

        <input
          type="number"
          placeholder="Debt repayment"
          value={debt || ""}
          onChange={(e) => setDebt(Number(e.target.value))}
          className="input"
        />

        <input
          type="number"
          placeholder="Feeding"
          value={feeding || ""}
          onChange={(e) => setFeeding(Number(e.target.value))}
          className="input"
        />

        <input
          type="number"
          placeholder="Transport"
          value={transport || ""}
          onChange={(e) => setTransport(Number(e.target.value))}
          className="input"
        />

        <input
          type="number"
          placeholder="Miscellaneous"
          value={misc || ""}
          onChange={(e) => setMisc(Number(e.target.value))}
          className="input"
        />

        {/* PROJECT */}
        <div className="mt-10 border-t border-slate-600 pt-8">
          <h3 className="text-3xl font-bold mb-6">Project Planner</h3>

          <select
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            className="input"
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
            className="input mt-6"
          />

          <select
            value={targetMonths}
            onChange={(e) => setTargetMonths(e.target.value)}
            className="input mt-6"
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

    {/* RIGHT SIDE OUTPUT */}
    <div className="bg-[#071947] rounded-[40px] p-10">

      {/* SAVINGS */}
      <div className="text-center">
        <div className="text-8xl">💰</div>

        <h2 className="text-6xl font-black text-green-400 mt-8">
          {currency}
          {savings.toLocaleString()}
        </h2>

        <p className="text-2xl mt-3">Monthly Savings</p>
      </div>

      {/* ✅ PROGRESS BAR (FIXED) */}
      <div className="mt-8">
        <div className="flex justify-between text-sm mb-2">
          <span>Goal Progress</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>

        <div className="w-full h-4 bg-slate-700 rounded-full">
          <div
            className="h-4 bg-green-400 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-5 mt-10">

        <div className="card">
          <p>Salary</p>
          <h3>{currency}{salary.toLocaleString()}</h3>
        </div>

        <div className="card">
          <p>Expenses</p>
          <h3>{currency}{totalExpenses.toLocaleString()}</h3>
        </div>

        <div className="card">
          <p>Status</p>
          <h3>{status}</h3>
        </div>

        <div className="card">
          <p>Recommended Monthly Savings</p>
          <h3>{currency}{recommendedMonthlySavings.toLocaleString()}</h3>
        </div>

      </div>

      {/* FREE MONEY */}
      <div className="card mt-5">
        <p>Free Money After Savings</p>
        <h3>{currency}{freeMoney.toLocaleString()}</h3>
      </div>

      {/* 🧠 REMARK (NEW) */}
      <div className="card mt-5">
        <p>Financial Remark</p>
        <h3>
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
      <div className="card mt-5">
        <p>Monthly Savings Confirmation</p>

        <label className="flex items-center gap-3 mt-3">
          <input
            type="checkbox"
            checked={savedThisMonth}
            onChange={(e) => setSavedThisMonth(e.target.checked)}
          />
          <span>I have saved my recommended amount</span>
        </label>

        <p className="text-slate-400 mt-2">
          {savedThisMonth
            ? "✔ Great discipline. Keep it up."
            : "Tick when you complete your savings target."}
        </p>
      </div>

      {/* PROJECT RESULT */}
      <div className="card mt-8">
        <p>Active Project</p>
        <h3>{goalName}</h3>

        <p>
          Monthly Target: {currency}
          {monthlyGoalTarget.toLocaleString()}
        </p>

        <p>Status: {goalStatus}</p>

        <p>Completion Date: {estimatedDate}</p>
      </div>

    </div>
  </div>
</>
);
}