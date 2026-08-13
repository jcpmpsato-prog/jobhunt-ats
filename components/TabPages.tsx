'use client'
import { useState } from 'react'
import Icon from './Icon'
import { loadHistory, deleteFromHistory, clearHistory, claudeRewriteCV } from '../lib/analyzer'
import type { T } from '../lib/i18n'

// ============ HISTORY TAB ============
export function HistoryTabPage({ onLoad, t }: { onLoad: (entry: any) => void; t: T }) {
  const [list, setList] = useState<any[]>(loadHistory())
  const refresh = () => setList(loadHistory())
  const scoreColor = (s: number) => s >= 70 ? '#16a34a' : s >= 50 ? '#f59e0b' : '#ef4444'

  if (list.length === 0) return (
    <div className="ai-card" style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
      <div>{t.historyEmpty}</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text-bright)' }}>{t.historyTitle}</div>
        <button onClick={() => { clearHistory(); refresh() }} style={{ fontSize: 12, color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer' }}>{t.historyClear}</button>
      </div>
      <div className="history-list">
        {list.map(h => (
          <div key={h.id} className="history-item" onClick={() => onLoad(h)}>
            <div className="history-score-badge" style={{ background: scoreColor(h.score) + '20', color: scoreColor(h.score), border: `1px solid ${scoreColor(h.score)}50` }}>
              {h.score}%
            </div>
            <div className="history-info">
              <div className="history-job">{h.jobTitle}</div>
              <div className="history-date">{new Date(h.timestamp).toLocaleString()}</div>
            </div>
            <button className="history-del" onClick={e => { e.stopPropagation(); deleteFromHistory(h.id); refresh() }}>
              <Icon name="close" size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ REWRITE TAB ============
export function RewriteTab({ apiKey, t, lang }: { apiKey: string; t: T; lang: string }) {
  const [cvText, setCvText] = useState('')
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [rewrite, setRewrite] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState('')

  const run = async () => {
    if (!cvText.trim() || !jdText.trim()) return
    if (!apiKey) { setError(t.rewriteNoKey); return }
    setLoading(true); setError(null); setRewrite(null)
    try {
      const r = await claudeRewriteCV(cvText, jdText, [], lang, apiKey)
      setRewrite(r)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const sections: [string, string][] = [
    ['summary', '📋 ' + t.rwSummary],
    ['experience', '🧩 ' + t.rwExperience],
    ['skills', '⚙️ ' + t.rwSkills],
    ['keywords', '🔑 ' + t.rwKeywords],
    ['checklist', '✅ ' + t.rwChecklist],
  ]

  const inputStyle = {
    width: '100%', padding: '10px', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)',
    fontSize: 12, marginTop: 4, resize: 'vertical' as const,
    boxSizing: 'border-box' as const, lineHeight: 1.5,
    fontFamily: 'Inter, sans-serif',
  }
  const labelStyle = { fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', fontFamily: 'Inter, sans-serif' }

  return (
    <div>
      <div className="ai-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.2em', fontFamily: 'Inter, sans-serif', marginBottom: 12 }}>{t.rewriteTabTitle}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>{t.rewriteTabCvLabel}</label>
            <textarea value={cvText} onChange={e => setCvText(e.target.value)} placeholder={t.rewriteTabCvPlaceholder} rows={10} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t.rewriteTabJdLabel}</label>
            <textarea value={jdText} onChange={e => setJdText(e.target.value)} placeholder={t.rewriteTabJdPlaceholder} rows={10} style={inputStyle} />
          </div>
        </div>
        <button onClick={run} disabled={loading || !cvText.trim() || !jdText.trim()} style={{
          padding: '10px 24px', background: 'linear-gradient(135deg, #16a34a, #1a91f0)',
          border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'Inter, sans-serif',
        }}>
          {loading ? t.rewriteTabRunning : t.rewriteTabRun}
        </button>
        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>{error}</div>}
      </div>
      {rewrite && (
        <div className="rewrite-sections">
          {sections.filter(([key]) => rewrite[key]).map(([key, label]) => (
            <div key={key} className="rewrite-section-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div className="rewrite-section-label">{label}</div>
                <button className={`btn-copy ${copied === key ? 'copied' : ''}`} style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => copy(key, rewrite[key])}>
                  <Icon name={copied === key ? 'check' : 'copy'} size={12} /> {copied === key ? t.copied : t.copyText}
                </button>
              </div>
              <div className="rewrite-section-text">{rewrite[key]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ SALARY TAB ============
export function SalaryTab({ apiKey, t }: { apiKey: string; t: T }) {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState<string>(t.salaryLocationDefault)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    if (!jobTitle.trim()) { setError(t.salaryNoJob); return }
    if (!apiKey) { setError(t.salaryNoKey); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const prompt = `Pesquise na web a faixa salarial atual no Brasil para: CARGO: ${jobTitle}, EMPRESA: ${company || 'não informada'}, LOCAL: ${location}. Responda APENAS JSON: {"market_min":<número>,"market_median":<número>,"market_max":<número>,"analysis":"<2-3 frases>","sources":["<fonte>"]}`
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1200, tools: [{ type: 'web_search_20250305', name: 'web_search' }], messages: [{ role: 'user', content: prompt }] })
      })
      const data = await r.json()
      const texts = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text)
      const text = texts[texts.length - 1] || ''
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Sem resultado')
      setResult(JSON.parse(match[0]))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const fmt = (n: number) => n ? 'R$ ' + Math.round(n).toLocaleString('pt-BR') : '—'

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text)', fontSize: 13, marginTop: 4, boxSizing: 'border-box' as const,
    fontFamily: 'Inter, sans-serif',
  }
  const labelStyle = { fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', fontFamily: 'Inter, sans-serif' }

  return (
    <div>
      <div className="ai-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.2em', fontFamily: 'Inter, sans-serif', marginBottom: 12 }}>{t.salaryTitle}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><label style={labelStyle}>{t.salaryJobLabel}</label><input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder={t.salaryJobPlaceholder} style={inputStyle} /></div>
          <div><label style={labelStyle}>{t.salaryCompanyLabel}</label><input value={company} onChange={e => setCompany(e.target.value)} placeholder={t.salaryCompanyPlaceholder} style={inputStyle} /></div>
          <div><label style={labelStyle}>{t.salaryLocationLabel}</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder={t.salaryLocationDefault} style={inputStyle} /></div>
        </div>
        <button onClick={analyze} disabled={loading || !jobTitle.trim()} style={{
          padding: '10px 24px', background: 'linear-gradient(135deg, #1a91f0, #0b7ad1)',
          border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'Inter, sans-serif',
        }}>
          {loading ? t.salarySearching : t.salarySearch}
        </button>
        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>{error}</div>}
      </div>
      {result && (
        <div className="ai-card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {([['market_min', t.salaryMin, 'var(--muted)'], ['market_median', t.salaryMedian, 'var(--gold)'], ['market_max', t.salaryMax, 'var(--green)']] as [string, string, string][]).map(([key, label, color]) => (
              <div key={key} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color }}>{fmt(result[key])}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, marginBottom: 12 }}>{result.analysis}</div>
          {result.sources?.map((s: string, i: number) => <div key={i} style={{ fontSize: 11, color: 'var(--cyan)' }}>• {s}</div>)}
        </div>
      )}
    </div>
  )
}

// ============ CONFIG TAB ============
export function ConfigTab({ apiKey, setApiKey, t }: { apiKey: string; setApiKey: (k: string) => void; t: T }) {
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)
  const save = () => { localStorage.setItem('ats_mvp_key', apiKey); setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="ai-card">
      <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.2em', fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>{t.configTitle}</div>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
        {t.configDesc}{' '}
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)' }}>console.anthropic.com</a>
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type={show ? 'text' : 'password'}
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          style={{ flex: 1, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}
        />
        <button onClick={() => setShow(!show)} style={{ padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer' }}>
          <Icon name={show ? 'eyeOff' : 'eye'} size={16} />
        </button>
        <button onClick={save} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #1a91f0, #0b7ad1)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          {saved ? t.configSaved : t.configSave}
        </button>
      </div>
      <div style={{ fontSize: 12, color: apiKey ? 'var(--green)' : 'var(--muted)' }}>
        {apiKey ? t.configActive : t.configInactive}
      </div>
    </div>
  )
}
