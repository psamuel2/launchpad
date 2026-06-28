"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import Sidebar from "@/components/Sidebar"
import { ArrowLeft, Briefcase, Sparkles, Menu } from "lucide-react"

// Pulls the first email address it finds in pasted text
function extractEmail(text: string): string {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  return match ? match[0] : ""
}

export default function PostVacancyPage() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [title, setTitle] = useState("")
  const [company, setCompany] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [applicationEmail, setApplicationEmail] = useState("")
  const [emailAutoFilled, setEmailAutoFilled] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      if (!user) {
        router.push("/")
      } else {
        setUser(user)
        setLoadingUser(false)
      }
    })
  }, [])

  function handleDescriptionChange(value: string) {
    setDescription(value)
    // Auto-detect an email the first time one appears, but don't fight the user
    // if they've already typed their own value in the email field.
    if (!applicationEmail || emailAutoFilled) {
      const found = extractEmail(value)
      if (found) {
        setApplicationEmail(found)
        setEmailAutoFilled(true)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!title.trim() || !description.trim()) {
      setError("Job title and description are required.")
      return
    }

    setSubmitting(true)

    const { data, error: insertError } = await supabase
      .from("job_vacancies")
      .insert({
        posted_by: user.id,
        title: title.trim(),
        company: company.trim() || null,
        location: location.trim() || null,
        description: description.trim(),
        application_email: applicationEmail.trim() || null,
        source: "user_posted",
      })
      .select()
      .single()

    setSubmitting(false)

    if (insertError) {
      setError("Couldn't post this vacancy. Please try again.")
      return
    }

    router.push(`/careers/${data.id}`)
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar user={user} />
      </div>
      <div className="hidden md:block">
        <Sidebar user={user} />
      </div>

      <main className="flex-1 overflow-auto">
        <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-white/8">
          <span className="text-lg font-bold">⚡ LaunchPad</span>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
          >
            <Menu size={18} />
          </button>
        </div>

        <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8">

          <Link
            href="/careers"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition mb-6"
          >
            <ArrowLeft size={14} /> Back to Job Tools
          </Link>

          <div className="mb-8 animate-fade-up">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-4">
              <Briefcase size={20} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold">Post a vacancy</h1>
            <p className="text-slate-400 mt-1.5 text-sm">
              Paste a job description, or write one yourself. Others on LaunchPad will be able to apply.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 animate-fade-up"
            style={{ animationDelay: "100ms" }}
          >
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                    Job title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Frontend Developer"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                    Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Inc."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Lagos, Nigeria (or Remote)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Job description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Paste the full job vacancy here — responsibilities, requirements, how to apply, etc."
                  rows={8}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Application email
                </label>
                <input
                  type="email"
                  value={applicationEmail}
                  onChange={(e) => {
                    setApplicationEmail(e.target.value)
                    setEmailAutoFilled(false)
                  }}
                  placeholder="hr@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition text-sm"
                />
                {emailAutoFilled && applicationEmail && (
                  <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5 animate-fade-up">
                    <Sparkles size={12} /> Found this email in the description — feel free to edit it
                  </p>
                )}
                {!applicationEmail && (
                  <p className="text-xs text-slate-500 mt-2">
                    Leave blank if applicants should only apply through LaunchPad
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/careers"
                className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] text-sm font-medium transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Posting…
                  </>
                ) : "Post vacancy"}
              </button>
            </div>
          </form>

        </div>
      </main>
    </div>
  )
}