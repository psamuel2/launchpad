export interface ParsedCV {
  summary: string
  experience: string[]
  education: string[]
  skills: string
  contact: string
}

const SECTION_MAP: Record<string, string> = {
  "PROFESSIONAL SUMMARY": "PROFESSIONAL SUMMARY",
  "SUMMARY": "PROFESSIONAL SUMMARY",
  "PROFILE": "PROFESSIONAL SUMMARY",
  "EXPERIENCE": "EXPERIENCE",
  "WORK EXPERIENCE": "EXPERIENCE",
  "EMPLOYMENT": "EXPERIENCE",
  "EMPLOYMENT HISTORY": "EXPERIENCE",
  "EDUCATION": "EDUCATION",
  "QUALIFICATIONS": "EDUCATION",
  "ACADEMIC BACKGROUND": "EDUCATION",
  "KEY SKILLS": "KEY SKILLS",
  "SKILLS": "KEY SKILLS",
  "CORE COMPETENCIES": "KEY SKILLS",
  "COMPETENCIES": "KEY SKILLS",
  "CONTACT": "CONTACT",
  "CONTACT INFORMATION": "CONTACT",
  "CONTACT DETAILS": "CONTACT",
  "PERSONAL DETAILS": "CONTACT",
  "PERSONAL INFORMATION": "CONTACT",
}

function matchHeader(line: string): string | null {
  const clean = line.trim().toUpperCase().replace(/:$/, "").trim()
  return SECTION_MAP[clean] ?? null
}

export function parseCVText(raw: string): ParsedCV {
  const result: ParsedCV = {
    summary: "",
    experience: [],
    education: [],
    skills: "",
    contact: "",
  }
  if (!raw) return result

  const lines = raw.split("\n")
  let current = ""
  const buckets: Record<string, string[]> = {
    "PROFESSIONAL SUMMARY": [],
    "EXPERIENCE": [],
    "EDUCATION": [],
    "KEY SKILLS": [],
    "CONTACT": [],
  }

  for (const line of lines) {
    const matched = matchHeader(line)
    if (matched) {
      current = matched
      continue
    }
    if (current && line.trim()) {
      buckets[current].push(line.trim())
    }
  }

  result.summary = buckets["PROFESSIONAL SUMMARY"].join(" ")
  result.experience = buckets["EXPERIENCE"].filter((l) => l.length > 0)
  result.education = buckets["EDUCATION"].filter((l) => l.length > 0)
  result.skills = buckets["KEY SKILLS"].join(", ")
  result.contact = buckets["CONTACT"].join(" | ")

  return result
}