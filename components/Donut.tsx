'use client'
import { useState, useEffect } from 'react'

interface DonutProps {
  pct: number
  size?: number
  stroke?: number
  color: string
  showValue?: boolean
  value?: number | string
  valueSize?: number
  label?: string
}

export default function Donut({ pct, size = 200, stroke = 14, color, showValue, value, valueSize, label }: DonutProps) {
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setProgress(pct), 120)
    return () => clearTimeout(t)
  }, [pct])

  const offset = circ - (progress / 100) * circ
  const colorId = color.replace('#', '').replace(/[(),.% ]/g, '_')

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <filter id={`glow-${colorId}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#eef2f8" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)',
            
          }}
        />
      </svg>
      {showValue && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {label && (
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 2 }}>
              {label}
            </div>
          )}
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: valueSize ?? size / 3.2, fontWeight: 800, color: 'var(--text-bright)', lineHeight: 1 }}>
            {value !== undefined ? value : pct}
          </div>
        </div>
      )}
    </div>
  )
}
