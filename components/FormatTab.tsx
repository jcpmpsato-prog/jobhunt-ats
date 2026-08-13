'use client'
import { useRef, useState } from 'react'
import Icon from './Icon'
import { extractText, formatFileSize } from '../lib/fileExtraction'
import { claudeFormatCV, downloadDocx, downloadPdfCv, type FormatResult } from '../lib/formatCv'

const S = {
  pt: {
    tag: 'FORMATAÇÃO AUTOMÁTICA DE CV · IA',
    title: 'Deixe seu currículo no formato que o mercado pede',
    desc: 'A IA audita a estrutura do seu CV, corrige o formato para passar em qualquer ATS e gera o documento pronto em Word e PDF — legível para recrutador, sistema e gestor.',
    cvLabel: 'SEU CURRÍCULO', jdLabel: 'VAGA-ALVO (OPCIONAL)',
    cvPlaceholder: 'Cole o texto do seu currículo aqui, ou faça upload do arquivo...',
    jdPlaceholder: 'Cole a vaga para otimizar os termos do CV para ela (opcional)...',
    upload: 'Upload PDF/Word', run: 'Analisar e Formatar CV',
    running: 'Formatando com IA...',
    noKey: 'Configure sua Anthropic API Key na aba Configuração para usar esta função.',
    issuesTitle: 'Auditoria de formato', issuesTag: 'PROBLEMAS ENCONTRADOS E CORRIGIDOS',
    fixLabel: 'Correção aplicada',
    previewTitle: 'CV formatado', previewTag: 'PADRÃO ATS · PRONTO PARA USO',
    downloadDocx: 'Baixar Word (.docx)', downloadPdf: 'Baixar PDF',
    extracting: 'Extraindo texto...',
    severity: { alta: 'ALTA', média: 'MÉDIA', baixa: 'BAIXA', high: 'ALTA', medium: 'MÉDIA', low: 'BAIXA' } as Record<string, string>,
  },
  en: {
    tag: 'AUTOMATED CV FORMATTING · AI',
    title: 'Get your resume into the format the market expects',
    desc: 'AI audits your CV structure, fixes the format to pass any ATS and generates a ready-to-use document in Word and PDF — readable for recruiters, systems and hiring managers.',
    cvLabel: 'YOUR RESUME', jdLabel: 'TARGET JOB (OPTIONAL)',
    cvPlaceholder: 'Paste your resume text here, or upload the file...',
    jdPlaceholder: 'Paste the job to optimize CV terms for it (optional)...',
    upload: 'Upload PDF/Word', run: 'Analyze & Format CV',
    running: 'Formatting with AI...',
    noKey: 'Set your Anthropic API Key in the Config tab to use this feature.',
    issuesTitle: 'Format audit', issuesTag: 'ISSUES FOUND AND FIXED',
    fixLabel: 'Fix applied',
    previewTitle: 'Formatted CV', previewTag: 'ATS STANDARD · READY TO USE',
    downloadDocx: 'Download Word (.docx)', downloadPdf: 'Download PDF',
    extracting: 'Extracting text...',
    severity: { alta: 'HIGH', média: 'MEDIUM', baixa: 'LOW', high: 'HIGH', medium: 'MEDIUM', low: 'LOW' } as Record<string, string>,
  },
}

const sevColor: Record<string, string> = { ALTA: 'var(--red)', HIGH: 'var(--red)', MÉDIA: '#d97706', MEDIUM: '#d97706', BAIXA: 'var(--green)', LOW: 'var(--green)' }

