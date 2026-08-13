// ============== FORMAT CV — analysis + document generation ==============

export interface FormattedCV {
  name: string
  title: string
  contact: string
  summary: string
  experience: { role: string; company: string; period: string; location?: string; bullets: string[] }[]
  skills: { category: string; items: string[] }[]
  education: { degree: string; institution: string; year?: string }[]
  certifications: string[]
  languages: string[]
}

export interface FormatIssue { severity: 'alta' | 'média' | 'baixa' | 'high' | 'medium' | 'low'; issue: string; fix: string }

export interface FormatResult { formatIssues: FormatIssue[]; cv: FormattedCV }

export async function claudeFormatCV(cvText: string, jdText: string, lang: string, apiKey: string): Promise<FormatResult> {
  const prompt = lang === 'pt'
    ? `Você é um especialista sênior em formatação de currículos para ATS (Gupy/GAIA, Workday, SAP SuccessFactors, Greenhouse) e em legibilidade para recrutadores brasileiros.

TAREFA 1 — AUDITORIA DE FORMATO: identifique problemas de FORMATO/ESTRUTURA no currículo abaixo (não de conteúdo): ordem das seções, seções faltantes ou redundantes, dados pessoais desnecessários (CPF, RG, idade, foto, estado civil, endereço completo), datas inconsistentes, formatação que quebra ATS (tabelas, colunas, cabeçalhos), densidade de texto, tamanho.

TAREFA 2 — REESTRUTURAÇÃO: reorganize o conteúdo REAL do currículo no formato padrão-ouro ATS:
- Ordem: Nome/Título → Contato → Resumo → Experiência (mais recente primeiro) → Competências → Formação → Certificações → Idiomas
- Bullets de experiência: verbo de ação no início + resultado + contexto. NUNCA invente números; onde faltar métrica, use o marcador [quantificar].
- Resumo: 3-4 linhas com cargo-alvo + anos de experiência + resultados.
- Competências agrupadas em 5-8 categorias.
- Máximo 8-12 certificações mais relevantes.
${jdText ? `\nVAGA-ALVO (otimize termos para ela):\n${jdText.slice(0, 2000)}` : ''}

CURRÍCULO ORIGINAL:
${cvText.slice(0, 9000)}

Responda APENAS com JSON válido, sem markdown:
{
  "formatIssues": [{"severity": "alta|média|baixa", "issue": "<problema encontrado>", "fix": "<como foi corrigido na versão formatada>"}],
  "cv": {
    "name": "<nome completo>",
    "title": "<título profissional alvo>",
    "contact": "<cidade/UF · telefone · email · linkedin, em uma linha>",
    "summary": "<resumo profissional 3-4 linhas>",
    "experience": [{"role": "<cargo>", "company": "<empresa>", "period": "<mês/ano - mês/ano>", "location": "<cidade>", "bullets": ["<bullet>"]}],
    "skills": [{"category": "<categoria>", "items": ["<item>"]}],
    "education": [{"degree": "<curso>", "institution": "<instituição>", "year": "<ano>"}],
    "certifications": ["<certificação>"],
    "languages": ["<idioma — nível>"]
  }
}`
    : `You are a senior expert in resume formatting for ATS (Workday, SAP SuccessFactors, Greenhouse, Lever) and recruiter readability.

TASK 1 — FORMAT AUDIT: identify FORMAT/STRUCTURE problems in the resume below (not content): section order, missing or redundant sections, unnecessary personal data (photo, age, marital status, full address), inconsistent dates, ATS-breaking formatting (tables, columns, headers), text density, length.

TASK 2 — RESTRUCTURE: reorganize the REAL resume content into the gold-standard ATS format:
- Order: Name/Title → Contact → Summary → Experience (most recent first) → Skills → Education → Certifications → Languages
- Experience bullets: action verb first + result + context. NEVER invent numbers; where a metric is missing, use the [quantify] marker.
- Summary: 3-4 lines with target role + years of experience + results.
- Skills grouped in 5-8 categories.
- Max 8-12 most relevant certifications.
${jdText ? `\nTARGET JOB (optimize terms for it):\n${jdText.slice(0, 2000)}` : ''}

ORIGINAL RESUME:
${cvText.slice(0, 9000)}

Respond ONLY with valid JSON, no markdown:
{
  "formatIssues": [{"severity": "high|medium|low", "issue": "<problem found>", "fix": "<how it was fixed in the formatted version>"}],
  "cv": {
    "name": "<full name>",
    "title": "<target professional title>",
    "contact": "<city · phone · email · linkedin, one line>",
    "summary": "<professional summary 3-4 lines>",
    "experience": [{"role": "<role>", "company": "<company>", "period": "<mo/yr - mo/yr>", "location": "<city>", "bullets": ["<bullet>"]}],
    "skills": [{"category": "<category>", "items": ["<item>"]}],
    "education": [{"degree": "<degree>", "institution": "<institution>", "year": "<year>"}],
    "certifications": ["<certification>"],
    "languages": ["<language — level>"]
  }
}`

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] })
  })
  if (!resp.ok) throw new Error('API error: ' + resp.status)
  const data = await resp.json()
  const text = data.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Resposta inválida da API')
  return JSON.parse(match[0].replace(/```json|```/g, '').trim())
}

