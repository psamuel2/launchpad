import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY." }, { status: 500 })
    }

    const { fullName, cvSummary, jobDescription, jobTitle, jobCompany } = await req.json()

    const prompt = `Write a concise, professional cover letter (250-320 words) for ${fullName || "the candidate"} applying for the "${jobTitle || "role"}" position${jobCompany ? ` at ${jobCompany}` : ""}.

THEIR TAILORED CV:
"""
${cvSummary?.slice(0, 3000) || "(no CV provided)"}
"""

JOB DESCRIPTION:
"""
${jobDescription?.slice(0, 2000) || "(no job description provided)"}
"""

Rules:
- Plain text only. No markdown, no asterisks, no hashes, no bullet points.
- Address it to "Dear Hiring Manager,"
- Opening: hook that connects their background to this specific role
- Middle: 1-2 paragraphs showing how their experience matches THIS job's requirements specifically
- Closing: confident call to action
- ${jobCompany ? `Use the company name "${jobCompany}" naturally in the letter` : `Do not invent a company name — use "your organisation"`}
- Do not repeat the CV verbatim — synthesise it
- Do not add any commentary before or after the letter

End with:

Sincerely,

${fullName || "[Your Name]"}`

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
      return NextResponse.json({ error: "Failed to generate cover letter." }, { status: 502 })
    }

    const data = await response.json()
    const letter: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    if (!letter) {
      return NextResponse.json({ error: "AI returned empty response." }, { status: 502 })
    }

    return NextResponse.json({ letter })
  } catch (err) {
    console.error("tailor-cover-letter error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}