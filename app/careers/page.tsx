"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { parseCVText } from "@/lib/parseCv"
import { CVPreview } from "@/lib/cvPreview"
import { downloadCVAsPDF, saveCVToSupabase } from "@/lib/pdfExport"

type Step = "paste" | "cv" | "tailor" | "preview" | "done"

type ParsedJob = {
  title: string | null
  company: string | null
  location: string | null
  email: string | null
  requirements: string | null
}

type SavedCV = {
  id: string
  file_name: string
  file_url: string
  created_at: string
}

type Vacancy = {
  id: string
  title: string
  company: string | null
  location: string | null
  created_at: string
}

export default function CareersPage() {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState<Step>("paste")

  // Job vacancy
  const [vacancyText, setVacancyText] = useState("")
  const [parsedJob, setParsedJob] = useState<ParsedJob | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState("")

  // CV
  const [cvMode, setCvMode] = useState<"upload" | "saved">("upload")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedText, setUploadedText] = useState("")
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([])
  const [selectedCV, setSelectedCV] = useState<SavedCV | null>(null)
  const [fullName, setFullName] = useState("")

  // Tailored output
  const [tailoring, setTailoring] = useState(false)
  const [tailoredCV, setTailoredCV] = useState("")
  const [coverLetter, setCoverLetter] = useState("")
  const [tailorError, setTailorError] = useState("")
  const [generatingLetter, setGeneratingLetter] = useState(false)

  // Apply
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState("")
  const [applySuccess, setApplySuccess] = useState(false)

  // Share prompt
  const [showSharePrompt, setShowSharePrompt] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)

  // Public vacancies
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loadingVacancies, setLoadingVacancies] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/"); return }
      setUser(user)

      // Pre-fill name from metadata
      const name = user.user_metadata?.full_name || ""
      setFullName(name)

      // Load saved CVs
      const { data: cvs } = await supabase
        .from("cvs")
        .select("id, file_name, file_url, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (cvs) setSavedCVs(cvs)

      // Load public vacancies
      const { data: vacs } = await supabase
        .from("job_vacancies")
        .select("id, title, company, location, created_at")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20)
      setVacancies(vacs || [])
      setLoadingVacancies(false)
    }
    load()
  }, [])

  // Step 1: Parse the pasted vacancy
  async function handleParseVacancy() {
    if (!vacancyText.trim()) return
    setParsing(true)
    setParseError("")
    try {
      const res = await fetch("/api/parse-vacancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vacancyText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not parse vacancy")
      setParsedJob(data)
      setStep("cv")
    } catch (err: any) {
      setParseError(err.message)
    } finally {
      setParsing(false)
    }
  }

  // Handle file upload — extract text
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text()
        setUploadedText(text.slice(0, 6000))
      } else {
        const buffer = await file.arrayBuffer()
        const decoder = new TextDecoder("latin1")
        const raw = decoder.decode(buffer)
        const readable = raw.match(/[ -~]{4,}/g)?.join(" ") ?? ""
        setUploadedText(readable.slice(0, 6000))
      }
    } catch {
      setUploadedText("")
    }
  }

  // Step 2 → 3: Tailor CV to job
  async function handleTailorCV() {
    if (!parsedJob) return
    setTailoring(true)
    setTailorError("")
    setStep("tailor")

    try {
      const rawCV = cvMode === "saved" && selectedCV
        ? `Using saved CV: ${selectedCV.file_name}`
        : uploadedText

      const res = await fetch("/api/tailor-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          rawCV,
          jobDescription: vacancyText,
          jobTitle: parsedJob.title,
          jobCompany: parsedJob.company,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to tailor CV")
      setTailoredCV(data.summary)

      // Auto-generate cover letter too
      const letterRes = await fetch("/api/tailor-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          cvSummary: data.summary,
          jobDescription: vacancyText,
          jobTitle: parsedJob.title,
          jobCompany: parsedJob.company,
        }),
      })
      const letterData = await letterRes.json()
      if (letterRes.ok) setCoverLetter(letterData.letter)

      setStep("preview")
    } catch (err: any) {
      setTailorError(err.message)
      setStep("cv")
    } finally {
      setTailoring(false)
    }
  }

  // Step 4: Apply
  async function handleApply() {
    if (!parsedJob?.email) {
      setApplyError("No application email found in the job vacancy.")
      return
    }
    setApplying(true)
    setApplyError("")

    try {
      // Save tailored CV to Supabase first
      const parsed = parseCVText(tailoredCV)
      let cvUrl = ""

      if (user) {
        const url = await saveCVToSupabase(supabase, user.id, fullName, parsedJob.title || "Role", parsed)
        cvUrl = url || ""
      }

      // Send via API
      const res = await fetch("/api/apply-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vacancyId: null,
          applicationEmail: parsedJob.email,
          jobTitle: parsedJob.title,
          company: parsedJob.company,
          cvUrl,
          note: coverLetter,
          applicantName: fullName || user?.email,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send application")

      // Also open mailto as backup
      const subject = encodeURIComponent(`Application for ${parsedJob.title || "the role"}${parsedJob.company ? ` at ${parsedJob.company}` : ""}`)
      const body = encodeURIComponent(coverLetter || `Dear Hiring Manager,\n\nPlease find my CV attached.\n\nKind regards,\n${fullName}`)
      window.open(`mailto:${parsedJob.email}?subject=${subject}&body=${body}`)

      setApplySuccess(true)
      setStep("done")
      setShowSharePrompt(true)
    } catch (err: any) {
      setApplyError(err.message)
    } finally {
      setApplying(false)
    }
  }

  // Share job publicly
  async function handleShare() {
    if (!parsedJob || !user) return
    setSharing(true)
    try {
      const { error } = await supabase.from("job_vacancies").insert({
        title: parsedJob.title || "Untitled Role",
        company: parsedJob.company,
        location: parsedJob.location,
        description: vacancyText,
        application_email: parsedJob.email,
        posted_by: user.id,
        is_public: true,
      })
      if (error) throw new Error(error.message)
      setShared(true)
      setShowSharePrompt(false)

      // Refresh vacancies list
      const { data: vacs } = await supabase
        .from("job_vacancies")
        .select("id, title, company, location, created_at")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20)
      setVacancies(vacs || [])
    } catch (err: any) {
      console.error(err)
    } finally {
      setSharing(false)
    }
  }

  function resetFlow() {
    setStep("paste")
    setVacancyText("")
    setParsedJob(null)
    setUploadedFile(null)
    setUploadedText("")
    setSelectedCV(null)
    setTailoredCV("")
    setCoverLetter("")
    setApplySuccess(false)
    setShowSharePrompt(false)
    setShared(false)
    setApplyError("")
    setTailorError("")
  }

  const parsedForPreview = parseCVText(tailoredCV)

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
            ← Dashboard
          </Link>
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 font-medium">
            Job Tools
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-1">Apply for Jobs</h1>
        <p className="text-slate-400 text-sm mb-8">
          Paste any job vacancy, let AI tailor your CV, and apply in seconds.
        </p>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
          {[
            { key: "paste", label: "1. Paste job" },
            { key: "cv", label: "2. Your CV" },
            { key: "tailor", label: "3. AI tailoring" },
            { key: "preview", label: "4. Preview & Apply" },
            { key: "done", label: "5. Done" },
          ].map((s, i) => {
            const steps = ["paste", "cv", "tailor", "preview", "done"]
            const current = steps.indexOf(step)
            const thisIdx = steps.indexOf(s.key)
            const active = thisIdx === current
            const done = thisIdx < current
            return (
              <div key={s.key} className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active ? "bg-blue-600 text-white" :
                  done ? "bg-emerald-500/20 text-emerald-400" :
                  "bg-white/5 text-slate-500"
                }`}>
                  {done ? "✓" : null} {s.label}
                </div>
                {i < 4 && <div className="w-4 h-px bg-white/10 shrink-0" />}
              </div>
            )
          })}
        </div>

        {/* ── STEP 1: Paste vacancy ── */}
        {step === "paste" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-semibold mb-1">Paste the job vacancy</h2>
            <p className="text-slate-400 text-sm mb-5">
              Copy the full job posting from anywhere — LinkedIn, Indeed, a company website — and paste it below.
            </p>
            <textarea
              className="w-full h-56 bg-[#0a0f1f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm leading-relaxed resize-none"
              placeholder="Paste the full job vacancy here, including the application email..."
              value={vacancyText}
              onChange={(e) => setVacancyText(e.target.value)}
            />
            {parseError && (
              <p className="mt-3 text-red-400 text-xs">{parseError}</p>
            )}
            <button
              onClick={handleParseVacancy}
              disabled={!vacancyText.trim() || parsing}
              className="mt-4 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {parsing ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analysing vacancy…</>
              ) : "Analyse & Continue →"}
            </button>
          </div>
        )}

        {/* ── STEP 2: CV input ── */}
        {step === "cv" && parsedJob && (
          <div className="space-y-5">
            {/* Job summary card */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
              <p className="text-xs text-emerald-400 font-medium mb-2">✓ Job vacancy analysed</p>
              <p className="font-semibold">{parsedJob.title || "Role not detected"}</p>
              {parsedJob.company && <p className="text-slate-400 text-sm">{parsedJob.company}</p>}
              {parsedJob.location && <p className="text-slate-500 text-xs mt-0.5">📍 {parsedJob.location}</p>}
              {parsedJob.email ? (
                <p className="text-xs text-slate-400 mt-2">📧 Apply to: <span className="text-white">{parsedJob.email}</span></p>
              ) : (
                <p className="text-xs text-amber-400 mt-2">⚠️ No application email found — please check the vacancy text includes one.</p>
              )}
            </div>

            {/* Name */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <label className="block text-sm text-slate-300 mb-2">Your full name (appears on CV)</label>
              <input
                className="w-full bg-[#0a0f1f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                placeholder="e.g. Samuel Promise"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* CV source */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-4">Your CV</h2>

              {savedCVs.length > 0 && (
                <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1 mb-5">
                  <button
                    onClick={() => setCvMode("upload")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${cvMode === "upload" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    Upload CV
                  </button>
                  <button
                    onClick={() => setCvMode("saved")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${cvMode === "saved" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    Use saved CV ({savedCVs.length})
                  </button>
                </div>
              )}

              {cvMode === "upload" && (
                <div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 transition"
                  >
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-sm text-slate-300">
                      {uploadedFile ? uploadedFile.name : "Click to upload your CV"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">.pdf, .doc, .docx, .txt</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <p className="text-xs text-slate-500 mt-3">
                    Don't have a CV?{" "}
                    <Link href="/careers/cv-builder" className="text-blue-400 hover:text-blue-300">
                      Build one first →
                    </Link>
                  </p>
                </div>
              )}

              {cvMode === "saved" && (
                <div className="space-y-2">
                  {savedCVs.map((cv) => (
                    <button
                      key={cv.id}
                      onClick={() => setSelectedCV(cv)}
                      className={`w-full text-left p-4 rounded-xl border transition-all text-sm ${
                        selectedCV?.id === cv.id
                          ? "bg-blue-600/20 border-blue-500/50 text-white"
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <div className="font-medium">{cv.file_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Saved {new Date(cv.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {tailorError && (
              <p className="text-red-400 text-sm">{tailorError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleTailorCV}
                disabled={tailoring || (cvMode === "upload" ? !uploadedFile : !selectedCV)}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Tailor my CV with AI →
              </button>
              <button
                onClick={() => setStep("paste")}
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-sm"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Tailoring in progress ── */}
        {step === "tailor" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
            <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-5" />
            <h2 className="text-lg font-semibold mb-2">AI is tailoring your CV…</h2>
            <p className="text-slate-400 text-sm">
              Matching your experience to the job requirements and writing your cover letter.
            </p>
          </div>
        )}

        {/* ── STEP 4: Preview & Apply ── */}
        {step === "preview" && (
          <div className="space-y-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Your tailored CV</h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Tailored for: <span className="text-white">{parsedJob?.title}</span>
                    {parsedJob?.company && <> at <span className="text-white">{parsedJob.company}</span></>}
                  </p>
                </div>
                <button onClick={() => setStep("cv")} className="text-xs text-slate-400 hover:text-white transition shrink-0">
                  ← Edit
                </button>
              </div>

              <div className="bg-[#0a0f1f] border border-white/10 rounded-xl p-5 max-h-72 overflow-y-auto mb-4">
                <CVPreview name={fullName} role={parsedJob?.title || ""} parsed={parsedForPreview} />
              </div>

              <button
                onClick={() => {
                  const parsed = parseCVText(tailoredCV)
                  downloadCVAsPDF(fullName, parsedJob?.title || "Role", parsed)
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                ↓ Download tailored CV PDF
              </button>
            </div>

            {coverLetter && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold">Cover Letter</h2>
                  <span className="text-xs text-emerald-400">Auto-generated ✓</span>
                </div>
                <textarea
                  className="w-full h-48 bg-[#0a0f1f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm leading-relaxed focus:outline-none focus:border-blue-500/50 transition resize-none"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>
            )}

            {!parsedJob?.email && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                ⚠️ No application email was found in the vacancy. You can still download your tailored CV but cannot auto-apply.
              </div>
            )}

            {applyError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {applyError}
              </div>
            )}

            <div className="flex gap-3">
              {parsedJob?.email && (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {applying ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending application…</>
                  ) : `Apply to ${parsedJob.company || "this role"} →`}
                </button>
              )}
              <button
                onClick={resetFlow}
                className="px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-sm"
              >
                Apply to another job
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Done ── */}
        {step === "done" && (
          <div className="space-y-5">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-xl font-bold mb-2">Application sent!</h2>
              <p className="text-slate-400 text-sm">
                Your tailored CV was emailed to {parsedJob?.company || "the employer"} at{" "}
                <span className="text-white">{parsedJob?.email}</span>.
                Your email client also opened as a backup.
              </p>
            </div>

            {/* Share prompt */}
            {showSharePrompt && !shared && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold mb-1">Share this job with others?</h3>
                <p className="text-slate-400 text-sm mb-5">
                  Post this vacancy publicly so other LaunchPad users can also apply to it.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleShare}
                    disabled={sharing}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sharing ? (
                      <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sharing…</>
                    ) : "Yes, share it →"}
                  </button>
                  <button
                    onClick={() => setShowSharePrompt(false)}
                    className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-sm"
                  >
                    No thanks
                  </button>
                </div>
              </div>
            )}

            {shared && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                ✅ Job posted publicly — other users can now apply to it too.
              </div>
            )}

            <button
              onClick={resetFlow}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-sm"
            >
              Apply to another job
            </button>
          </div>
        )}

        {/* ── Public Vacancies Board ── */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Community Job Board</h2>
            <span className="text-xs text-slate-500">Jobs shared by users</span>
          </div>

          {loadingVacancies ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : vacancies.length === 0 ? (
            <div className="text-center py-14 text-slate-500">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm">No jobs shared yet. Apply to one above and share it!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vacancies.map((v) => (
                <Link
                  key={v.id}
                  href={`/careers/${v.id}`}
                  className="block p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-sm">{v.title}</div>
                      {v.company && <div className="text-slate-400 text-xs mt-0.5">{v.company}</div>}
                      {v.location && <div className="text-slate-500 text-xs mt-0.5">📍 {v.location}</div>}
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap mt-0.5">
                      {new Date(v.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}