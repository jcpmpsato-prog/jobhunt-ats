'use client'
import { useState, useEffect } from 'react'
import Icon from './Icon'
import { claudeRewriteCV } from '../lib/analyzer'
import type { T } from '../lib/i18n'

interface RewriteModalProps {
  isOpen: boolean
  onClose: () => void
  t: T
  cvText: string
  jdText: string
  missingKeywords: string[]
  apiKey: string
  lang: string
}

export default function RewriteModal({ isOpen, onClose, t, cvText, jdText, missingKeywords, apiKey, lang }: RewriteModalProps) {
  const [loading, setLoading] = useState(false)
  const [rewrite, setRewrite] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (isOpen && apiKey && !rewrite && !loading) {
      setLoading(true); setError(null)
      claudeRewriteCV(cvText, jdText, missingKeywords, lang, apiKey)
        .then(r => { setRewrite(r); setLoading(false) })
        .catch(e => { setError(e.message); setLoading(false) })
    }
    if (!isOpen) { setRewrite(null); setError(null) }
  }, [isOpen])

  if (!isOpen) return null

  const copySection = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const sections: [string, string][] = [
    ['summary', t.rwSummary],
    ['experience', t.rwExperience],
    ['skills', t.rwSkills],
    ['keywords', t.rwKeywords],
    ['checklist', t.rwChecklist],
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <div className="modal-head">
          <div className="modal-icon"><Icon name="edit" size={20} /></div>
          <div className="modal-text">
            <div className="modal-tag">CLAUDE AI</div>
            <h3 className="modal-title">{t.rewriteTitle}</h3>
            <p className="modal-desc">{t.rewriteDesc}</p>
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-body">
          {!apiKey && <div className="rewrite-no-key">{t.rewriteNoKey}<br /><a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com</a></div>}
          {apiKey && loading && (
            <div className="rewrite-loading">
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              <div className="rewrite-loading-text">{t.rewriteLoading}</div>
            </div>
          )}
          {apiKey && error && <div className="rewrite-no-key" style={{ color: 'var(--red)' }}>Erro: {error}</div>}
          {apiKey && rewrite && (
            <div className="rewrite-sections">
              {sections.filter(([key]) => rewrite[key]).map(([key, label]) => (
                <div key={key} className="rewrite-section-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div className="rewrite-section-label">{label}</div>
                    <button className={`btn-copy ${copied === key ? 'copied' : ''}`}
                      style={{ fontSize: 11, padding: '5px 10px' }}
                      onClick={() => copySection(key, rewrite[key])}>
                      <Icon name={copied === key ? 'check' : 'copy'} size={12} />
                      {copied === key ? t.copied : t.copyText}
                    </button>
                  </div>
                  <div className="rewrite-section-text">{rewrite[key]}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>{t.close}</button>
        </div>
      </div>
    </div>
  )
}
