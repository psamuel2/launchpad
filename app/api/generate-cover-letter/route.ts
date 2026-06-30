import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing GEMINI_API_KEY. Add it in your Vercel project's Environment Variables." },
        { status: 500 }
      )
    }

    const { role, cvSummary, fullName } = await req.json()

    if (!role || !role.trim()) {
      return NextResponse.json({ error: "Role is required." }, { status: 400 })
    }

    const prompt = `Write a concise, professional cover letter (around 250-350 words) for ${fullName || "a candidate"} applying to a "${role}" role, based on this CV content:

${cvSummary || "(no CV content provided — write a strong general cover letter for this role)"}

Rules:
- Plain text only, no markdown symbols, no asterisks or hashes
- Use a standard cover letter structure: opening hook, 1-2 body paragraphs connecting their background to the role, closing call to action
- Do not invent a company name — use a professional placeholder like "your team" or "your organisation"
- Do not add any commentary before or after the letter itself
- End with:

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
      const errText = await response.text()
      console.error("Gemini API error:", errText)
      return NextResponse.json(
        { error: "Failed to generate cover letter. Please try again." },
        { status: 502 }
      )
    }

    const data = await response.json()
    const letter: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    if (!letter) {
      return NextResponse.json({ error: "AI returned an empty response." }, { status: 502 })
    }

    return NextResponse.json({ letter })
  } catch (err) {
    console.error("generate-cover-letter error:", err)
    return NextResponse.json({ error: "Something went wrong generating your cover letter." }, { status: 500 })
  }
}