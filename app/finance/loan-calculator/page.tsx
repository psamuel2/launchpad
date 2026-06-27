"use client";

import { useId, useMemo, useState } from "react";

type Currency = "₦" | "$" | "£" | "€";

type ScheduleRow = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

type Rating = "Comfortable" | "Manageable" | "Stretch" | "High Risk";

type CalculationResult =
  | { ok: false; error: string }
  | {
      ok: true;
      totalInterest: number;
      interestPercent: number;
      effectiveRate: number; // total interest as % of principal, over the whole term
      monthlyRepayment: number;
      rating: Rating;
      schedule: ScheduleRow[];
    };

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "₦", label: "NGN (₦)" },
  { value: "$", label: "USD ($)" },
  { value: "£", label: "GBP (£)" },
  { value: "€", label: "EUR (€)" },
];

const PRESETS = [
  { label: "₦100k", amount: 100_000 },
  { label: "₦500k", amount: 500_000 },
  { label: "₦1M", amount: 1_000_000 },
  { label: "₦5M", amount: 5_000_000 },
];

const RATING_STYLES: Record<Rating, { text: string; advice: string }> = {
  Comfortable: {
    text: "text-green-400",
    advice: "The extra cost is small relative to what you're borrowing. This looks like a fair deal.",
  },
  Manageable: {
    text: "text-yellow-400",
    advice: "A reasonable cost of borrowing. Make sure the monthly amount still fits your budget.",
  },
  Stretch: {
    text: "text-orange-400",
    advice: "You're paying back a lot more than you borrowed. Worth comparing against other offers.",
  },
  "High Risk": {
    text: "text-red-400",
    advice: "The payback amount is very high relative to the loan. This is an expensive way to borrow.",
  },
};

/**
 * Builds a simple, even amortization schedule: every month repays the same
 * fraction of principal and the same fraction of interest. This is not a
 * compound-interest schedule (there's no implied periodic rate here, since
 * the inputs are just principal, total payback, and duration) — it's a
 * straight-line spread of the known total interest and known total principal
 * across the term, useful for seeing "what does my balance look like over time."
 */
function buildSchedule(principal: number, totalInterest: number, n: number): ScheduleRow[] {
  const schedule: ScheduleRow[] = [];
  const monthlyPrincipal = principal / n;
  const monthlyInterest = totalInterest / n;
  const monthlyPayment = monthlyPrincipal + monthlyInterest;

  let balance = principal;
  for (let month = 1; month <= n; month++) {
    balance = Math.max(0, balance - monthlyPrincipal);
    schedule.push({
      month,
      payment: monthlyPayment,
      principal: monthlyPrincipal,
      interest: monthlyInterest,
      balance,
    });
  }
  return schedule;
}

function rateRating(effectiveRate: number): Rating {
  // effectiveRate = total interest as a % of principal, for the whole loan term
  if (effectiveRate <= 10) return "Comfortable";
  if (effectiveRate <= 25) return "Manageable";
  if (effectiveRate <= 50) return "Stretch";
  return "High Risk";
}

function calculateLoan(
  principal: number,
  totalPayback: number,
  duration: number
): CalculationResult | null {
  if (!principal || !totalPayback || !duration) return null;

  if (principal < 0 || totalPayback < 0) {
    return { ok: false, error: "Amounts can't be negative." };
  }

  if (totalPayback < principal) {
    return { ok: false, error: "Total payback can't be less than the amount you're borrowing." };
  }

  const totalInterest = totalPayback - principal;
  const interestPercent = Math.round((totalInterest / totalPayback) * 100);
  const effectiveRate = (totalInterest / principal) * 100;
  const monthlyRepayment = totalPayback / duration;
  const schedule = buildSchedule(principal, totalInterest, duration);

  return {
    ok: true,
    totalInterest,
    interestPercent,
    effectiveRate,
    monthlyRepayment,
    rating: rateRating(effectiveRate),
    schedule,
  };
}

function formatCurrency(value: number, currency: Currency): string {
  return `${currency}${Math.round(value).toLocaleString()}`;
}

