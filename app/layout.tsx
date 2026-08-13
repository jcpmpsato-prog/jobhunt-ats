import React from 'react'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ATS Analyzer · Otimize seu currículo para a vaga',
  description: 'Compare seu currículo com a vaga em segundos, receba análise semântica com IA e baixe seu CV formatado no padrão ATS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
