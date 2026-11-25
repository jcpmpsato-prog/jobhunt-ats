import type { Metadata } from 'next'
import Department from './Department'

export const metadata: Metadata = { title: 'V-Head Hunter | Departamento de Profissionais · V-WORK' }

export default function Page() {
  return <Department />
}