export default function LoanCalculator() {
  const [currency, setCurrency] = useState<Currency>("₦");
  const [principal, setPrincipal] = useState<number>(0);
  const [totalPayback, setTotalPayback] = useState<number>(0);
  const [duration, setDuration] = useState<number>(12);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  const durationLabelId = useId();

  const result = useMemo(
    () => calculateLoan(principal, totalPayback, duration),
    [principal, totalPayback, duration]
  );

  const fmt = (value: number) => formatCurrency(value, currency);

  const handleNonNegativeNumberChange =
    (setter: (value: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setter(Number.isFinite(value) && value >= 0 ? value : 0);
    };

  return (
    <>
      {/* HEADER */}
      <div className="text-center mb-16">
        <h1 className="text-7xl font-black">Loan Calculator</h1>
        <p className="text-slate-400 mt-6 text-xl">
          Enter what you're borrowing and what you'll pay back — we work out the interest
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* LEFT — INPUTS */}
        <div className="bg-[#071947] rounded-[40px] p-10">
          <h2 className="text-5xl font-bold mb-10">Loan Details</h2>

          <div className="space-y-6">
            {/* Currency */}
            <div>
              <label htmlFor="currency-select" className="sr-only">
                Currency
              </label>
              <select
                id="currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="input"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Principal */}
            <div>
              <label htmlFor="principal-input" className="text-[#8fa0d1] text-base mb-2 block">
                How much do you want to borrow?
              </label>
              <input
                id="principal-input"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                placeholder="e.g. 500,000"
                value={principal || ""}
                onChange={handleNonNegativeNumberChange(setPrincipal)}
                className="input"
              />
            </div>

            {/* Total payback */}
            <div>
              <label htmlFor="payback-input" className="text-[#8fa0d1] text-base mb-2 block">
                Total amount you'll pay back
              </label>
              <input
                id="payback-input"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                placeholder="e.g. 650,000"
                value={totalPayback || ""}
                onChange={handleNonNegativeNumberChange(setTotalPayback)}
                className="input"
              />
            </div>

            {/* Duration slider */}
            <div>
              <label id={durationLabelId} htmlFor="duration-slider" className="text-[#8fa0d1] text-base mb-3 block">
                Duration: <span className="text-white font-bold">{duration} months</span>
              </label>
              <input
                id="duration-slider"
                aria-labelledby={durationLabelId}
                type="range"
                min={1}
                max={60}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
                style={{ height: "6px" }}
              />
              <div className="flex justify-between text-xs text-[#8fa0d1] mt-2">
                <span>1 mo</span>
                <span>12 mo</span>
                <span>24 mo</span>
                <span>36 mo</span>
                <span>48 mo</span>
                <span>60 mo</span>
              </div>
            </div>

            {/* Quick presets */}
            <div>
              <span className="text-[#8fa0d1] text-base mb-3 block">Quick presets for amount borrowed</span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPrincipal(p.amount)}
                    className="px-5 py-3 rounded-[14px] text-base transition-all hover:opacity-80"
                    style={{ background: "#182865", border: "1px solid #2c3d87", color: "white" }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — RESULTS */}
        <div className="bg-[#071947] rounded-[40px] p-10">
          {/* Empty state */}
          {!result && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-5 py-20">
              <div className="text-8xl" aria-hidden="true">🏦</div>
              <p className="text-3xl font-bold">Enter loan details</p>
              <p className="text-[#8fa0d1] text-lg">
                Fill in how much you're borrowing, how much you'll pay back, and the duration to see the breakdown.
              </p>
            </div>
          )}

          {/* Error state */}
          {result && !result.ok && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-5 py-20" role="alert">
              <div className="text-7xl" aria-hidden="true">⚠️</div>
              <p className="text-2xl font-bold text-orange-400">Invalid Combination</p>
              <p className="text-[#8fa0d1] text-lg">{result.error}</p>
            </div>
          )}

          {/* Results */}
          {result && result.ok && (
            <>
              {/* HERO — Interest */}
              <div className="text-center mb-10">
                <div className="text-7xl mb-6" aria-hidden="true">🏦</div>
                <p className="text-[#8fa0d1] text-xl mb-2">Total Interest</p>
                <h2 className="text-6xl font-black text-blue-400">{fmt(result.totalInterest)}</h2>
                <p className="text-[#8fa0d1] mt-2">
                  That's {result.effectiveRate.toFixed(1)}% of what you borrowed, over {duration} months
                </p>
              </div>

              {/* SPLIT BAR */}
              <div className="mb-8">
                <div className="flex justify-between text-base mb-2" style={{ color: "#8fa0d1" }}>
                  <span>Principal</span>
                  <span>Interest</span>
                </div>
                <div
                  className="w-full rounded-full overflow-hidden flex"
                  style={{ height: "18px", background: "#182865" }}
                  role="img"
                  aria-label={`${100 - result.interestPercent}% principal, ${result.interestPercent}% interest`}
                >
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${100 - result.interestPercent}%` }}
                  />
                  <div
                    className="h-full bg-red-400 transition-all duration-500"
                    style={{ width: `${result.interestPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-blue-400">
                    {fmt(principal)} ({100 - result.interestPercent}%)
                  </span>
                  <span className="text-red-400">
                    {fmt(result.totalInterest)} ({result.interestPercent}%)
                  </span>
                </div>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-2 gap-5">
                <div className="card">
                  <p style={{ color: "#8fa0d1" }}>Amount Borrowed</p>
                  <h3>{fmt(principal)}</h3>
                </div>
                <div className="card">
                  <p style={{ color: "#8fa0d1" }}>Total Payback</p>
                  <h3>{fmt(totalPayback)}</h3>
                </div>
                <div className="card">
                  <p style={{ color: "#8fa0d1" }}>Total Interest</p>
                  <h3 className="text-red-400">{fmt(result.totalInterest)}</h3>
                </div>
                <div className="card">
                  <p style={{ color: "#8fa0d1" }}>Monthly Repayment</p>
                  <h3>{fmt(result.monthlyRepayment)}</h3>
                </div>
              </div>

              {/* RATING */}
              <div className="card mt-5">
                <p style={{ color: "#8fa0d1" }}>Loan Rating</p>
                <h3 className={RATING_STYLES[result.rating].text}>{result.rating}</h3>
              </div>

              {/* ADVICE */}
              <div className="card mt-5">
                <p style={{ color: "#8fa0d1" }}>Advice</p>
                <h3 className={`text-xl font-semibold mt-3 ${RATING_STYLES[result.rating].text}`}>
                  {RATING_STYLES[result.rating].advice}
                </h3>
              </div>

              {/* SCHEDULE TOGGLE */}
              <button
                type="button"
                onClick={() => setShowSchedule((prev) => !prev)}
                aria-expanded={showSchedule}
                aria-controls="repayment-schedule"
                className="w-full mt-6 py-4 rounded-[18px] text-base font-medium transition-all flex items-center justify-center gap-2"
                style={{ background: "#182865", border: "1px solid #2c3d87", color: "white" }}
              >
                {showSchedule ? "Hide" : "Show"} repayment schedule
                <span
                  className="inline-block transition-transform duration-300"
                  style={{ transform: showSchedule ? "rotate(180deg)" : "rotate(0deg)" }}
                  aria-hidden="true"
                >
                  ▼
                </span>
              </button>

              {/* SCHEDULE TABLE */}
              {showSchedule && (
                <div
                  id="repayment-schedule"
                  className="mt-6 overflow-x-auto rounded-[22px] overflow-hidden"
                  style={{ border: "1px solid #2c3d87" }}
                >
                  <table className="w-full text-base">
                    <caption className="sr-only">Monthly repayment schedule</caption>
                    <thead>
                      <tr style={{ background: "#182865", color: "#8fa0d1" }}>
                        <th scope="col" className="text-left px-5 py-4">Month</th>
                        <th scope="col" className="text-right px-5 py-4">Payment</th>
                        <th scope="col" className="text-right px-5 py-4">Principal</th>
                        <th scope="col" className="text-right px-5 py-4">Interest</th>
                        <th scope="col" className="text-right px-5 py-4">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.schedule.map((row, i) => (
                        <tr
                          key={row.month}
                          style={{
                            borderTop: "1px solid #2c3d87",
                            background: i % 2 === 0 ? "#071947" : "#0d1f52",
                          }}
                        >
                          <th scope="row" className="px-5 py-3 text-left font-normal" style={{ color: "#8fa0d1" }}>
                            {row.month}
                          </th>
                          <td className="px-5 py-3 text-right text-white">{fmt(row.payment)}</td>
                          <td className="px-5 py-3 text-right text-blue-400">{fmt(row.principal)}</td>
                          <td className="px-5 py-3 text-right text-red-400">{fmt(row.interest)}</td>
                          <td className="px-5 py-3 text-right" style={{ color: "#8fa0d1" }}>{fmt(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}