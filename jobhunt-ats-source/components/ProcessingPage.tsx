'use client'
import { useState, useEffect } from 'react'
import Icon from './Icon'
import type { T } from '../lib/i18n'

export default function ProcessingPage({ t }: { t: T }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [progress, setProgress] = useState(15)

  useEffect(() => {
    const total = t.processingSteps.length
    const interval = setInterval(() => {
      setStepIdx(prev => {
        const next = Math.min(prev + 1, total - 1)
        setProgress(((next + 1) / total) * 95)
        return next
      })
    }, 900)
    return () => clearInterval(interval)
  }, [t.processingSteps.length])

  return (
    <div className="processing-screen">
      <div className="ai-orb">
        <div className="ai-orb-ring" />
        <div className="ai-orb-ring" />
        <div className="ai-orb-ring" />
        <div className="ai-orb-core"><Icon name="cpu" size={36} /></div>
      </div>
      <h2 className="processing-title">{t.processingTitle}</h2>
      <div className="processing-step">{t.processingSteps[stepIdx]}</div>
      <div className="processing-bar">
        <div className="processing-bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
