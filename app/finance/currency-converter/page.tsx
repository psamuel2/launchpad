"use client";

import { useEffect, useMemo, useState } from "react";

type Rates = Record<string, number>;
type FetchState = "idle" | "loading" | "success" | "error";

interface ErApiResponse {
  result: "success" | "error";
  base_code: string;
  time_last_update_utc: string;
  time_next_update_utc: string;
  rates: Rates;
  "error-type"?: string;
}

// A curated shortlist for the dropdowns so they stay scannable — the underlying
// API actually returns ~160 currencies, so any ISO code typed elsewhere would work.
const POPULAR_CURRENCIES = [
  "USD", "EUR", "GBP", "NGN", "JPY", "CAD", "AUD", "CHF",
  "CNY", "ZAR", "GHS", "KES", "INR", "AED", "EGP", "BRL",
];

const CURRENCY_LABELS: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  NGN: "Nigerian Naira",
  JPY: "Japanese Yen",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  CHF: "Swiss Franc",
  CNY: "Chinese Yuan",
  ZAR: "South African Rand",
  GHS: "Ghanaian Cedi",
  KES: "Kenyan Shilling",
  INR: "Indian Rupee",
  AED: "UAE Dirham",
  EGP: "Egyptian Pound",
  BRL: "Brazilian Real",
};

// Free, no-API-key endpoint covering ~160 currencies (including NGN), refreshed
// once daily. Same provider as the keyed v6 API, but without the 100/month cap
// that comes with that tier — better fit for a live-traffic web app.
const RATES_ENDPOINT = "https://open.er-api.com/v6/latest";

async function fetchRates(base: string): Promise<ErApiResponse> {
  const res = await fetch(`${RATES_ENDPOINT}/${base}`);
  if (!res.ok) throw new Error("Couldn't reach the exchange rate service.");
  const data: ErApiResponse = await res.json();
  if (data.result !== "success") {
    throw new Error(data["error-type"] ?? "The exchange rate service returned an error.");
  }
  return data;
}

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function CurrencyConverter() {
  const [amount, setAmount] = useState<number>(1);
  const [from, setFrom] = useState<string>("USD");
  const [to, setTo] = useState<string>("NGN");
  const [rate, setRate] = useState<number | null>(null);
  const [status, setStatus] = useState<FetchState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [nextUpdate, setNextUpdate] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setErrorMessage("");
      try {
        const data = await fetchRates(from);
        if (cancelled) return;

        if (from === to) {
          setRate(1);
        } else {
          const r = data.rates[to];
          if (r === undefined) throw new Error(`No rate available for ${to}.`);
          setRate(r);
        }
        setNextUpdate(data.time_next_update_utc);
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Couldn't fetch exchange rates right now."
        );
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const converted = useMemo(() => {
    if (rate === null || !amount) return null;
    return amount * rate;
  }, [amount, rate]);

  function handleSwap() {
    setFrom(to);
    setTo(from);
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    setAmount(Number.isFinite(value) && value >= 0 ? value : 0);
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white px-4 py-16">
      <div className="max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-4" aria-hidden="true">🌍</div>
          <h1 className="text-4xl font-bold">Currency Converter</h1>
          <p className="text-slate-400 mt-3 text-sm">
            Live exchange rates, converted instantly
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {/* Amount */}
          <div className="mb-6">
            <label htmlFor="amount-input" className="block text-sm text-slate-300 mb-2">
              Amount
            </label>
            <input
              id="amount-input"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={amount || ""}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition text-lg"
            />
          </div>

          {/* From / Swap / To */}
          <div className="flex items-end gap-3 mb-6">
            <div className="flex-1">
              <label htmlFor="from-select" className="block text-sm text-slate-300 mb-2">
                From
              </label>
              <select
                id="from-select"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition text-sm appearance-none cursor-pointer"
              >
                {POPULAR_CURRENCIES.map((code) => (
                  <option key={code} value={code} className="bg-[#050816]">
                    {code} — {CURRENCY_LABELS[code]}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap currencies"
              title="Swap currencies"
              className="shrink-0 mb-0.5 w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center text-lg"
            >
              ⇄
            </button>

            <div className="flex-1">
              <label htmlFor="to-select" className="block text-sm text-slate-300 mb-2">
                To
              </label>
              <select
                id="to-select"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition text-sm appearance-none cursor-pointer"
              >
                {POPULAR_CURRENCIES.map((code) => (
                  <option key={code} value={code} className="bg-[#050816]">
                    {code} — {CURRENCY_LABELS[code]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RESULT */}
          <div className="rounded-xl bg-gradient-to-br from-cyan-600/15 to-transparent border border-white/8 p-6 text-center min-h-[120px] flex flex-col items-center justify-center">
            {status === "loading" && (
              <p className="text-slate-400 text-sm" role="status">
                Fetching latest rates…
              </p>
            )}

            {status === "error" && (
              <div role="alert">
                <p className="text-red-400 text-sm font-medium mb-1">Couldn't load rates</p>
                <p className="text-slate-500 text-xs">{errorMessage}</p>
              </div>
            )}

            {status === "success" && converted !== null && (
              <>
                <p className="text-slate-400 text-sm mb-1">
                  {formatNumber(amount)} {from} equals
                </p>
                <p className="text-3xl font-bold text-cyan-400">
                  {formatNumber(converted)} {to}
                </p>
                <p className="text-slate-500 text-xs mt-3">
                  1 {from} = {formatNumber(rate ?? 0)} {to}
                </p>
              </>
            )}
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
            <span>Rates update daily, all currencies live.</span>
            {nextUpdate && status === "success" && (
              <span title={nextUpdate}>
                Next update {new Date(nextUpdate).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>

        {/* QUICK SWAPS */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {[
            ["USD", "NGN"],
            ["GBP", "NGN"],
            ["EUR", "USD"],
            ["USD", "GHS"],
            ["USD", "KES"],
          ].map(([f, t]) => (
            <button
              key={`${f}-${t}`}
              type="button"
              onClick={() => {
                setFrom(f);
                setTo(t);
              }}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs transition"
            >
              {f} → {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}