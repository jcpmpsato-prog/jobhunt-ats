'use client'
import { useState } from 'react'
import Icon from './Icon'
import Donut from './Donut'
import AdaptModal from './AdaptModal'
import HistoryModal from './HistoryModal'
import RewriteModal from './RewriteModal'
import { claudeAnalyze, saveToHistory } from '../lib/analyzer'
import { exportPDF } from '../lib/exportPdf'
import type { T } from '../lib/i18n'

const COLORS = { red: '#ef4444', green: '#16a34a', gold: '#f59e0b', cyan: '#1a91f0' }

function getScoreColor(s: number) { return s < 50 ? '#ef4444' : s < 70 ? '#f59e0b' : '#16a34a' }
function getScoreClass(s: number) { return s < 50 ? 'low' : s < 70 ? 'mid' : 'high' }

function MiniMetric({ value, total, color, label }: { value: number; total: number; color: string; label: string }) {
  const pct = (value / total) * 100
  return (
    <div className="mini-stat">
      <Donut pct={pct} size={64} stroke={4} color={color} showValue value={value} valueSize={17} />
      <div className="mini-stat-label">{label}</div>
    </div>
  )
}

function MetricCard({ data, icon, t }: { data: any; icon: string; t: T }) {
  const color = COLORS[data.color as keyof typeof COLORS] ?? '#1a91f0'
  return (
    <div className="metric-card">
      <div className="metric-head">
        <div>
          <div className="metric-cat">{data.label.toUpperCase()}</div>
          <div className="metric-name">{data.label}</div>
        </div>
        <div className={`metric-icon-box icon-${data.color}`}>
          <Icon name={icon} size={16} />
        </div>
      </div>
      <div className="metric-body">
        <Donut pct={data.pct} size={76} stroke={5} color={color} showValue value={data.val} valueSize={18} label={`/${data.total}`} />
        <p className="metric-desc">{data.desc}</p>
      </div>
      <div>
        <div className="progress-track">
          <div className={`progress-fill ${data.color}`} style={{ width: `${data.pct}%` }} />
        </div>
        <div className={`progress-label ${data.color}`}>{data.pct}% {t.criteria}</div>
      </div>
    </div>
  )
}

interface ResultsPageProps {
  result: any
  t: T
  lang: string
  onBack: () => void
  onNew: () => void
  apiKey: string
  cvText: string
  jdText: string
  onLoadHistory: (entry: any) => void
}

