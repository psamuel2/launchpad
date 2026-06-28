"use client"

import { Document, Page, Text, View, StyleSheet, pdf, Font } from "@react-pdf/renderer"
import { ParsedCV } from "./parseCv"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 2,
  },
  roleLine: {
    fontSize: 12,
    color: "#444",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 16,
    marginBottom: 6,
    color: "#1d4ed8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  text: {
    fontSize: 10.5,
    lineHeight: 1.5,
    marginBottom: 3,
  },
  bullet: {
    fontSize: 10.5,
    lineHeight: 1.5,
    marginBottom: 4,
    paddingLeft: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginTop: 4,
    marginBottom: 4,
  },
})

function CVDocument({
  name,
  role,
  parsed,
}: {
  name: string
  role: string
  parsed: ParsedCV
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{name || "Your Name"}</Text>
        <Text style={styles.roleLine}>{role}</Text>
        <View style={styles.divider} />

        {parsed.summary && (
          <>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.text}>{parsed.summary}</Text>
          </>
        )}

        {parsed.experience.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Experience</Text>
            {parsed.experience.map((line, i) => (
              <Text key={i} style={styles.bullet}>
                {line.startsWith("-") ? line : `- ${line}`}
              </Text>
            ))}
          </>
        )}

        {parsed.education.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {parsed.education.map((line, i) => (
              <Text key={i} style={styles.text}>
                {line}
              </Text>
            ))}
          </>
        )}

        {parsed.skills && (
          <>
            <Text style={styles.sectionTitle}>Key Skills</Text>
            <Text style={styles.text}>{parsed.skills}</Text>
          </>
        )}
      </Page>
    </Document>
  )
}

export async function downloadCVAsPDF(name: string, role: string, parsed: ParsedCV) {
  const blob = await pdf(<CVDocument name={name} role={role} parsed={parsed} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${(name || "CV").replace(/\s+/g, "_")}_CV.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadCoverLetterAsPDF(name: string, letter: string) {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{name || "Your Name"}</Text>
        <View style={styles.divider} />
        <Text style={[styles.text, { marginTop: 12 }]}>{letter}</Text>
      </Page>
    </Document>
  )
  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${(name || "Cover").replace(/\s+/g, "_")}_Cover_Letter.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}