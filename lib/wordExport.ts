"use client"

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx"
import { ParsedCV } from "./parseCv"

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadCVAsWord(name: string, role: string, parsed: ParsedCV) {
  const children: Paragraph[] = [
    new Paragraph({
      text: name || "Your Name",
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [new TextRun({ text: role, italics: true, color: "444444" })],
      spacing: { after: 300 },
    }),
  ]

  if (parsed.summary) {
    children.push(
      new Paragraph({ text: "Professional Summary", heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: parsed.summary, spacing: { after: 200 } })
    )
  }

  if (parsed.experience.length > 0) {
    children.push(new Paragraph({ text: "Experience", heading: HeadingLevel.HEADING_2 }))
    parsed.experience.forEach((line) => {
      children.push(
        new Paragraph({
          text: line.replace(/^-\s*/, ""),
          bullet: { level: 0 },
        })
      )
    })
  }

  if (parsed.education.length > 0) {
    children.push(new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2 }))
    parsed.education.forEach((line) => {
      children.push(new Paragraph({ text: line }))
    })
  }

  if (parsed.skills) {
    children.push(
      new Paragraph({ text: "Key Skills", heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: parsed.skills })
    )
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  })

  const blob = await Packer.toBlob(doc)
  saveBlob(blob, `${(name || "CV").replace(/\s+/g, "_")}_CV.docx`)
}

export async function downloadCoverLetterAsWord(name: string, letter: string) {
  const paragraphs = letter
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .map((line) => new Paragraph({ text: line, spacing: { after: 200 } }))

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: name || "Your Name", heading: HeadingLevel.TITLE }),
          ...paragraphs,
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveBlob(blob, `${(name || "Cover").replace(/\s+/g, "_")}_Cover_Letter.docx`)
}