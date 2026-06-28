export interface ParsedCV {
  summary: string
  experience: string[]
  education: string[]
  skills: string
}

const SECTION_HEADERS = ["PROFESSIONAL SUMMARY", "EXPERIENCE", "EDUCATION", "KEY SKILLS"]

export function parseCVText(raw: string): ParsedCV {
  const result: ParsedCV = { summary: "", experience: [], education: [], skills: "" }
  if (!raw) return result

  const lines = raw.split("\n")
  let current = ""
  const buckets: Record<string, string[]> = {
    "PROFESSIONAL SUMMARY": [],
    EXPERIENCE: [],
    EDUCATION: [],
    "KEY SKILLS": [],
  }

  for (const line of lines) {
    const trimmed = line.trim()
    const matchedHeader = SECTION_HEADERS.find(
      (h) => trimmed.toUpperCase() === h
    )
    if (matchedHeader) {
      current = matchedHeader
      continue
    }
    if (current && trimmed) {
      buckets[current].push(trimmed)
    }
  }

  result.summary = buckets["PROFESSIONAL SUMMARY"].join(" ")
  result.experience = buckets["EXPERIENCE"].filter((l) => l.length > 0)
  result.education = buckets["EDUCATION"].filter((l) => l.length > 0)
  result.skills = buckets["KEY SKILLS"].join(" ")

  return result
}