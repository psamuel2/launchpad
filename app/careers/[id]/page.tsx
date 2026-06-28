"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

type Vacancy = {
  id: string
  title: string
  company: string | null
  location: string | null
  description: string
  application_email: string | null
  posted_by: string
  created_at: string
}

type SavedCV = {
  id: string
  file_name: string
  file_url: string
  created_at: string
}

export default function VacancyPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [vacancy, setVacancy] = useState<Vacancy | null>(null)
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [showApplyForm, setShowApplyForm] = useState(false)
  const [cvMode, setCvMode] = useState<"upload" | "saved">("upload")
  const [selectedCVUrl, setSelectedCVUrl] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [note, setNote] = useState("")
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState("")
  const [applySuccess, setApplySuccess] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/"); return }
      setUser(user)

      const { data: v, error } = await supabase
        .from("job_vacancies")
        .select("*")
        .eq("id", params.id)
        .single()

      if (error || !v) { setNotFound(true); setLoading(false); return }
      setVacancy(v)

      const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("vacancy_id", params.id)
        .eq("applicant_id", user.id)
        .maybeSingle()
      if (existing) setAlreadyApplied(true)

      const { data: cvs } = await supabase
        .from("cvs")
        .select("id, file_name, file_url, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (cvs) setSavedCVs(cvs)

      setLoading(false)
    }
    load()
  }, [])

  async function handleApply() {
    if (!vacancy || !user) return
    setApplying(true)
    setApplyError("")

    try {
      let cvUrl = selectedCVUrl

      if (cvMode === "upload" && uploadedFile) {
        const ext = uploadedFile.name.split(".").pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from("cvs")
          .upload(path, uploadedFile, { upsert: true })
        if (uploadError) throw new Error(uploadError.message)
        const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(path)
        cvUrl = urlData.publicUrl
      }

      if (!cvUrl) throw new Error("Please select or upload a CV.")

      const res = await fetch("/api/apply-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vacancyId: vacancy.id,
          applicationEmail: vacancy.application_email,
          jobTitle: vacancy.title,
          company: vacancy.company,
          cvUrl,
          note,
          applicantName: user.user_metadata?.full_name || user.email,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Something went wrong.")

      // Open mailto as backup
      if (vacancy.application_email) {
        const subject = encodeURIComponent(`Application for ${vacancy.title}${vacancy.company ? ` at ${vacancy.company}` : ""}`)
        const body = encodeURIComponent(
          `Dear Hiring Manager,\n\nI am writing to apply for the ${vacancy.title} position.\n\n${note ? note + "\n\n" : ""}Please find my CV attached.\n\nKind regards,\n${user.user_metadata?.full_name || ""}`
        )
        window.open(`mailto:${vacancy.application_email}?subject=${subject}&body=${body}`)
      }

      setApplySuccess(true)
      setAlreadyApplied(true)
      setShowApplyForm(false)
    } catch (err: any) {
      setApplyError(err.message)
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400">This vacancy doesn't exist or has been removed.</p>
        <Link href="/careers" className="text-blue-400 hover:text-blue-300 text-sm transition">← Back to vacancies</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-2xl mx-auto px-6 py-10">

        <Link href="/careers" className="text-sm text-slate-400 hover:text-white transition flex items-center gap-1 mb-8">
          ← Back to vacancies
        </Link>

        {/* Vacancy detail */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">{vacancy!.title}</h1>
              {vacancy!.company && <p className="text-slate-400 text-sm">{vacancy!.company}</p>}
              {vacancy!.location && <p className="text-slate-500 text-xs mt-1">📍 {vacancy!.location}</p>}
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap mt-1">
              {new Date(vacancy!.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{vacancy!.description}</p>
          </div>

          {vacancy!.application_email && (
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-slate-400">Apply to: <span className="text-white">{vacancy!.application_email}</span></p>
            </div>
          )}
        </div>

        {/* Apply section */}
        {applySuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
            ✅ Application sent! Your CV was emailed to the employer and your email client opened as a backup.
          </div>
        )}

        {alreadyApplied && !applySuccess && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm mb-6">
            You've already applied to this vacancy.
          </div>
        )}

        {!alreadyApplied && !showApplyForm && (
          <button
            onClick={() => setShowApplyForm(true)}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all font-semibold text-sm"
          >
            Apply for this role
          </button>
        )}

        {showApplyForm && !alreadyApplied && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-lg font-semibold mb-6">Your application</h2>

            {/* CV mode toggle */}
            {savedCVs.length > 0 && (
              <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
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
                  Use saved CV
                </button>
              </div>
            )}

            {/* Upload */}
            {cvMode === "upload" && (
              <div className="mb-6">
                <label className="block text-sm text-slate-300 mb-2">CV / Resume</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500/50 transition"
                >
                  <div className="text-2xl mb-1">📄</div>
                  <p className="text-sm text-slate-300">{uploadedFile ? uploadedFile.name : "Click to upload your CV"}</p>
                  <p className="text-xs text-slate-500 mt-1">.pdf, .doc, .docx</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setUploadedFile(e.target.files?.[0] || null)} />
              </div>
            )}

            {/* Saved CVs */}
            {cvMode === "saved" && (
              <div className="mb-6 space-y-2">
                <label className="block text-sm text-slate-300 mb-3">Select a saved CV</label>
                {savedCVs.map((cv) => (
                  <button
                    key={cv.id}
                    onClick={() => setSelectedCVUrl(cv.file_url)}
                    className={`w-full text-left p-4 rounded-xl border transition-all text-sm ${
                      selectedCVUrl === cv.file_url
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

            {/* Note */}
            <div className="mb-6">
              <label className="block text-sm text-slate-300 mb-2">Cover note <span className="text-slate-500">(optional)</span></label>
              <textarea
                className="w-full h-28 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition text-sm"
                placeholder="A short note to the employer..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {applyError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {applyError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleApply}
                disabled={applying || (cvMode === "upload" ? !uploadedFile : !selectedCVUrl)}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {applying ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                ) : "Send application"}
              </button>
              <button
                onClick={() => setShowApplyForm(false)}
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}