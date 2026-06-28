"use client"

import { useState } from "react"
import Link from "next/link"
import { parseCVText } from "@/lib/parseCv"
import { downloadCVAsPDF, downloadCoverLetterAsPDF } from "@/lib/pdfExport"
import { downloadCVAsWord, downloadCoverLetterAsWord } from "@/lib/wordExport"

type Method = "upload" | "manual" | null

export default function CVBuilder() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState("")
  const [fullName, setFullName] = useState("")
  const [method, setMethod] = useState<Method>(null)
  const [fileName, setFileName] = useState("")

  const [about, setAbout] = useState("")
  const [education, setEducation] = useState("")
  const [experience, setExperience] = useState("")
  const [skills, setSkills] = useState("")

  const [summary, setSummary] = useState("")
  const [coverLetter, setCoverLetter] = useState("")

  const [generating, setGenerating] = useState(false)
  const [generatingLetter, setGeneratingLetter] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    try {
      const text = await file.text()
      setAbout(text.slice(0, 3000))
    } catch {
      setErrorMsg("Could not read that file. Try pasting your details manually instead.")
    }
    setStep(3)
  }

  async function generateCV() {
    setErrorMsg("")
    setGenerating(true)
    try {
      const res = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, about, education, experience, skills }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong generating your CV.")
        setGenerating(false)
        return
      }
      setSummary(data.summary)
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
        body: JSON.stringify({ role, cvSummary: summary }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong generating your cover letter.")
        setGeneratingLetter(false)
        return
      }
      setCoverLetter(data.letter)
    } catch {
      setErrorMsg("Network error — please try again.")
    } finally {
      setGeneratingLetter(false)
    }
  }

  function handlePDF() {
    const parsed = parseCVText(summary)
    downloadCVAsPDF(fullName, role, parsed)
  }

  function handleWord() {
    const parsed = parseCVText(summary)
    downloadCVAsWord(fullName, role, parsed)
  }

  const progress = Math.min((step / 4) * 100, 100)

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
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

        {/* Progress bar */}
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

        {/* STEP 1: Role */}
        {step === 1 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-1">What role are you applying for?</h2>
            <p className="text-slate-400 text-sm mb-6">This helps tailor the tone and content.</p>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm mb-4"
              placeholder="e.g. Customer Support Specialist"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm mb-6"
              placeholder="Your full name (for the CV header)"
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

        {/* STEP 2: Method */}
        {step === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-6">Choose how to build your CV</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left"
                onClick={() => { setMethod("upload"); setStep(3) }}
              >
                <div className="text-3xl mb-3">📄</div>
                <div className="font-semibold text-sm mb-1">Upload existing CV</div>
                <div className="text-slate-400 text-xs">We'll use it as a starting point</div>
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

        {/* STEP 3a: Upload */}
        {step === 3 && method === "upload" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-1">Upload your previous CV</h2>
            <p className="text-slate-400 text-sm mb-6">Accepts .txt files best — PDFs/Word may need manual cleanup.</p>
            <label className="block border-2 border-dashed border-white/15 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 transition">
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleUpload} className="hidden" />
              <div className="text-2xl mb-2">📤</div>
              <div className="text-sm text-slate-300">Click to choose a file</div>
            </label>
            {fileName && <p className="text-sm text-slate-400 mt-4">Uploaded: {fileName}</p>}
            <button
              className="mt-6 text-sm text-blue-400 hover:text-blue-300 transition"
              onClick={() => setStep(3)}
            >
              Or fill in details manually instead →
            </button>
            {about && (
              <div className="mt-6">
                <label className="block text-sm text-slate-300 mb-2">Add anything else (optional)</label>
                <textarea
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  placeholder="Skills, role focus, anything to emphasize..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
                <button
                  className="mt-4 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  onClick={generateCV}
                  disabled={generating}
                >
                  {generating ? "Generating…" : "Generate CV with AI"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3b: Manual */}
        {step === 3 && method === "manual" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-6">Tell us about yourself</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-300 mb-2">About you</label>
                <textarea
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  placeholder="Briefly describe your background"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Experience</label>
                <textarea
                  className="w-full h-28 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  placeholder="Roles, responsibilities, achievements (rough notes are fine)"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Education</label>
                <textarea
                  className="w-full h-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  placeholder="Degrees, schools, certifications"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Skills</label>
                <textarea
                  className="w-full h-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                  placeholder="Relevant skills, tools, languages"
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

        {/* STEP 4: Result */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Your tailored CV</h2>
                  <p className="text-slate-400 text-sm">Role: <span className="text-white">{role}</span></p>
                </div>
                <button
                  className="text-xs text-slate-400 hover:text-white transition"
                  onClick={() => setStep(3)}
                >
                  ← Edit inputs
                </button>
              </div>
              <textarea
                className="w-full h-96 bg-[#0a0f1f] border border-white/10 rounded-xl px-4 py-4 text-white text-sm leading-relaxed focus:outline-none focus:border-blue-500/50 transition font-mono"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-2">You can edit the text directly before downloading.</p>

              <div className="grid md:grid-cols-3 gap-3 mt-6">
                <button
                  className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-sm font-medium"
                  onClick={handlePDF}
                >
                  Download PDF
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
            </div>

            {coverLetter && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h2 className="text-xl font-semibold mb-4">Cover Letter</h2>
                <textarea
                  className="w-full h-72 bg-[#0a0f1f] border border-white/10 rounded-xl px-4 py-4 text-white text-sm leading-relaxed focus:outline-none focus:border-blue-500/50 transition"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
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