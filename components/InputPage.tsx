'use client'
import { useState, useRef } from 'react'
import Icon from './Icon'
import { extractText, formatFileSize } from '../lib/fileExtraction'
import type { T } from '../lib/i18n'

function parseJobUrl(value: string): URL | undefined {
  try {
    const url = new URL(value.trim())
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url
  } catch {
    return undefined
  }
}

interface InputPageProps {
  t: T
  lang: string
  onAnalyze: (cvText: string, jdText: string, apiKey: string, jobUrl?: string) => void
  apiKey: string
  setApiKey: (k: string) => void
  onGoFormat?: () => void
}

export default function InputPage({ t, lang, onAnalyze, apiKey, setApiKey, onGoFormat }: InputPageProps) {
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvText, setCvText] = useState('')
  const [cvMode, setCvMode] = useState<'upload' | 'paste'>('upload')
  const [cvDrag, setCvDrag] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [jdText, setJdText] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [reviewCv, setReviewCv] = useState(false)
  const pt = lang === 'pt'
  const source = parseJobUrl(jobUrl)
  const cvInputRef = useRef<HTMLInputElement>(null)

  const handleCvFile = async (f: File | null | undefined) => {
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { alert('Máximo 5MB'); return }
    setCvFile(f); setReviewCv(false); setExtracting(true); setExtractError(null); setCvText('')
    try {
      const text = await extractText(f)
      setCvText(text)
    } catch (err: any) {
      setExtractError(err.message || t.extractError)
    } finally {
      setExtracting(false)
    }
  }

  const removeFile = () => { setCvFile(null); setCvText(''); setExtractError(null) }
  const canRun = (!jobUrl.trim() || source) && cvText.trim().length >= 100 && jdText.trim().length >= 50

  return (
    <div>
      <div className="hero">
        <div className="hero-tag">{t.heroTag}</div>
        <h1 className="hero-title">
          {t.heroTitleA}<br />
          <span className="gradient">{t.heroTitleB}</span>
        </h1>
        <p className="hero-desc">{t.heroDesc}</p>
        <div className="hero-ctas">
          <button className="btn-hero-primary" onClick={() => document.getElementById('analyze-cards')?.scrollIntoView({ behavior: 'smooth' })}>
            <Icon name="target" size={16} />
            {(t as any).heroBtnAnalyze}
          </button>
          {onGoFormat && (
            <button className="btn-hero-secondary" onClick={onGoFormat}>
              <Icon name="file" size={16} />
              {(t as any).heroBtnFormat}
            </button>
          )}
        </div>
      </div>

      <div className="input-grid" id="analyze-cards">
        {/* CV Card */}
        <div className="ai-card input-card">
          <div className="ai-card-corner tl" /><div className="ai-card-corner tr" />
          <div className="ai-card-corner bl" /><div className="ai-card-corner br" />
          <div className="input-head">
            <div className="input-icon"><Icon name="file" size={18} /></div>
            <div>
              <div className="input-label">{t.cvLabel}</div>
              <div className="input-title">{t.cvTitle}</div>
            </div>
          </div>

          {cvMode === 'upload' && !cvFile && (
            <>
              <div
                className={`upload-zone ${cvDrag ? 'drag' : ''}`}
                onClick={() => cvInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setCvDrag(true) }}
                onDragLeave={() => setCvDrag(false)}
                onDrop={e => { e.preventDefault(); setCvDrag(false); handleCvFile(e.dataTransfer.files[0]) }}
              >
                <div className="upload-icon-glow"><Icon name="upload" size={28} /></div>
                <div className="upload-text">{t.uploadCV}</div>
                <div className="upload-subtext">{t.uploadCVSub}</div>
                <div className="upload-formats">
                  {t.formats.map((f, i) => <span key={i} className="format-chip">{f}</span>)}
                </div>
                <input ref={cvInputRef} type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: 'none' }}
                  onChange={e => handleCvFile(e.target.files?.[0])} />
              </div>
              <div className="cv-or-paste"><span>{t.or}</span></div>
              <button className="paste-link" onClick={() => setCvMode('paste')}>{t.pasteText} →</button>
            </>
          )}

          {cvMode === 'paste' && (
            <>
              <textarea className="text-input" placeholder={t.cvPastePlaceholder}
                value={cvText} onChange={e => setCvText(e.target.value)} />
              <div className="cv-or-paste"><span>{t.or}</span></div>
              <button className="paste-link" onClick={() => setCvMode('upload')}>← Upload arquivo</button>
            </>
          )}

          {cvFile && (
            <div className="file-loaded">
              <div className="file-loaded-head">
                <div className="file-loaded-icon"><Icon name="checkCircle" size={20} /></div>
                <div className="file-loaded-info">
                  <div className="file-loaded-name">{cvFile.name}</div>
                  <div className="file-loaded-stats">
                    <span>{formatFileSize(cvFile.size)}</span>
                    {cvText && <span>{Math.round(cvText.length / 1000)}k chars {t.extracted}</span>}
                  </div>
                </div>
                <button className="file-loaded-remove" onClick={removeFile}><Icon name="close" size={14} /></button>
              </div>
              {extracting && (
                <div className="extracting-status">
                  <div className="spinner" />
                  <div className="extracting-text">{t.extracting}</div>
                </div>
              )}
              {extractError && (
                <div className="extracting-status extracting-error">
                  <Icon name="alert" size={16} />
                  <div className="extracting-text">{extractError}</div>
                </div>
              )}
              {(cvText || reviewCv) && !extracting && (
                <div>
                  <button type="button" className="paste-link" aria-expanded={reviewCv}
                    onClick={() => setReviewCv(!reviewCv)}>
                    {reviewCv ? (pt ? 'Fechar revisão' : 'Close review') : (pt ? 'Revisar texto completo do CV' : 'Review full CV text')}
                  </button>
                  {reviewCv && <textarea className="text-input" aria-label={pt ? 'Texto extraído do CV' : 'Extracted CV text'}
                    value={cvText} onChange={e => setCvText(e.target.value)} />}
                </div>
              )}
            </div>
          )}
        </div>

        {/* JD Card */}
        <div className="ai-card input-card">
          <div className="ai-card-corner tl" /><div className="ai-card-corner tr" />
          <div className="ai-card-corner bl" /><div className="ai-card-corner br" />
          <div className="input-head">
            <div className="input-icon"><Icon name="briefcase" size={18} /></div>
            <div>
              <div className="input-label">{t.jdLabel}</div>
              <div className="input-title">{t.jdTitle}</div>
            </div>
          </div>
          <label htmlFor="job-url">{pt ? 'Link da vaga (opcional)' : 'Job link (optional)'}</label>
          <input id="job-url" className="text-input" style={{ minHeight: 0 }} type="url"
            value={jobUrl} placeholder="https://" onChange={e => setJobUrl(e.target.value)}
            aria-invalid={Boolean(jobUrl.trim() && !source)} aria-describedby="job-import-help" />
          <p id="job-import-help">
            {jobUrl.trim() && !source
              ? (pt ? 'Informe um link válido com http ou https.' : 'Enter a valid http or https link.')
              : (pt ? 'Abra o anúncio na plataforma e cole a descrição completa abaixo.' : 'Open the job posting and paste its full description below.')}
          </p>
          {source && <a className="paste-link" href={source.href} target="_blank" rel="noopener noreferrer">
            {pt ? 'Abrir anúncio' : 'Open job posting'} · {source.hostname}
          </a>}
          <textarea className="text-input" aria-label={pt ? 'Descrição completa da vaga' : 'Full job description'} placeholder={t.jdPlaceholder}
            value={jdText} onChange={e => setJdText(e.target.value)} />
        </div>
      </div>

      <div className="cta-section">
        <button className="btn-primary-big" disabled={!canRun} onClick={() => onAnalyze(cvText, jdText, apiKey, source?.href)}>
          <Icon name="zap" size={18} />
          {t.runAnalysis}
        </button>
      </div>
    </div>
  )
}
