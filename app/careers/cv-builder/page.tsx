"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { parseCVText } from "@/lib/parseCv"
import { downloadCVAsPDF, downloadCoverLetterAsPDF, saveCVToSupabase } from "@/lib/pdfExport"
import { downloadCVAsWord, downloadCoverLetterAsWord } from "@/lib/wordExport"
import { CVPreview, CoverLetterPreview } from "@/lib/cvPreview"

type Method = "upload" | "manual" | null
type ViewMode = "edit" | "preview"

export default function CVBuilder() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)

  const [step, setStep] = useState(1)
  const [role, setRole] = useState("")
  const [fullName, setFullName] = useState("")
  const [method, setMethod] = useState<Method>(null)
  const [fileName, setFileName] = useState("")

  // Manual path fields
  const [about, setAbout] = useState("")
  const [education, setEducation] = useState("")
  const [experience, setExperience] = useState("")
  const [skills, setSkills] = useState("")

  // Upload path
  const [rawUpload, setRawUpload] = useState("")
  const [uploadExtraNotes, setUploadExtraNotes] = useState("")

  const [summary, setSummary] = useState("")
  const [coverLetter, setCoverLetter] = useState("")

  const [cvView, setCvView] = useState<ViewMode>("preview")
  const [letterView, setLetterView] = useState<ViewMode>("preview")

  const [generating, setGenerating] = useState(false)
  const [generatingLetter, setGeneratingLetter] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [uploadWarning, setUploadWarning] = useState("")

  const [savingCV, setSavingCV] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "failed">("idle")

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setUploadWarning("")
    setErrorMsg("")

    const isPlainText =
      file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")

    try {
      if (isPlainText) {
        const text = await file.text()
        setRawUpload(text.slice(0, 6000))
      } else {
        const buffer = await file.arrayBuffer()
        const decoder = new TextDecoder("latin1")
        const raw = decoder.decode(buffer)
        const readable = raw.match(/[ -~]{4,}/g)?.join(" ") ?? ""
        if (readable.trim().length < 100) {
          setUploadWarning(
            "We couldn't extract enough text from this file. For best results, open your CV and save it as a .txt file, then re-upload."
          )
          setRawUpload(readable.slice(0, 6000))
        } else {
          setRawUpload(readable.slice(0, 6000))
          setUploadWarning(
            "PDF/Word files may lose some formatting during extraction. If anything looks off after generating, try re-uploading as a .txt file."
          )
        }
      }
    } catch {
      setErrorMsg("Could not read that file. Try saving your CV as a .txt file and re-uploading.")
    }
  }

  async function generateCV() {
    setErrorMsg("")
    setGenerating(true)
    try {
      const payload =
        method === "upload"
          ? { role, fullName, rawUpload, skills: uploadExtraNotes }
          : { role, fullName, about, education, experience, skills }

      const res = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong generating your CV.")
        setGenerating(false)
        return
      }
      setSummary(data.summary)
      setCvView("preview")
      setStep(4)
    } catch {
      setErrorMsg("Network error — please try again.")
    } finally {
      setGenerating(false)
    }
  }

  async function generateLetter() {
    setErrorMsg("")
    setGeneratingLetter(true)
    try {
      const res = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, cvSummary: summary, fullName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong generating your cover letter.")
        setGeneratingLetter(false)
        return
      }
      setCoverLetter(data.letter)
      setLetterView("preview")
    } catch {
      setErrorMsg("Network error — please try again.")
    } finally {
      setGeneratingLetter(false)
    }
  }

  async function handlePDF() {
    const parsed = parseCVText(summary)
    downloadCVAsPDF(fullName, role, parsed)

    if (userId) {
      setSavingCV(true)
      setSaveStatus("idle")
      const url = await saveCVToSupabase(supabase, userId, fullName, role, parsed)
      setSavingCV(false)
      setSaveStatus(url ? "saved" : "failed")
      setTimeout(() => setSaveStatus("idle"), 4000)
    }
  }

  function handleWord() {
    const parsed = parseCVText(summary)
    downloadCVAsWord(fullName, role, parsed)
  }

  const progress = Math.min((step / 4) * 100, 100)
  const parsedCV = parseCVText(summary)
  const canGenerateUpload = rawUpload.trim().length > 0

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition flex items-center gap-1">
            ← Back to dashboard
          </Link>
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 font-medium">
            AI CV Builder
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-1">Build your CV</h1>
        <p className="text-slate-400 text-sm mb-8">A few steps and AI handles the polish.</p>

        <div className="h-1.5 w-full bg-white/8 rounded-full mb-10 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        {step === 1 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-1">What role are you applying for?</h2>
            <p className="text-slate-400 text-sm mb-6">This helps tailor the tone and content of your CV.</p>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm mb-4"
              placeholder="e.g. Customer Support Specialist"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm mb-6"
              placeholder="Your full name (appears on the CV)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <button
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-sm font-medium disabled:opacity-50"
              disabled={!role.trim()}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-6">How would you like to build your CV?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left"
                onClick={() => { setMethod("upload"); setStep(3) }}
              >
                <div className="text-3xl mb-3">📄</div>
                <div className="font-semibold text-sm mb-1">Upload existing CV</div>
                <div className="text-slate-400 text-xs">AI reads it and rewrites it for this role</div>
              </button>
              <button
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left"
                onClick={() => { setMethod("manual"); setStep(3) }}
              >
                <div className="text-3xl mb-3">✏️</div>
                <div className="font-semibold text-sm mb-1">Build from scratch</div>
                <div className="text-slate-400 text-xs">Answer a few quick questions</div>
              </button>
            </div>
          </div>
        )}

        {step === 3 && method === "upload" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-1">Upload your previous CV</h2>
            <p className="text-slate-400 text-sm mb-6">
              AI will read it, extract your experience, education and skills, and rewrite it for this role.
              Plain <span className="text-white">.txt files</span> work most reliably.
            </p>
            <label className="block border-2 border-dashed border-white/15 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 transition">
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleUpload} className="hidden" />
              <div className="text-2xl mb-2">📤</div>
              <div className="text-sm text-slate-300">Click to choose a file</div>
              <div className="text-xs text-slate-500 mt-1">.txt, .pdf, .doc, .docx supported</div>
            </label>

            {fileName && (
              <p className="text-sm text-slate-400 mt-4">
                Uploaded: <span className="text-white">{fileName}</span>
              </p>
            )}

            {uploadWarning && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                {uploadWarning}
              </div>
            )}

            <button
              className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition"
              onClick={() => { setMethod("manual"); setUploadWarning("") }}
            >
              Or fill in details manually instead →
            </button>

            {rawUpload && (
              <div className="mt-6">
                <label className="block text-sm text-slate-300 mb-2">
                  Anything specific to highlight for this role? <span className="text-slate-500">(optional)</span>
                </label>
                <textarea
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  placeholder="e.g. focus more on leadership, or mention I'm open to relocating"
                  value={uploadExtraNotes}
                  onChange={(e) => setUploadExtraNotes(e.target.value)}
                />
                <button
                  className="mt-4 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  onClick={generateCV}
                  disabled={generating || !canGenerateUpload}
                >
                  {generating ? "Generating…" : "Generate CV with AI"}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 3 && method === "manual" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-6">Tell us about yourself</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-300 mb-2">About you</label>
                <textarea
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  placeholder="Briefly describe your background and what you bring to this role"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Experience</label>
                <textarea
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  placeholder="List your roles, organisations, dates and key responsibilities. Rough notes are fine — e.g. 'Sales Rep at Acme Ltd 2020-2023, managed 50 accounts'"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Education</label>
                <textarea
                  className="w-full h-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  placeholder="Degrees, schools, certifications and years — e.g. BSc Computer Science, University of Lagos, 2019"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Skills</label>
                <textarea
                  className="w-full h-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  placeholder="Relevant skills, tools, software, languages"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>
              <button
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                onClick={generateCV}
                disabled={generating}
              >
                {generating ? "Generating…" : "Generate CV with AI"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Your tailored CV</h2>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Role: <span className="text-white">{role}</span>
                  </p>
                </div>
                <button
                  className="text-xs text-slate-400 hover:text-white transition"
                  onClick={() => setStep(3)}
                >
                  ← Edit inputs
                </button>
              </div>

              <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1 mb-4">
                <button
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    cvView === "edit" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                  }`}
                  onClick={() => setCvView("edit")}
                >
                  Edit
                </button>
                <button
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    cvView === "preview" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                  }`}
                  onClick={() => setCvView("preview")}
                >
                  Preview
                </button>
              </div>

              {cvView === "edit" ? (
                <>
                  <textarea
                    className="w-full h-96 bg-[#0a0f1f] border border-white/10 rounded-xl px-4 py-4 text-white text-sm leading-relaxed focus:outline-none focus:border-blue-500/50 transition font-mono"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Edit the text directly. Switch to Preview to see how it looks.
                  </p>
                </>
              ) : (
                <div className="bg-[#0a0f1f] border border-white/10 rounded-xl p-6 max-h-[600px] overflow-y-auto">
                  <CVPreview name={fullName} role={role} parsed={parsedCV} />
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-3 mt-6">
                <button
                  className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-sm font-medium flex items-center justify-center gap-2"
                  onClick={handlePDF}
                  disabled={savingCV}
                >
                  {savingCV ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : "Download PDF"}
                </button>
                <button
                  className="py-3 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 transition-all text-sm font-medium"
                  onClick={handleWord}
                >
                  Download Word
                </button>
                <button
                  className="py-3 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 transition-all text-sm font-medium disabled:opacity-50"
                  onClick={generateLetter}
                  disabled={generatingLetter}
                >
                  {generatingLetter ? "Generating…" : "Generate Cover Letter"}
                </button>
              </div>

              {saveStatus === "saved" && (
                <p className="text-xs text-emerald-400 mt-3">
                  ✅ Saved to your LaunchPad CVs — you can use it when applying to jobs
                </p>
              )}
              {saveStatus === "failed" && (
                <p className="text-xs text-amber-400 mt-3">
                  Downloaded, but couldn't save a copy to your account. You can still upload it manually when applying.
                </p>
              )}
            </div>

            {coverLetter && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h2 className="text-xl font-semibold mb-4">Cover Letter</h2>

                <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1 mb-4">
                  <button
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      letterView === "edit" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                    }`}
                    onClick={() => setLetterView("edit")}
                  >
                    Edit
                  </button>
                  <button
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      letterView === "preview" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                    }`}
                    onClick={() => setLetterView("preview")}
                  >
                    Preview
                  </button>
                </div>

                {letterView === "edit" ? (
                  <textarea
                    className="w-full h-72 bg-[#0a0f1f] border border-white/10 rounded-xl px-4 py-4 text-white text-sm leading-relaxed focus:outline-none focus:border-blue-500/50 transition"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />
                ) : (
                  <div className="bg-[#0a0f1f] border border-white/10 rounded-xl p-6 max-h-[500px] overflow-y-auto">
                    <CoverLetterPreview name={fullName} letter={coverLetter} />
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  <button
                    className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-sm font-medium"
                    onClick={() => downloadCoverLetterAsPDF(fullName, coverLetter)}
                  >
                    Download PDF
                  </button>
                  <button
                    className="py-3 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 transition-all text-sm font-medium"
                    onClick={() => downloadCoverLetterAsWord(fullName, coverLetter)}
                  >
                    Download Word
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}