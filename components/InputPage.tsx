'use client'
import { useState, useRef } from 'react'
import Icon from './Icon'
import { extractText, formatFileSize } from '../lib/fileExtraction'
import type { T } from '../lib/i18n'

interface InputPageProps {
  t: T
  lang: string
  onAnalyze: (cvText: string, jdText: string, apiKey: string) => void
  apiKey: string
  setApiKey: (k: string) => void
}

export default function InputPage({ t, lang, onAnalyze, apiKey, setApiKey }: InputPageProps) {
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvText, setCvText] = useState('')
  const [cvMode, setCvMode] = useState<'upload' | 'paste'>('upload')
  const [cvDrag, setCvDrag] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [jdText, setJdText] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const cvInputRef = useRef<HTMLInputElement>(null)

  const handleCvFile = async (f: File | null | undefined) => {
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { alert('Máximo 5MB'); return }
    setCvFile(f); setExtracting(true); setExtractError(null); setCvText('')
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
  const canRun = cvText.trim().length >= 100 && jdText.trim().length >= 50

  return (
    <div>
      <div className="hero">
        <div className="hero-tag">{t.heroTag}</div>
        <h1 className="hero-title">
          {t.heroTitleA}<br />
          <span className="gradient">{t.heroTitleB}</span>
        </h1>
        <p className="hero-desc">{t.heroDesc}</p>
      </div>

      <div className="input-grid">
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
              {cvText && !extracting && (
                <div className="cv-preview">{cvText.slice(0, 800)}{cvText.length > 800 ? '...' : ''}</div>
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
          <textarea className="text-input" placeholder={t.jdPlaceholder}
            value={jdText} onChange={e => setJdText(e.target.value)} />
        </div>
      </div>

      <div className="cta-section">
        <button className="btn-primary-big" disabled={!canRun} onClick={() => onAnalyze(cvText, jdText, apiKey)}>
          <Icon name="zap" size={18} />
          {t.runAnalysis}
        </button>

        <div className="config-collapsed">
          <button className="config-toggle" onClick={() => setShowConfig(!showConfig)}>
            <span className="config-toggle-left">
              <Icon name="cpu" size={14} />
              {t.optionalConfig}
              {apiKey && <span style={{ color: 'var(--green)', fontSize: 11, fontFamily: 'Inter' }}>● ATIVO</span>}
            </span>
            <Icon name="chevron" size={14} />
          </button>
          {showConfig && (
            <div className="config-body">
              <label>{t.apiKeyLabel}</label>
              <input type="password" placeholder="sk-ant-..." value={apiKey}
                onChange={e => setApiKey(e.target.value)} />
              <div className="config-help">
                {t.apiKeyHelp}{' '}
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
