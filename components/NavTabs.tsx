'use client'
import type { T } from '../lib/i18n'

export type TabId = 'analyze' | 'history' | 'format' | 'rewrite' | 'salary' | 'config'

interface NavTabsProps {
  activeTab: TabId
  setActiveTab: (id: TabId) => void
  t: T
  historyCount: number
}

export default function NavTabs({ activeTab, setActiveTab, t, historyCount }: NavTabsProps) {
  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: 'analyze', label: t.tabAnalyze },
    { id: 'history', label: t.tabHistory, badge: historyCount },
    { id: 'format', label: (t as any).tabFormat },
    { id: 'rewrite', label: t.tabRewrite },
    { id: 'salary', label: t.tabSalary },
    { id: 'config', label: t.tabConfig },
  ]

  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 0 20px 0', borderBottom: '1px solid var(--border)', marginBottom: 24, flexWrap: 'wrap' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
            borderRadius: 10, border: '1px solid', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
            background: activeTab === tab.id ? 'var(--cyan)' : 'var(--surface)',
            color: activeTab === tab.id ? '#fff' : 'var(--text)',
            borderColor: activeTab === tab.id ? 'var(--cyan)' : 'var(--border)',
          }}
        >
          {tab.label}
          {tab.badge != null && tab.badge > 0 && (
            <span style={{
              background: activeTab === tab.id ? '#fff' : 'var(--cyan)',
              color: activeTab === tab.id ? 'var(--cyan)' : '#fff',
              borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