// ============== DOCX GENERATION ==============
export async function downloadDocx(cv: FormattedCV, lang: string) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = await import('docx')

  const L = lang === 'pt'
    ? { summary: 'RESUMO PROFISSIONAL', experience: 'EXPERIÊNCIA PROFISSIONAL', skills: 'COMPETÊNCIAS', education: 'FORMAÇÃO ACADÊMICA', certifications: 'CERTIFICAÇÕES', languages: 'IDIOMAS' }
    : { summary: 'PROFESSIONAL SUMMARY', experience: 'PROFESSIONAL EXPERIENCE', skills: 'SKILLS', education: 'EDUCATION', certifications: 'CERTIFICATIONS', languages: 'LANGUAGES' }

  const sectionTitle = (text: string) => new Paragraph({
    spacing: { before: 280, after: 120 },
    border: { bottom: { color: '1a91f0', size: 6, style: BorderStyle.SINGLE, space: 2 } },
    children: [new TextRun({ text, bold: true, size: 24, font: 'Arial', color: '1e2532' })],
  })
  const body = (text: string, opts: any = {}) => new Paragraph({
    spacing: { after: opts.after ?? 80 },
    children: [new TextRun({ text, size: 21, font: 'Arial', color: '384357', ...opts.run })],
    ...(opts.bullet ? { bullet: { level: 0 } } : {}),
  })

  const children: any[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: cv.name, bold: true, size: 40, font: 'Arial', color: '1e2532' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: cv.title, bold: true, size: 24, font: 'Arial', color: '1a91f0' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: cv.contact, size: 19, font: 'Arial', color: '5b6b84' })] }),
    sectionTitle(L.summary),
    body(cv.summary, { after: 120 }),
    sectionTitle(L.experience),
  ]

  for (const exp of cv.experience || []) {
    children.push(new Paragraph({
      spacing: { before: 140, after: 30 },
      children: [
        new TextRun({ text: exp.role, bold: true, size: 22, font: 'Arial', color: '1e2532' }),
        new TextRun({ text: `  ·  ${exp.company}${exp.location ? ' · ' + exp.location : ''}`, size: 21, font: 'Arial', color: '5b6b84' }),
      ],
    }))
    children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: exp.period, italics: true, size: 19, font: 'Arial', color: '8494ab' })] }))
    for (const b of exp.bullets || []) children.push(body(b, { bullet: true, after: 50 }))
  }

  if (cv.skills?.length) {
    children.push(sectionTitle(L.skills))
    for (const s of cv.skills) children.push(new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: s.category + ': ', bold: true, size: 21, font: 'Arial', color: '1e2532' }),
        new TextRun({ text: (s.items || []).join(' | '), size: 21, font: 'Arial', color: '384357' }),
      ],
    }))
  }
  if (cv.education?.length) {
    children.push(sectionTitle(L.education))
    for (const e of cv.education) children.push(new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: e.degree, bold: true, size: 21, font: 'Arial', color: '1e2532' }),
        new TextRun({ text: `  ·  ${e.institution}${e.year ? ' · ' + e.year : ''}`, size: 21, font: 'Arial', color: '5b6b84' }),
      ],
    }))
  }
  if (cv.certifications?.length) {
    children.push(sectionTitle(L.certifications))
    for (const c of cv.certifications) children.push(body(c, { bullet: true, after: 40 }))
  }
  if (cv.languages?.length) {
    children.push(sectionTitle(L.languages))
    children.push(body(cv.languages.join('  ·  '), { after: 80 }))
  }

  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 850, bottom: 850, left: 1000, right: 1000 } } }, children }] })
  const blob = await Packer.toBlob(doc)
  triggerDownload(blob, `CV_${sanitize(cv.name)}.docx`)
}

