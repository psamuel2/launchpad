import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { vacancyId, applicationEmail, jobTitle, company, cvUrl, note, applicantName } = await req.json()

    if (!cvUrl) return NextResponse.json({ error: "No CV provided" }, { status: 400 })

    // Save to Supabase (ignore duplicate)
    const { error: dbError } = await supabase.from("applications").insert({
      vacancy_id: vacancyId,
      applicant_id: user.id,
      cv_url: cvUrl,
      note: note || null,
    })
    if (dbError && dbError.code !== "23505") {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Send email if there's an application email
    if (applicationEmail) {
      await resend.emails.send({
        from: "LaunchPad <onboarding@resend.dev>",
        to: applicationEmail,
        replyTo: user.email!,
        subject: `Application for ${jobTitle}${company ? ` at ${company}` : ""}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
            <h2>Job Application: ${jobTitle}</h2>
            ${company ? `<p style="color:#666">at ${company}</p>` : ""}
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
            <p>Dear Hiring Manager,</p>
            <p><strong>${applicantName || "The applicant"}</strong> is applying for the <strong>${jobTitle}</strong> position.</p>
            ${note ? `<p><em>"${note}"</em></p>` : ""}
            <p>Please find their CV attached. Reply to this email to reach them directly at ${user.email}.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
            <p style="color:#999;font-size:11px">Sent via LaunchPad</p>
          </div>
        `,
        attachments: [{ filename: `${(applicantName || "CV").replace(/\s+/g, "_")}_CV.pdf`, path: cvUrl }],
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}