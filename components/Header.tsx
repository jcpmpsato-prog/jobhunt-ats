'use client'
import Icon from './Icon'
import type { Lang, T } from '../lib/i18n'

interface HeaderProps {
  t: T
  lang: Lang
  setLang: (l: Lang) => void
}

export default function Header({ t, lang, setLang }: HeaderProps) {
  return (
    <div className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-logo"><Icon name="cpu" size={20} /></div>
          <div>
            <div className="brand-name">{t.appName}</div>
            <div className="brand-tag">{t.appTag}</div>
          </div>
        </div>
        <div className="header-right">
          <div className="lang-switch">
            <button className={`lang-btn ${lang === 'pt' ? 'active' : ''}`} onClick={() => setLang('pt')}>PT</button>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>
      </div>
    </div>
  )
}
