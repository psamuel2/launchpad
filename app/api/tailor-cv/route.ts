import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY." }, { status: 500 })
    }

    const { fullName, rawCV, jobDescription, jobTitle, jobCompany } = await req.json()

    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 })
    }

    const prompt = `You are an expert CV writer and career coach. Your job is to tailor a candidate's CV specifically to match a job vacancy.

CANDIDATE NAME: ${fullName || "(not provided)"}

CANDIDATE'S EXISTING CV / BACKGROUND:
"""
${rawCV?.trim() ? rawCV.slice(0, 6000) : "(No existing CV provided — build from scratch based on the job requirements, using placeholder sections the user can fill in.)"}
"""

JOB THEY ARE APPLYING FOR:
Title: ${jobTitle || "Not specified"}
Company: ${jobCompany || "Not specified"}
Full Job Description:
"""
${jobDescription.slice(0, 4000)}
"""

YOUR TASK:
Rewrite the candidate's CV so it is perfectly tailored to this specific job. Match their experience and skills to the job requirements. Use keywords from the job description naturally. Strengthen weak bullet points. Prioritise the most relevant experience.

Use EXACTLY these section headers in ALL CAPS on their own line. No asterisks, no markdown, no bold, no hashes.

CONTACT
(Candidate's name on first line. Then:
[Your email address]
[Your phone number]
[Your city / address]
Only include real details if found in their existing CV — never invent contact details.)

PROFESSIONAL SUMMARY
(3 sentences maximum. Tailored specifically to the "${jobTitle || "role"}" at "${jobCompany || "this company"}". Highlight the candidate's most relevant strengths for THIS job.)

EXPERIENCE
(For each role, use this exact format:
Job Title — Organisation Name | Start Date – End Date
- Achievement bullet tailored to be relevant to this job application
- Achievement bullet tailored to be relevant to this job application
Use real details from their CV. Do not invent employers or dates.)

EDUCATION
(Degree or Qualification — Institution Name | Year
One entry per line. Real details only.)

KEY SKILLS
(Comma-separated list. Prioritise skills that appear in the job description and match the candidate's background.)

Do not add any commentary, preamble, or sign-off. Output only the CV content.`

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
      console.error("Gemini error:", errText)
      return NextResponse.json({ error: "Failed to tailor CV. Please try again." }, { status: 502 })
    }

    const data = await response.json()
    const tailored: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    if (!tailored) {
      return NextResponse.json({ error: "AI returned an empty response." }, { status: 502 })
    }

    return NextResponse.json({ summary: tailored })
  } catch (err) {
    console.error("tailor-cv error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}