export default function ResultsPage({ result, t, lang, onBack, onNew, apiKey, cvText, jdText, onLoadHistory }: ResultsPageProps) {
  const [adaptOpen, setAdaptOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [rewriteOpen, setRewriteOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const r = result
  const scoreColor = getScoreColor(r.score)
  const scoreClass = getScoreClass(r.score)
  const summaryDesc = r.score >= 70 ? t.summaryHighDesc : r.score >= 50 ? t.summaryMidDesc : t.summaryLowDesc
  const status = r.score >= 70 ? t.statusHigh : r.score >= 50 ? t.statusMid : t.statusLow
  const risk = r.score >= 70 ? t.riskLow : r.score >= 50 ? t.riskMid : t.riskHigh

  const handleAiAnalysis = async () => {
    if (!apiKey || !cvText) return
    setAiLoading(true)
    try {
      const analysis = await claudeAnalyze(cvText, jdText, lang, apiKey)
      saveToHistory(analysis)
      onLoadHistory(analysis)
    } catch (e: any) { alert('Erro: ' + e.message) }
    setAiLoading(false)
  }

  const handleExportPdf = () => {
    setPdfLoading(true)
    setTimeout(() => { exportPDF(r, t); setPdfLoading(false) }, 300)
  }

  return (
    <div>
      <div className="results-bar">
        <div className="results-bar-left">
          <button className="back-btn" onClick={onBack}><Icon name="arrowLeft" size={16} /></button>
          <div>
            <div className="results-meta">
              {t.runDate} · {new Date(r.timestamp).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')}
              {r.analyzedBy === 'claude' && <span style={{ color: 'var(--cyan)', marginLeft: 8 }}>● CLAUDE AI</span>}
            </div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: 'var(--text-bright)', fontSize: 14 }}>{r.jobTitle}</div>
          </div>
        </div>
        <div className="results-bar-right">
          <button className="header-pill" onClick={onNew}><Icon name="refresh" size={14} />{t.newAnalysis}</button>
        </div>
      </div>

      {/* Feature bar */}
      <div className="feature-bar">
        <span className="feature-bar-label">{t.featureActions}</span>
        <button className={`btn-feature cyan ${aiLoading ? 'loading' : ''}`}
          disabled={!apiKey || !cvText || aiLoading} onClick={handleAiAnalysis}>
          <Icon name="sparkles" size={14} />
          {aiLoading ? t.aiAnalysisLoading : t.btnAiAnalysis}
        </button>
        <button className="btn-feature purple" onClick={() => setHistoryOpen(true)}>
          <Icon name="briefcase" size={14} />{t.btnHistory}
        </button>
        <button className="btn-feature green" onClick={() => setRewriteOpen(true)}>
          <Icon name="edit" size={14} />{t.btnRewrite}
        </button>
        <button className={`btn-feature gold ${pdfLoading ? 'loading' : ''}`}
          onClick={handleExportPdf} disabled={pdfLoading}>
          <Icon name="upload" size={14} />
          {pdfLoading ? t.pdfExporting : t.btnExportPdf}
        </button>
      </div>

      {/* Score hero */}
      <div className="ai-card">
        <div className="ai-card-corner tl" /><div className="ai-card-corner tr" />
        <div className="ai-card-corner bl" /><div className="ai-card-corner br" />
        <div className="result-hero">
          <div className="gauge-wrap">
            <div className={`gauge-bg ${scoreClass}`}>
              <Donut pct={r.score} size={220} stroke={12} color={scoreColor} showValue value={r.score} valueSize={64} label={t.compatibility} />
            </div>
            <div className="mini-stats">
              <MiniMetric value={r.metrics.requirements.val} total={40} color={COLORS[r.metrics.requirements.color as keyof typeof COLORS] ?? '#1a91f0'} label={t.requirements} />
              <MiniMetric value={r.metrics.experience.val} total={30} color={COLORS[r.metrics.experience.color as keyof typeof COLORS] ?? '#1a91f0'} label={t.experience} />
              <MiniMetric value={r.metrics.terms.val} total={20} color={COLORS[r.metrics.terms.color as keyof typeof COLORS] ?? '#1a91f0'} label={t.terms} />
              <MiniMetric value={r.metrics.education.val} total={10} color={COLORS[r.metrics.education.color as keyof typeof COLORS] ?? '#1a91f0'} label={t.education} />
            </div>
          </div>
          <div>
            <div className="result-info-pill"><Icon name="sparkles" size={11} />{t.readingJob}</div>
            <h2 className="result-title">{t.summaryHigh}</h2>
            <p className="result-desc">{summaryDesc}</p>
            <div className="badges-row">
              <span className="badge-status" style={{ background: `${scoreColor}15`, color: scoreColor, border: `1px solid ${scoreColor}40` }}>{status}</span>
              <span className="badge-status" style={{ background: `${scoreColor}15`, color: scoreColor, border: `1px solid ${scoreColor}40` }}>{risk}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stack">
        <div className="metric-grid">
          <MetricCard data={r.metrics.requirements} icon="target" t={t} />
          <MetricCard data={r.metrics.experience} icon="trending" t={t} />
          <MetricCard data={r.metrics.terms} icon="sparkles" t={t} />
          <MetricCard data={r.metrics.education} icon="award" t={t} />
        </div>

        {r.alerts?.length > 0 && (
          <div className="ai-card gap-card">
            <div className="ai-card-corner tl" /><div className="ai-card-corner tr" />
            <div className="ai-card-corner bl" /><div className="ai-card-corner br" />
            <div className="section-head">
              <div className="section-icon-box icon-red"><Icon name="shield" size={18} /></div>
              <div>
                <div className="section-cat gap-cat">{t.maxPriority}</div>
                <div className="section-title">{t.attentionPoints}</div>
              </div>
            </div>
            <div className="gap-list">
              {r.alerts.map((a: any, i: number) => (
                <div key={i} className="gap-item">
                  <div className="gap-icon-circle"><Icon name="x" size={14} /></div>
                  <div style={{ flex: 1 }}>
                    <div className="gap-num">{a.num}</div>
                    <div className="gap-text">{a.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {r.strengths?.length > 0 && (
          <div className="ai-card strength-card">
            <div className="ai-card-corner tl" /><div className="ai-card-corner tr" />
            <div className="ai-card-corner bl" /><div className="ai-card-corner br" />
            <div className="section-head">
              <div className="section-icon-box icon-green"><Icon name="checkCircle" size={18} /></div>
              <div>
                <div className="section-cat strength-cat">{t.positiveSignals}</div>
                <div className="section-title">{t.strengths}</div>
              </div>
            </div>
            <div className="gap-list">
              {r.strengths.map((s: string, i: number) => (
                <div key={i} className="strength-item">{s}</div>
              ))}
            </div>
          </div>
        )}

        <div className="ai-card">
          <div className="ai-card-corner tl" /><div className="ai-card-corner tr" />
          <div className="ai-card-corner bl" /><div className="ai-card-corner br" />
          <div className="keywords-head">
            <div className="section-head" style={{ margin: 0 }}>
              <div className="section-icon-box icon-gold"><Icon name="alert" size={18} /></div>
              <div>
                <div className="section-cat keywords-cat">{t.jobLanguage}</div>
                <div className="section-title">{t.jobTerms}</div>
              </div>
            </div>
            <div className="coverage-display">
              <div className="coverage-row">
                <span className="coverage-label">{t.coverage}</span>
                <span className="coverage-val" style={{ color: COLORS[r.metrics.terms.color as keyof typeof COLORS] }}>{r.metrics.terms.val}/{r.metrics.terms.total}</span>
              </div>
              <div className="progress-track" style={{ width: 160 }}>
                <div className={`progress-fill ${r.metrics.terms.color}`} style={{ width: `${r.metrics.terms.pct}%` }} />
              </div>
            </div>
          </div>
          <p className="keywords-desc">{r.keywordsDesc}</p>
          <div className="keywords-grid">
            <div>
              <div className="kw-label green">{t.presentInResume}</div>
              <p className="kw-desc">{t.presentDesc}</p>
              <div className="tags-wrap">
                {r.keywords?.present?.length === 0
                  ? <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                  : r.keywords?.present?.map((k: string, i: number) => <span key={i} className="tag tag-green">{k}</span>)
                }
              </div>
            </div>
            <div>
              <div className="kw-label red">{t.absentInResume}</div>
              <p className="kw-desc">{t.absentDesc}</p>
              <div className="tags-wrap">
                {r.keywords?.missing?.length === 0
                  ? <span style={{ color: 'var(--muted)', fontSize: 12 }}>— Excelente cobertura</span>
                  : r.keywords?.missing?.map((k: string, i: number) => <span key={i} className="tag tag-red">{k}</span>)
                }
              </div>
            </div>
          </div>
        </div>

        <div className="cta-adapt-card">
          <div className="cta-adapt-tag"><Icon name="zap" size={11} />{t.nextStep}</div>
          <h3 className="cta-adapt-title">{t.adaptCVTitle}</h3>
          <p className="cta-adapt-desc">{t.adaptCVDesc}</p>
          <div className="cta-adapt-buttons">
            <button className="btn-adapt-primary" onClick={() => setAdaptOpen(true)}>
              <Icon name="sparkles" size={14} />{t.adaptCVBtn}
            </button>
            <button className="btn-adapt-secondary" onClick={onNew}>
              <Icon name="refresh" size={14} />{t.testAnotherJob}
            </button>
          </div>
        </div>
      </div>

      <AdaptModal isOpen={adaptOpen} onClose={() => setAdaptOpen(false)} t={t}
        suggestion={r.optimizerSuggestion} integratedTerms={r.integratedTerms} />
      <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} onLoad={onLoadHistory} t={t} />
      <RewriteModal isOpen={rewriteOpen} onClose={() => setRewriteOpen(false)} t={t}
        cvText={cvText} jdText={jdText} missingKeywords={r.keywords?.missing ?? []} apiKey={apiKey} lang={lang} />
    </div>
  )
}
