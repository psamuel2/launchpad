import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

interface CVInput {
  role: string
  about: string
  education: string
  experience: string
  skills: string
  rawUpload?: string
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing GEMINI_API_KEY. Add it in your Vercel project's Environment Variables." },
        { status: 500 }
      )
    }

    const body: CVInput = await req.json()
    const { role, about, education, experience, skills, rawUpload } = body

    if (!role || !role.trim()) {
      return NextResponse.json({ error: "Role is required." }, { status: 400 })
    }

    const hasStructuredInput =
      (about && about.trim()) ||
      (education && education.trim()) ||
      (experience && experience.trim()) ||
      (skills && skills.trim())

    let prompt: string

    if (rawUpload && rawUpload.trim()) {
      // Upload path: the candidate provided a raw existing CV.
      // The AI must extract and reorganize experience/education/skills itself,
      // not assume they were provided as separate structured fields.
      prompt = `You are an expert CV writer. Below is the raw text of a candidate's existing CV, extracted from an uploaded file. It may have messy formatting from the original document.

Your job: read through it carefully, extract their real experience, education, and skills, and rewrite the whole thing as a polished, ATS-friendly CV tailored for a "${role}" role.

RAW UPLOADED CV TEXT:
"""
${rawUpload.slice(0, 6000)}
"""

${skills && skills.trim() ? `The candidate also added these extra notes to emphasize: ${skills}` : ""}

Write the output as clean plain text using EXACTLY this structure with these section headers in capital letters, no markdown symbols, no asterisks, no bold formatting:

PROFESSIONAL SUMMARY
(2-3 sentences, tailored to the role, highlighting strengths drawn from their actual background above)

EXPERIENCE
(Extract their real work history from the raw text above and convert it into 3-6 strong bullet points starting with action verbs. Use "- " for each bullet. Use the actual employers, titles, and details found in the raw text — do not invent anything not present in it. If the raw text genuinely contains no work history, say so honestly instead of guessing.)

EDUCATION
(Extract their real education history from the raw text above, one entry per line. If genuinely not present, say so honestly.)

KEY SKILLS
(Extract and refine their real skills from the raw text above into a comma-separated list, relevant to the role.)

Keep the tone professional and concise. Do not add any commentary before or after the CV content. Do not use markdown formatting like ** or #.`
    } else {
      // Manual path: structured fields were filled in directly.
      prompt = `You are an expert CV writer. Based on the rough notes below, write a polished, ATS-friendly CV tailored for a "${role}" role.

Rough notes from the candidate:
ABOUT: ${about || "(not provided)"}
EXPERIENCE: ${experience || "(not provided)"}
EDUCATION: ${education || "(not provided)"}
SKILLS: ${skills || "(not provided)"}

Write the output as clean plain text using EXACTLY this structure with these section headers in capital letters, no markdown symbols, no asterisks, no bold formatting:

PROFESSIONAL SUMMARY
(2-3 sentences, tailored to the role, highlighting strengths)

EXPERIENCE
(Convert into 3-6 strong bullet points starting with action verbs. Use "- " for each bullet. If the candidate gave minimal detail, write reasonable, achievement-oriented bullets based on what they provided — do not invent specific employers, dates, or numbers that were not given.)

EDUCATION
(List clearly, one entry per line)

KEY SKILLS
(Comma-separated list of relevant skills, refined and role-relevant)

Keep the tone professional and concise. Do not add any commentary before or after the CV content. Do not use markdown formatting like ** or #.`
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error("Gemini API error:", errText)
      return NextResponse.json(
        { error: "Failed to generate CV. Please try again." },
        { status: 502 }
      )
    }

    const data = await response.json()
    const generatedText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    if (!generatedText) {
      return NextResponse.json({ error: "AI returned an empty response." }, { status: 502 })
    }

    return NextResponse.json({ summary: generatedText })
  } catch (err) {
    console.error("generate-cv error:", err)
    return NextResponse.json({ error: "Something went wrong generating your CV." }, { status: 500 })
  }
}