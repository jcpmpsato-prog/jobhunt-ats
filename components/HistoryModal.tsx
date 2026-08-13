'use client'
import { useState, useEffect } from 'react'
import Icon from './Icon'
import { loadHistory, deleteFromHistory, clearHistory } from '../lib/analyzer'
import type { T } from '../lib/i18n'

interface HistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onLoad: (entry: any) => void
  t: T
}

export default function HistoryModal({ isOpen, onClose, onLoad, t }: HistoryModalProps) {
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) setHistory(loadHistory())
  }, [isOpen])

  if (!isOpen) return null

  const scoreColor = (s: number) => s >= 70 ? '#16a34a' : s >= 50 ? '#f59e0b' : '#ef4444'

  const del = (id: number) => { deleteFromHistory(id); setHistory(loadHistory()) }
  const clearAll = () => { clearHistory(); setHistory([]) }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-icon"><Icon name="briefcase" size={20} /></div>
          <div className="modal-text">
            <div className="modal-tag">HISTÓRICO</div>
            <h3 className="modal-title">{t.historyTitle}</h3>
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-body">
          {history.length === 0
            ? <div className="history-empty">{t.historyEmpty}</div>
            : (
              <div className="history-list">
                {history.map(h => (
                  <div key={h.id} className="history-item" onClick={() => { onLoad(h); onClose() }}>
                    <div className="history-score-badge" style={{
                      background: scoreColor(h.score) + '20', color: scoreColor(h.score),
                      border: `1px solid ${scoreColor(h.score)}50`,
                    }}>
                      {h.score}%
                    </div>
                    <div className="history-info">
                      <div className="history-job">{h.jobTitle}</div>
                      <div className="history-date">{new Date(h.timestamp).toLocaleString()}</div>
                    </div>
                    <button className="history-del" onClick={e => { e.stopPropagation(); del(h.id) }}>
                      <Icon name="close" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
        <div className="modal-foot">
          {history.length > 0 && (
            <button className="btn-ghost" onClick={clearAll} style={{ color: 'var(--red)' }}>{t.historyClear}</button>
          )}
          <button className="btn-ghost" onClick={onClose}>{t.close}</button>
        </div>
      </div>
    </div>
  )
}
