"use client"

import { ParsedCV } from "./parseCv"

export function CVPreview({
  name,
  role,
  parsed,
}: {
  name: string
  role: string
  parsed: ParsedCV
}) {
  return (
    <div className="bg-white text-[#1a1a1a] rounded-lg shadow-2xl p-10 mx-auto max-w-2xl font-serif">
      <h1 className="text-3xl font-bold tracking-tight">{name || "Your Name"}</h1>
      <p className="text-sm text-gray-600 mt-1 mb-6">{role}</p>
      <div className="border-b border-gray-300 mb-6" />

      {parsed.summary && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
            Professional Summary
          </h2>
          <p className="text-sm leading-relaxed text-gray-800">{parsed.summary}</p>
        </section>
      )}

      {parsed.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
            Experience
          </h2>
          <ul className="space-y-1.5">
            {parsed.experience.map((line, i) => (
              <li key={i} className="text-sm leading-relaxed text-gray-800 flex gap-2">
                <span className="text-gray-400 shrink-0">•</span>
                <span>{line.replace(/^-\s*/, "")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {parsed.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
            Education
          </h2>
          <div className="space-y-1">
            {parsed.education.map((line, i) => (
              <p key={i} className="text-sm leading-relaxed text-gray-800">
                {line}
              </p>
            ))}
          </div>
        </section>
      )}

      {parsed.skills && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
            Key Skills
          </h2>
          <p className="text-sm leading-relaxed text-gray-800">{parsed.skills}</p>
        </section>
      )}

      {!parsed.summary && !parsed.experience.length && !parsed.education.length && !parsed.skills && (
        <p className="text-sm text-gray-400 italic">Nothing to preview yet.</p>
      )}
    </div>
  )
}

export function CoverLetterPreview({ name, letter }: { name: string; letter: string }) {
  const paragraphs = letter.split("\n").filter((l) => l.trim().length > 0)
  return (
    <div className="bg-white text-[#1a1a1a] rounded-lg shadow-2xl p-10 mx-auto max-w-2xl font-serif">
      <h1 className="text-2xl font-bold tracking-tight mb-6">{name || "Your Name"}</h1>
      <div className="space-y-4">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-gray-800">
              {p}
            </p>
          ))
        ) : (
          <p className="text-sm text-gray-400 italic">Nothing to preview yet.</p>
        )}
      </div>
    </div>
  )
}