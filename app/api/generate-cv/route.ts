import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

interface CVInput {
  role: string
  fullName?: string
  about?: string
  education?: string
  experience?: string
  skills?: string
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
    const { role, fullName, about, education, experience, skills, rawUpload } = body

    if (!role || !role.trim()) {
      return NextResponse.json({ error: "Role is required." }, { status: 400 })
    }

    let prompt: string

    if (rawUpload && rawUpload.trim()) {
      prompt = `You are an expert CV writer. Below is the raw text of a candidate's existing CV, extracted from an uploaded file. It may have messy formatting.

RAW UPLOADED CV TEXT:
"""
${rawUpload.slice(0, 6000)}
"""

${skills?.trim() ? `Extra notes from the candidate: ${skills}` : ""}

Your job: read through it carefully, extract all real details, and rewrite it as a polished, ATS-friendly CV tailored for a "${role}" role.

Use EXACTLY these section headers in ALL CAPS on their own line. No asterisks, no markdown, no bold, no hashes.

CONTACT
(Extract the candidate's full name, email address, phone number, and physical address or city/country from the raw text above. Write each item on its own line. If any detail is genuinely missing from the raw text, omit that line — do not invent anything.)

PROFESSIONAL SUMMARY
(2-3 sentences tailored to the "${role}" role, highlighting strengths drawn from their actual background.)

EXPERIENCE
(For each role found in the raw text, use this exact format:
Job Title — Organisation Name | Start Date – End Date
- Strong achievement or responsibility bullet starting with an action verb
- Strong achievement or responsibility bullet starting with an action verb
Use the actual job titles, employer names, and dates found in the uploaded text. Do not invent any details not present in it. If no work history is found, write "No work history found in uploaded document.")

EDUCATION
(For each qualification found in the raw text, use this exact format:
Degree or Qualification — Institution Name | Year
One entry per line. Use only details actually found in the uploaded text.)

KEY SKILLS
(A comma-separated list of skills relevant to the "${role}" role, drawn from the candidate's actual background.)

Do not add any commentary, preamble, or sign-off before or after the CV content.`

    } else {
      prompt = `You are an expert CV writer. Based on the rough notes below, write a polished, ATS-friendly CV tailored for a "${role}" role.

Candidate name: ${fullName || "(not provided)"}
About: ${about || "(not provided)"}
Experience: ${experience || "(not provided)"}
Education: ${education || "(not provided)"}
Skills: ${skills || "(not provided)"}

Use EXACTLY these section headers in ALL CAPS on their own line. No asterisks, no markdown, no bold, no hashes.

CONTACT
(Write the candidate's name on the first line if provided. Then add placeholder lines exactly as shown so they can fill them in:
[Your email address]
[Your phone number]
[Your city / address])

PROFESSIONAL SUMMARY
(2-3 sentences tailored to the "${role}" role, highlighting the candidate's strengths.)

EXPERIENCE
(For each role the candidate mentioned, use this exact format:
Job Title — Organisation Name | Start Date – End Date
- Strong achievement or responsibility bullet starting with an action verb
- Strong achievement or responsibility bullet starting with an action verb
If the candidate gave minimal detail, write reasonable achievement-oriented bullets. If they did not provide an organisation name or dates, use [Company Name] and [Year] as placeholders — do not invent specific details.)

EDUCATION
(For each qualification, use this exact format:
Degree or Qualification — Institution Name | Year
If institution or year was not provided, use [Institution] or [Year] as placeholders.)

KEY SKILLS
(A comma-separated list of skills relevant to the "${role}" role, refined from what the candidate provided.)

Do not add any commentary, preamble, or sign-off before or after the CV content.`
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