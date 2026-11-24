import type { Metadata } from 'next'
import Department from './Department'
import './department.css'

export const metadata: Metadata = { title: 'V-Head Hunter | Departamento de Profissionais · V-WORK' }

export default function Page() {
  return <Department />
}
