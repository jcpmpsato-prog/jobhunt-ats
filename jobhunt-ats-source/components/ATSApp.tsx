'use client'
import { useState } from 'react'
import Header from './Header'
import NavTabs, { type TabId } from './NavTabs'
import InputPage from './InputPage'
import ProcessingPage from './ProcessingPage'
import ResultsPage from './ResultsPage'
import { HistoryTabPage, RewriteTab, SalaryTab, ConfigTab } from './TabPages'
import { smartAnalyze, claudeAnalyze, saveToHistory, loadHistory } from '../lib/analyzer'
import { i18n, type Lang } from '../lib/i18n'

export default function ATSApp() {
  const [lang, setLang] = useState<Lang>('pt')
  const [activeTab, setActiveTab] = useState<TabId>('analyze')
  const [page, setPage] = useState<'input' | 'processing' | 'results'>('input')
  const [result, setResult] = useState<any>(null)
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('ats_mvp_key') || ''
    return ''
  })
  const [lastCvText, setLastCvText] = useState('')
  const [lastJdText, setLastJdText] = useState('')
  const [historyCount, setHistoryCount] = useState(() => loadHistory().length)
  const t = i18n[lang]

  const handleApiKey = (k: string) => {
    setApiKey(k)
    if (typeof window !== 'undefined') localStorage.setItem('ats_mvp_key', k)
  }

  const onAnalyze = async (cvText: string, jdText: string, key: string) => {
    setPage('processing')
    setLastCvText(cvText); setLastJdText(jdText)
    const effectiveKey = key || apiKey
    await new Promise(r => setTimeout(r, effectiveKey ? 2000 : 4500))
    let analysis: any
    if (effectiveKey) {
      try { analysis = await claudeAnalyze(cvText, jdText, lang, effectiveKey) }
      catch { analysis = smartAnalyze(cvText, jdText, lang) }
    } else {
      analysis = smartAnalyze(cvText, jdText, lang)
    }
    saveToHistory(analysis)
    setHistoryCount(loadHistory().length)
    setResult(analysis)
    setPage('results')
  }

  const onLoadHistory = (entry: any) => {
    setResult(entry); setPage('results'); setActiveTab('analyze')
  }

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    if (tab === 'analyze') setPage('input')
  }

  return (
    <div>
      <Header t={t} lang={lang} setLang={setLang} />
      <div className="container">
        <NavTabs activeTab={activeTab} setActiveTab={handleTabChange} t={t} historyCount={historyCount} />
        {activeTab === 'analyze' && (
          <>
            {page === 'input' && <InputPage t={t} lang={lang} onAnalyze={onAnalyze} apiKey={apiKey} setApiKey={handleApiKey} />}
            {page === 'processing' && <ProcessingPage t={t} />}
            {page === 'results' && result && (
              <ResultsPage result={result} t={t} lang={lang}
                onBack={() => setPage('input')} onNew={() => { setResult(null); setPage('input') }}
                apiKey={apiKey} cvText={lastCvText} jdText={lastJdText} onLoadHistory={onLoadHistory} />
            )}
          </>
        )}
        {activeTab === 'history' && <HistoryTabPage onLoad={onLoadHistory} t={t} />}
        {activeTab === 'rewrite' && <RewriteTab apiKey={apiKey} t={t} lang={lang} />}
        {activeTab === 'salary' && <SalaryTab apiKey={apiKey} t={t} />}
        {activeTab === 'config' && <ConfigTab apiKey={apiKey} setApiKey={handleApiKey} t={t} />}
      </div>
      <div className="footer-meta"><span>✦</span> {t.footer} <span>✦</span></div>
    </div>
  )
}