// ============== PDF GENERATION ==============
export async function downloadPdfCv(cv: FormattedCV, lang: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, H = 297, margin = 18, cw = W - margin * 2
  let y = 20

  const L = lang === 'pt'
    ? { summary: 'RESUMO PROFISSIONAL', experience: 'EXPERIÊNCIA PROFISSIONAL', skills: 'COMPETÊNCIAS', education: 'FORMAÇÃO ACADÊMICA', certifications: 'CERTIFICAÇÕES', languages: 'IDIOMAS' }
    : { summary: 'PROFESSIONAL SUMMARY', experience: 'PROFESSIONAL EXPERIENCE', skills: 'SKILLS', education: 'EDUCATION', certifications: 'CERTIFICATIONS', languages: 'LANGUAGES' }

  const ensureSpace = (needed: number) => { if (y + needed > H - 16) { doc.addPage(); y = 20 } }
  const sectionTitle = (text: string) => {
    ensureSpace(14)
    y += 4
    doc.setTextColor(30, 37, 50); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text(text, margin, y)
    y += 1.5
    doc.setDrawColor(26, 145, 240); doc.setLineWidth(0.5); doc.line(margin, y, W - margin, y)
    y += 5
  }
  const wrapped = (text: string, size: number, color: [number, number, number], opts: { bold?: boolean; italic?: boolean; indent?: number; lineH?: number } = {}) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', opts.bold ? 'bold' : opts.italic ? 'italic' : 'normal')
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, cw - (opts.indent ?? 0))
    for (const line of lines) {
      ensureSpace(6)
      doc.text(line, margin + (opts.indent ?? 0), y)
      y += opts.lineH ?? 4.6
    }
  }

  // Header
  doc.setTextColor(30, 37, 50); doc.setFontSize(20); doc.setFont('helvetica', 'bold')
  doc.text(cv.name, W / 2, y, { align: 'center' }); y += 7
  doc.setTextColor(26, 145, 240); doc.setFontSize(12)
  doc.text(cv.title, W / 2, y, { align: 'center' }); y += 6
  doc.setTextColor(91, 107, 132); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(cv.contact, W / 2, y, { align: 'center' }); y += 6

  sectionTitle(L.summary)
  wrapped(cv.summary, 9.5, [56, 67, 87]); y += 2

  sectionTitle(L.experience)
  for (const exp of cv.experience || []) {
    ensureSpace(16)
    wrapped(`${exp.role}  ·  ${exp.company}${exp.location ? ' · ' + exp.location : ''}`, 10, [30, 37, 50], { bold: true, lineH: 5 })
    wrapped(exp.period, 8.5, [132, 148, 171], { italic: true, lineH: 4.4 })
    y += 0.6
    for (const b of exp.bullets || []) {
      const dotY = y
      ensureSpace(6)
      doc.setFillColor(26, 145, 240); doc.circle(margin + 1.2, dotY - 1.2, 0.7, 'F')
      wrapped(b, 9.5, [56, 67, 87], { indent: 4.5 })
      y += 0.6
    }
    y += 2.4
  }

  if (cv.skills?.length) {
    sectionTitle(L.skills)
    for (const s of cv.skills) { wrapped(`${s.category}: ${(s.items || []).join(' | ')}`, 9.5, [56, 67, 87]); y += 1 }
  }
  if (cv.education?.length) {
    sectionTitle(L.education)
    for (const e of cv.education) { wrapped(`${e.degree}  ·  ${e.institution}${e.year ? ' · ' + e.year : ''}`, 9.5, [56, 67, 87]); y += 1 }
  }
  if (cv.certifications?.length) {
    sectionTitle(L.certifications)
    for (const c of cv.certifications) {
      ensureSpace(6)
      doc.setFillColor(26, 145, 240); doc.circle(margin + 1.2, y - 1.2, 0.7, 'F')
      wrapped(c, 9.5, [56, 67, 87], { indent: 4.5 })
    }
  }
  if (cv.languages?.length) {
    sectionTitle(L.languages)
    wrapped(cv.languages.join('  ·  '), 9.5, [56, 67, 87])
  }

  doc.save(`CV_${sanitize(cv.name)}.pdf`)
}

function sanitize(name: string) { return (name || 'formatado').replace(/[^a-z0-9]/gi, '_').slice(0, 40) }

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
