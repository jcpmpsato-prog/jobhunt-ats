import type { T } from './i18n'

export function exportPDF(result: any, t: T) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210, margin = 20, cw = W - margin * 2
    const cyan: [number,number,number] = [0, 229, 255]
    const dark: [number,number,number] = [5, 9, 18]
    const white: [number,number,number] = [255, 255, 255]
    const muted: [number,number,number] = [90, 112, 138]
    const green: [number,number,number] = [16, 217, 160]
    const red: [number,number,number] = [248, 113, 113]
    const gold: [number,number,number] = [251, 191, 36]

    doc.setFillColor(...dark); doc.rect(0, 0, 210, 297, 'F')
    doc.setFillColor(8, 13, 26); doc.rect(0, 0, 210, 22, 'F')
    doc.setTextColor(...cyan); doc.setFontSize(14); doc.setFont('helvetica', 'bold')
    doc.text('ATS ANALYZER', margin, 14)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    doc.setTextColor(...muted); doc.text('AI · POWERED', margin + 58, 14)
    doc.text(new Date().toLocaleDateString(), W - margin, 14, { align: 'right' })

    let y = 34
    doc.setTextColor(...white); doc.setFontSize(18); doc.setFont('helvetica', 'bold')
    doc.text((result.jobTitle || 'Análise ATS').slice(0, 50), margin, y); y += 10

    const scoreColor = result.score >= 70 ? green : result.score >= 50 ? gold : red
    doc.setFillColor(...scoreColor); doc.roundedRect(margin, y, 40, 18, 3, 3, 'F')
    doc.setTextColor(0, 0, 0); doc.setFontSize(20); doc.setFont('helvetica', 'bold')
    doc.text(result.score + '%', margin + 20, y + 12, { align: 'center' })
    doc.setFontSize(9); doc.setTextColor(...muted); doc.text(t.compatibility, margin + 46, y + 5)
    const statusLabel = result.score >= 70 ? t.statusHigh : result.score >= 50 ? t.statusMid : t.statusLow
    doc.setTextColor(...scoreColor); doc.setFont('helvetica', 'bold'); doc.text(statusLabel, margin + 46, y + 12)
    y += 26

    doc.setDrawColor(...cyan); doc.setLineWidth(0.3); doc.line(margin, y, W - margin, y); y += 8
    doc.setTextColor(...cyan); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text('MÉTRICAS DE ADERÊNCIA', margin, y); y += 6

    const metrics = [
      { label: t.requirements, val: result.metrics.requirements.val, total: 40, color: result.metrics.requirements.color },
      { label: t.experience, val: result.metrics.experience.val, total: 30, color: result.metrics.experience.color },
      { label: t.terms, val: result.metrics.terms.val, total: 20, color: result.metrics.terms.color },
      { label: t.education, val: result.metrics.education.val, total: 10, color: result.metrics.education.color },
    ]
    const colW = cw / 2
    metrics.forEach((m, i) => {
      const col = i % 2; const row = Math.floor(i / 2)
      const mx = margin + col * colW; const my = y + row * 22
      const pct = Math.round((m.val / m.total) * 100)
      const mc: [number,number,number] = m.color === 'green' ? green : m.color === 'gold' ? gold : red
      doc.setTextColor(...white); doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text(m.label, mx, my + 4)
      doc.setTextColor(...mc); doc.setFontSize(9); doc.text(m.val+'/'+m.total+' ('+pct+'%)', mx + colW - 4, my + 4, { align: 'right' })
      doc.setFillColor(20, 34, 62); doc.roundedRect(mx, my + 6, colW - 8, 3, 1, 1, 'F')
      doc.setFillColor(...mc); doc.roundedRect(mx, my + 6, (colW - 8) * pct / 100, 3, 1, 1, 'F')
    })
    y += metrics.length > 2 ? 50 : 30

    doc.setDrawColor(...cyan); doc.line(margin, y, W - margin, y); y += 8

    if (result.keywords) {
      doc.setTextColor(...cyan); doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('TERMOS PRESENTES', margin, y); y += 5
      doc.setTextColor(...green); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
      const pLines = doc.splitTextToSize((result.keywords.present || []).join(' · ') || '—', cw)
      doc.text(pLines.slice(0, 2), margin, y); y += pLines.slice(0, 2).length * 4 + 4
      doc.setTextColor(...cyan); doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('TERMOS AUSENTES', margin, y); y += 5
      doc.setTextColor(...red); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
      const mLines = doc.splitTextToSize((result.keywords.missing || []).join(' · ') || '—', cw)
      doc.text(mLines.slice(0, 2), margin, y); y += mLines.slice(0, 2).length * 4 + 6
    }

    doc.setDrawColor(...cyan); doc.line(margin, y, W - margin, y); y += 8

    if (result.alerts?.length > 0) {
      doc.setTextColor(...red); doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('PONTOS DE ATENÇÃO', margin, y); y += 5
      result.alerts.slice(0, 3).forEach((a: any) => {
        doc.setTextColor(...muted); doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.text(a.num + '  ', margin, y + 3)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...white)
        const lines = doc.splitTextToSize(a.text, cw - 20)
        doc.text(lines.slice(0, 2), margin + 20, y + 3); y += lines.slice(0, 2).length * 4 + 4
      })
      y += 4
    }

    if (result.optimizerSuggestion) {
      doc.setDrawColor(...cyan); doc.line(margin, y, W - margin, y); y += 8
      doc.setTextColor(...cyan); doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('RESUMO PROFISSIONAL OTIMIZADO', margin, y); y += 5
      doc.setTextColor(...white); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
      const oLines = doc.splitTextToSize(result.optimizerSuggestion, cw)
      doc.text(oLines.slice(0, 8), margin, y)
    }

    doc.setFillColor(8, 13, 26); doc.rect(0, 285, 210, 12, 'F')
    doc.setTextColor(...muted); doc.setFontSize(7)
    doc.text('ATS ANALYZER · AI POWERED · jobhunt-ats.netlify.app', W / 2, 292, { align: 'center' })
    doc.save('ATS_Report_' + (result.jobTitle || 'analysis').replace(/[^a-z0-9]/gi, '_').slice(0, 30) + '.pdf')
  })
}
