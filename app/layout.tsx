import React from 'react'
import type { Metadata } from 'next'
import './globals.css'
import './v-head-hunter/department.css'

export const metadata: Metadata = {
  title: 'V-Head Hunter | Departamento de Profissionais · V-WORK',
  description: 'Encontre oportunidades, prepare candidaturas e conecte profissionais à comunidade V-WORK.',
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
