import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY." }, { status: 500 })
    }

    const { vacancyText } = await req.json()

    if (!vacancyText?.trim()) {
      return NextResponse.json({ error: "No vacancy text provided." }, { status: 400 })
    }

    const prompt = `Extract the following details from this job vacancy text. Respond ONLY with a valid JSON object, no markdown, no backticks, no commentary.

JOB VACANCY TEXT:
"""
${vacancyText.slice(0, 5000)}
"""

Return exactly this JSON structure:
{
  "title": "job title or null",
  "company": "company name or null",
  "location": "location or null",
  "email": "application email address or null",
  "requirements": "key requirements and skills as a short paragraph or null"
}

Rules:
- For email: only include if there is a real email address in the text (e.g. hr@company.com). If no email, return null.
- For title: extract the exact job title mentioned
- For company: extract the company/organisation name if mentioned
- For requirements: summarise the key skills and experience required in 2-3 sentences
- Return null for any field you cannot find — never invent details`

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
      return NextResponse.json({ error: "Failed to parse vacancy." }, { status: 502 })
    }

    const data = await response.json()
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    try {
      const clean = raw.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(clean)
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ error: "Could not parse vacancy details." }, { status: 502 })
    }
  } catch (err) {
    console.error("parse-vacancy error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}