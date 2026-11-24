import { getStore } from '@netlify/blobs'

export default async function submit(request) {
  if (request.method !== 'POST') return new Response(null, { status: 405 })
  const fields = new URLSearchParams(await request.text())
  const field = key => (fields.get(key) || '').trim()
  const [name, email, portfolio, track] = ['name', 'email', 'portfolio', 'track'].map(field)
  const skills = field('skills')
  if (skills.length > 600 || !name || name.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || portfolio.length > 1000 || !URL.canParse(portfolio) || !['https:', 'http:'].includes(new URL(portfolio).protocol)
    || !['Thinkers', 'Devs', 'Gestão de Projetos', 'Master Black Belts'].includes(track) || field('consent') !== 'yes') {
    return new Response(null, { status: 400 })
  }
  await getStore('community-applications').setJSON(track + '/' + crypto.randomUUID(), {
    name, email, portfolio, track, skills, consent: true, receivedAt: new Date().toISOString(),
  })
  return new Response(null, { status: 201 })
}
