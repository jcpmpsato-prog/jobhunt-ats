'use client'
import { useState } from 'react'
import Icon from './Icon'
import type { T } from '../lib/i18n'

interface AdaptModalProps {
  isOpen: boolean
  onClose: () => void
  t: T
  suggestion: string
  integratedTerms: string[]
}

export default function AdaptModal({ isOpen, onClose, t, suggestion, integratedTerms }: AdaptModalProps) {
  const [copied, setCopied] = useState(false)
  if (!isOpen) return null

  const copy = () => {
    navigator.clipboard.writeText(suggestion)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-icon"><Icon name="edit" size={20} /></div>
          <div className="modal-text">
            <div className="modal-tag">AI · OPTIMIZER</div>
            <h3 className="modal-title">{t.optimizerTitle}</h3>
            <p className="modal-desc">{t.optimizerDesc}</p>
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="rewrite-block">
            <div className="rewrite-tag">{t.optimizerTag}</div>
            <p className="rewrite-text">{suggestion}</p>
          </div>
          {integratedTerms?.length > 0 && (
            <div className="integrated-keywords">
              <div className="integrated-keywords-label">✦ {t.integratedKeywords}</div>
              <div className="tags-wrap">
                {integratedTerms.map((k, i) => <span key={i} className="tag tag-green">{k}</span>)}
              </div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>{t.close}</button>
          <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={copy}>
            <Icon name={copied ? 'check' : 'copy'} size={14} />
            {copied ? t.copied : t.copyText}
          </button>
        </div>
      </div>
    </div>
  )
}