export default function FormatTab({ apiKey, lang }: { apiKey: string; lang: string }) {
  const s = S[(lang === 'pt' ? 'pt' : 'en') as 'pt' | 'en']
  const [cvText, setCvText] = useState('')
  const [jdText, setJdText] = useState('')
  const [fileName, setFileName] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FormatResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (f: File | undefined | null) => {
    if (!f) return
    setExtracting(true); setError(null)
    try {
      const text = await extractText(f)
      setCvText(text)
      setFileName(`${f.name} · ${formatFileSize(f.size)}`)
    } catch (e: any) { setError(e.message) }
    setExtracting(false)
  }

  const run = async () => {
    if (!apiKey) { setError(s.noKey); return }
    if (cvText.trim().length < 100) return
    setLoading(true); setError(null); setResult(null)
    try {
      const r = await claudeFormatCV(cvText, jdText, lang, apiKey)
      setResult(r)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const cv = result?.cv

  return (
    <div>
      <div className="ai-card" style={{ marginBottom: 16 }}>
        <div className="card-tag" style={{ marginBottom: 8 }}>{s.tag}</div>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--text-bright)', marginBottom: 6 }}>{s.title}</h2>
        <p style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6, marginBottom: 18, maxWidth: 640 }}>{s.desc}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em' }}>{s.cvLabel}</label>
            <textarea value={cvText} onChange={e => { setCvText(e.target.value); setFileName('') }} placeholder={s.cvPlaceholder} rows={10}
              style={{ width: '100%', padding: 12, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 12, marginTop: 4, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <button onClick={() => inputRef.current?.click()} className="btn-feature cyan" type="button">
                <Icon name="upload" size={13} /> {s.upload}
              </button>
              {extracting && <span style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 600 }}>{s.extracting}</span>}
              {fileName && !extracting && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>✓ {fileName}</span>}
              <input ref={inputRef} type="file" accept=".pdf,.docx,.doc,.txt" hidden onChange={e => handleFile(e.target.files?.[0])} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em' }}>{s.jdLabel}</label>
            <textarea value={jdText} onChange={e => setJdText(e.target.value)} placeholder={s.jdPlaceholder} rows={10}
              style={{ width: '100%', padding: 12, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 12, marginTop: 4, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }} />
          </div>
        </div>

        <button onClick={run} disabled={loading || extracting || cvText.trim().length < 100} className="btn-adapt-primary" style={{ opacity: loading || cvText.trim().length < 100 ? 0.6 : 1 }}>
          <Icon name="sparkles" size={14} /> {loading ? s.running : s.run}
        </button>
        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 10 }}>{error}</div>}
      </div>

      {loading && (
        <div className="ai-card rewrite-loading">
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <div className="rewrite-loading-text">{s.running}</div>
        </div>
      )}

      {result && (
        <>
          <div className="ai-card gap-card" style={{ marginBottom: 16 }}>
            <div className="section-head">
              <div className="section-icon-box icon-gold"><Icon name="alert" size={18} /></div>
              <div>
                <div className="section-cat keywords-cat">{s.issuesTag}</div>
                <div className="section-title">{s.issuesTitle}</div>
              </div>
            </div>
            <div className="gap-list">
              {(result.formatIssues || []).map((iss, i) => {
                const sev = s.severity[iss.severity] || String(iss.severity).toUpperCase()
                return (
                  <div key={i} className="gap-item" style={{ borderColor: 'var(--border)' , background: 'var(--bg2)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: sevColor[sev] || 'var(--muted)' }}>● {sev}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-bright)' }}>{iss.issue}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--muted2)', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓ {s.fixLabel}: </span>{iss.fix}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {cv && (
            <div className="ai-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div className="section-head" style={{ margin: 0 }}>
                  <div className="section-icon-box icon-green"><Icon name="checkCircle" size={18} /></div>
                  <div>
                    <div className="section-cat strength-cat">{s.previewTag}</div>
                    <div className="section-title">{s.previewTitle}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn-adapt-primary" onClick={() => downloadDocx(cv, lang)}>
                    <Icon name="file" size={14} /> {s.downloadDocx}
                  </button>
                  <button className="btn-adapt-secondary" onClick={() => downloadPdfCv(cv, lang)}>
                    <Icon name="upload" size={14} /> {s.downloadPdf}
                  </button>
                </div>
              </div>

              {/* Preview do CV formatado */}
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '32px 36px', maxHeight: 560, overflowY: 'auto', boxShadow: 'inset 0 1px 3px rgba(30,37,50,0.04)' }}>
                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 800, color: 'var(--text-bright)' }}>{cv.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan)', marginTop: 2 }}>{cv.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted2)', marginTop: 4 }}>{cv.contact}</div>
                </div>
                <PreviewSection label={lang === 'pt' ? 'Resumo Profissional' : 'Professional Summary'}>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text)' }}>{cv.summary}</p>
                </PreviewSection>
                <PreviewSection label={lang === 'pt' ? 'Experiência Profissional' : 'Professional Experience'}>
                  {(cv.experience || []).map((exp, i) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-bright)' }}>
                        {exp.role} <span style={{ fontWeight: 500, color: 'var(--muted2)' }}>· {exp.company}{exp.location ? ' · ' + exp.location : ''}</span>
                      </div>
                      <div style={{ fontSize: 11.5, fontStyle: 'italic', color: 'var(--muted)', marginBottom: 5 }}>{exp.period}</div>
                      <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(exp.bullets || []).map((b, j) => <li key={j} style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text)' }}>{b}</li>)}
                      </ul>
                    </div>
                  ))}
                </PreviewSection>
                {cv.skills?.length > 0 && (
                  <PreviewSection label={lang === 'pt' ? 'Competências' : 'Skills'}>
                    {cv.skills.map((sk, i) => (
                      <p key={i} style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text)', marginBottom: 4 }}>
                        <strong style={{ color: 'var(--text-bright)' }}>{sk.category}:</strong> {(sk.items || []).join(' | ')}
                      </p>
                    ))}
                  </PreviewSection>
                )}
                {cv.education?.length > 0 && (
                  <PreviewSection label={lang === 'pt' ? 'Formação Acadêmica' : 'Education'}>
                    {cv.education.map((e, i) => (
                      <p key={i} style={{ fontSize: 12.5, color: 'var(--text)', marginBottom: 4 }}>
                        <strong style={{ color: 'var(--text-bright)' }}>{e.degree}</strong> · {e.institution}{e.year ? ' · ' + e.year : ''}
                      </p>
                    ))}
                  </PreviewSection>
                )}
                {cv.certifications?.length > 0 && (
                  <PreviewSection label={lang === 'pt' ? 'Certificações' : 'Certifications'}>
                    <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {cv.certifications.map((c, i) => <li key={i} style={{ fontSize: 12.5, color: 'var(--text)' }}>{c}</li>)}
                    </ul>
                  </PreviewSection>
                )}
                {cv.languages?.length > 0 && (
                  <PreviewSection label={lang === 'pt' ? 'Idiomas' : 'Languages'}>
                    <p style={{ fontSize: 12.5, color: 'var(--text)' }}>{cv.languages.join('  ·  ')}</p>
                  </PreviewSection>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PreviewSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-bright)', borderBottom: '2px solid var(--cyan)', paddingBottom: 3, marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  )
}
