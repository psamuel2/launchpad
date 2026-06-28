"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

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
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/"); return }

      const { data } = await supabase
        .from("job_vacancies")
        .select("id, title, company, location, created_at")
        .order("created_at", { ascending: false })

      setVacancies(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
            ← Back to dashboard
          </Link>
          <Link
            href="/careers/post"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition text-sm font-medium"
          >
            + Post a vacancy
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-1">Job Tools</h1>
        <p className="text-slate-400 text-sm mb-10">Find work, build your CV, and apply — all in one place.</p>

        {/* Tools row */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <Link
            href="/careers/cv-builder"
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <div className="text-2xl mb-3">📄</div>
            <div className="font-semibold text-sm mb-1">CV Builder</div>
            <div className="text-slate-400 text-xs">AI-powered CV tailored to any role</div>
          </Link>
          <Link
            href="/careers/post"
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <div className="text-2xl mb-3">📋</div>
            <div className="font-semibold text-sm mb-1">Post a Vacancy</div>
            <div className="text-slate-400 text-xs">Share a job opening with the community</div>
          </Link>
        </div>

        {/* Vacancies list */}
        <h2 className="text-lg font-semibold mb-4">Open Vacancies</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : vacancies.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-sm">No vacancies yet — be the first to post one.</p>
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
                    <div className="font-semibold text-sm">{v.title}</div>
                    {v.company && <div className="text-slate-400 text-xs mt-0.5">{v.company}</div>}
                    {v.location && <div className="text-slate-500 text-xs mt-0.5">📍 {v.location}</div>}
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(v.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}