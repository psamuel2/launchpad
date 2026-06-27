"use client";

import { useId, useMemo, useRef, useState } from "react";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

type ExportStatus = "idle" | "working" | "error";
type Tab = "edit" | "preview";

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function newLineItem(): LineItem {
  return { id: makeId(), description: "", quantity: 1, rate: 0 };
}

function formatCurrency(value: number, symbol: string): string {
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

const CURRENCIES = [
  { value: "₦", label: "NGN (₦)" },
  { value: "$", label: "USD ($)" },
  { value: "£", label: "GBP (£)" },
  { value: "€", label: "EUR (€)" },
];

declare global {
  interface Window {
    // html2canvas-pro is a drop-in fork of html2canvas that additionally
    // supports modern CSS color functions (oklch, oklab, lab, lch, color()).
    // Tailwind CSS v4 outputs colors using these functions by default, which
    // the original html2canvas throws on ("unsupported color function") —
    // see https://github.com/niklasvh/html2canvas/issues/3269. The -pro fork
    // exposes the same global name and API, so nothing else here changes.
    html2canvas?: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
    jspdf?: { jsPDF: new (opts?: Record<string, unknown>) => any };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

/** Lazily loads html2canvas-pro + jsPDF from CDN, once, and caches the promise. */
function loadExportLibraries(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    if (window.html2canvas && window.jspdf) {
      resolve();
      return;
    }

    const loadScript = (src: string) =>
      new Promise<void>((res, rej) => {
        const tag = document.createElement("script");
        tag.src = src;
        tag.onload = () => res();
        tag.onerror = () => rej(new Error(`Failed to load ${src}`));
        document.head.appendChild(tag);
      });

    Promise.all([
      loadScript("https://cdn.jsdelivr.net/npm/html2canvas-pro@1/dist/html2canvas-pro.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
    ])
      .then(() => resolve())
      .catch(reject);
  });

  return scriptLoadPromise;
}

async function renderInvoiceToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  await loadExportLibraries();
  if (!window.html2canvas) throw new Error("Export library failed to load.");
  return window.html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
}

export default function InvoiceGenerator() {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const taxLabelId = useId();
  const [tab, setTab] = useState<Tab>("edit");

  // Business details
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");

  // Client details
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Invoice meta
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDaysISO(14));
  const [currency, setCurrency] = useState("₦");

  // Line items
  const [items, setItems] = useState<LineItem[]>([newLineItem()]);

  // Tax
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(7.5);

  // Notes + signature
  const [notes, setNotes] = useState("Thank you for your business.");
  const [signatoryName, setSignatoryName] = useState("");

  // Export state
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [exportError, setExportError] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const tax = taxEnabled ? subtotal * (taxRate / 100) : 0;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [items, taxEnabled, taxRate]);

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, newLineItem()]);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  function handleQuantityChange(id: string, raw: string) {
    const value = Number(raw);
    updateItem(id, { quantity: Number.isFinite(value) && value >= 0 ? value : 0 });
  }

  function handleRateChange(id: string, raw: string) {
    const value = Number(raw);
    updateItem(id, { rate: Number.isFinite(value) && value >= 0 ? value : 0 });
  }

  async function handleDownloadImage() {
    if (!invoiceRef.current) return;
    setExportStatus("working");
    setExportError("");
    try {
      const canvas = await renderInvoiceToCanvas(invoiceRef.current);
      const link = document.createElement("a");
      link.download = `${invoiceNumber || "invoice"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setExportStatus("idle");
    } catch (err) {
      setExportStatus("error");
      setExportError(err instanceof Error ? err.message : "Couldn't generate the image.");
    }
  }

  async function handleDownloadPdf() {
    if (!invoiceRef.current) return;
    setExportStatus("working");
    setExportError("");
    try {
      const canvas = await renderInvoiceToCanvas(invoiceRef.current);
      if (!window.jspdf) throw new Error("Export library failed to load.");
      const { jsPDF } = window.jspdf;

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${invoiceNumber || "invoice"}.pdf`);
      setExportStatus("idle");
    } catch (err) {
      setExportStatus("error");
      setExportError(err instanceof Error ? err.message : "Couldn't generate the PDF.");
    }
  }

  async function handleShare() {
    if (!invoiceRef.current) return;
    setExportStatus("working");
    setExportError("");
    setShareFeedback("");
    try {
      const canvas = await renderInvoiceToCanvas(invoiceRef.current);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Couldn't prepare the invoice image.");

      const file = new File([blob], `${invoiceNumber || "invoice"}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice ${invoiceNumber}`,
          text: `Invoice ${invoiceNumber} for ${clientName || "client"}`,
        });
        setShareFeedback("Shared.");
      } else if (navigator.clipboard && "write" in navigator.clipboard) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setShareFeedback("Sharing isn't supported here — copied the invoice image to your clipboard instead.");
      } else {
        throw new Error("Sharing isn't supported in this browser. Try downloading instead.");
      }
      setExportStatus("idle");
    } catch (err) {
      const isUserCancel = err instanceof Error && err.name === "AbortError";
      if (isUserCancel) {
        setExportStatus("idle");
        return;
      }
      setExportStatus("error");
      setExportError(err instanceof Error ? err.message : "Couldn't share the invoice.");
    }
  }

  function handlePrint() {
    window.print();
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition";
  const labelClass = "block text-sm text-slate-300 mb-2";

  return (
    <div className="min-h-screen bg-[#050816] text-white px-4 py-12">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-printable, #invoice-printable * { visibility: visible; }
          #invoice-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-8 no-print">
          <div className="text-5xl mb-4" aria-hidden="true">🧾</div>
          <h1 className="text-4xl font-bold">Invoice Generator</h1>
          <p className="text-slate-400 mt-3 text-sm">Fill in the details, preview it, then download, share, or print</p>
        </div>

        {/* TABS */}
        <div className="no-print flex mb-8 bg-white/5 rounded-xl p-1 max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === "edit" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            ✏️ Edit
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === "preview" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            👁️ Preview
          </button>
        </div>

        {/* EDIT TAB */}
        {tab === "edit" && (
          <div className="no-print bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8">
            {/* Your business */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Your business</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Business name</label>
                  <input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Amoo Sunday Trading Co."
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Business address</label>
                  <input
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="Street, city, state"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone number</label>
                  <input
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    placeholder="e.g. 0803 123 4567"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email (optional)</label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Client */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Bill to (your client)</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Client name</label>
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Who is this invoice for?"
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Client address (optional)</label>
                  <input
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Street, city, state"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Client phone (optional)</label>
                  <input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="e.g. 0803 123 4567"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Client email (optional)</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Invoice details */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Invoice details</h2>
              <div className="grid md:grid-cols-4 gap-5">
                <div>
                  <label className={labelClass}>Invoice number</label>
                  <input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={`${inputClass} cursor-pointer`}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value} className="bg-[#050816]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Date issued</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Payment due</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">What are you charging for?</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
                >
                  + Add item
                </button>
              </div>

              {/* Column headers so it's clear what each box means */}
              <div className="grid grid-cols-[1fr_70px_100px_100px_32px] gap-2 mb-2 px-1">
                <span className="text-xs text-slate-500">Item / description</span>
                <span className="text-xs text-slate-500 text-right">Qty</span>
                <span className="text-xs text-slate-500 text-right">Unit price</span>
                <span className="text-xs text-slate-500 text-right">Amount</span>
                <span />
              </div>

              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_70px_100px_100px_32px] gap-2 items-center">
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      placeholder="e.g. Leather bag"
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                    />
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.quantity || ""}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      placeholder="1"
                      className="bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-sm text-right focus:outline-none focus:border-blue-500/50"
                    />
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.rate || ""}
                      onChange={(e) => handleRateChange(item.id, e.target.value)}
                      placeholder="0.00"
                      className="bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-sm text-right focus:outline-none focus:border-blue-500/50"
                    />
                    <div className="px-2 py-2.5 text-sm text-right text-slate-400 truncate">
                      {formatCurrency(item.quantity * item.rate, currency)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      aria-label="Remove item"
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 transition flex items-center justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax */}
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={(e) => setTaxEnabled(e.target.checked)}
                  className="accent-blue-500"
                />
                <span id={taxLabelId}>Apply tax / VAT</span>
              </label>
              {taxEnabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                    aria-labelledby={taxLabelId}
                    className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-right focus:outline-none focus:border-blue-500/50"
                  />
                  <span className="text-sm text-slate-400">%</span>
                </div>
              )}
            </div>

            {/* Notes + signature */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Notes (shown on the invoice)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label className={labelClass}>Signed by (printed name)</label>
                <input
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  placeholder="e.g. Amoo Sunday"
                  className={inputClass}
                />
                <p className="text-xs text-slate-500 mt-2">
                  This name appears under a signature line on the invoice — leave space to sign by hand after printing, or sign digitally before sending.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTab("preview")}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition"
            >
              Preview invoice →
            </button>
          </div>
        )}

        {/* PREVIEW TAB */}
        {tab === "preview" && (
          <>
            {/* EXPORT ACTIONS */}
            <div className="no-print flex flex-wrap gap-3 mb-6 justify-center">
              <button
                type="button"
                onClick={() => setTab("edit")}
                className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition"
              >
                ← Back to edit
              </button>
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={exportStatus === "working"}
                className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition disabled:opacity-50"
              >
                ⬇️ Download image
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={exportStatus === "working"}
                className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition disabled:opacity-50"
              >
                ⬇️ Download PDF
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={exportStatus === "working"}
                className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition disabled:opacity-50"
              >
                📤 Share
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={exportStatus === "working"}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition disabled:opacity-50"
              >
                🖨️ Print
              </button>
            </div>

            {exportStatus === "working" && (
              <p className="no-print text-center text-sm text-slate-400 mb-6" role="status">
                Preparing your invoice…
              </p>
            )}
            {exportStatus === "error" && (
              <p className="no-print text-center text-sm text-red-400 mb-6" role="alert">
                {exportError}
              </p>
            )}
            {shareFeedback && (
              <p className="no-print text-center text-sm text-cyan-400 mb-6" role="status">
                {shareFeedback}
              </p>
            )}

            {/* PRINTABLE / EXPORTABLE INVOICE — white background, dark text, like a real paper invoice */}
            <div
              id="invoice-printable"
              ref={invoiceRef}
              className="bg-white text-slate-900 rounded-2xl p-10 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8 flex-wrap gap-4 border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-2xl font-bold">{businessName || "Your Business Name"}</h2>
                  {businessAddress && <p className="text-slate-600 text-sm mt-1">{businessAddress}</p>}
                  {businessPhone && <p className="text-slate-600 text-sm">{businessPhone}</p>}
                  {businessEmail && <p className="text-slate-600 text-sm">{businessEmail}</p>}
                </div>
                <div className="text-right">
                  <h3 className="text-2xl font-bold text-blue-600 tracking-wide">INVOICE</h3>
                  <p className="text-slate-500 text-sm mt-1">#{invoiceNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
                <div>
                  <p className="text-slate-500 mb-1 uppercase text-xs tracking-wide">Billed to</p>
                  <p className="font-medium">{clientName || "Client name"}</p>
                  {clientAddress && <p className="text-slate-600">{clientAddress}</p>}
                  {clientPhone && <p className="text-slate-600">{clientPhone}</p>}
                  {clientEmail && <p className="text-slate-600">{clientEmail}</p>}
                </div>
                <div className="text-right">
                  <p className="text-slate-500">
                    Date issued: <span className="text-slate-900 font-medium">{issueDate}</span>
                  </p>
                  <p className="text-slate-500 mt-1">
                    Payment due: <span className="text-slate-900 font-medium">{dueDate}</span>
                  </p>
                </div>
              </div>

              <table className="w-full text-sm mb-8">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500">
                    <th className="text-left py-2 font-medium">Description</th>
                    <th className="text-right py-2 font-medium">Qty</th>
                    <th className="text-right py-2 font-medium">Unit price</th>
                    <th className="text-right py-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-3">{item.description || "—"}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">{formatCurrency(item.rate, currency)}</td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(item.quantity * item.rate, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mb-10">
                <div className="w-full max-w-xs space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totals.subtotal, currency)}</span>
                  </div>
                  {taxEnabled && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax ({taxRate}%)</span>
                      <span>{formatCurrency(totals.tax, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t-2 border-slate-200 pt-2">
                    <span>Total due</span>
                    <span className="text-blue-600">{formatCurrency(totals.total, currency)}</span>
                  </div>
                </div>
              </div>

              {notes && (
                <div className="border-t border-slate-200 pt-5 mb-10">
                  <p className="text-slate-500 text-xs">{notes}</p>
                </div>
              )}

              {/* Signature line */}
              <div className="flex justify-end">
                <div className="w-64 text-center">
                  <div className="border-b border-slate-400 h-12" />
                  <p className="text-sm font-medium mt-2">{signatoryName || "Authorized signature"}</p>
                  <p className="text-xs text-slate-500">Signature</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}