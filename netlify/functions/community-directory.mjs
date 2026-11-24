import { getStore } from '@netlify/blobs'
import { createHash, timingSafeEqual } from 'node:crypto'

const digest = value => createHash('sha256').update(value).digest()
export default async function directory(request) {
  if (request.method !== 'GET') return new Response(null, { status: 405 })
  const secret = process.env.VWORK_DIRECTORY_TOKEN
  if (!secret) return new Response(null, { status: 503 })
  if (!timingSafeEqual(digest(request.headers.get('authorization') || ''), digest('Bearer ' + secret))) {
    return new Response(null, { status: 403 })
  }
  const params = new URL(request.url).searchParams
  const track = params.get('track')
  if (!['Thinkers', 'Devs', 'Gestão de Projetos', 'Master Black Belts'].includes(track)) return new Response(null, { status: 400 })
  const query = (params.get('q') || '').trim().toLocaleLowerCase()
  const store = getStore('community-applications')
  const results = []
  for await (const { blobs } of store.list({ prefix: track + '/', paginate: true })) {
    for (let offset = 0; offset < blobs.length; offset += 20) {
      const batch = await Promise.all(blobs.slice(offset, offset + 20).map(({ key }) => store.get(key, { type: 'json' })))
      for (const person of batch) {
        if (person?.consent && [person.name, person.skills, person.portfolio].join(' ').toLocaleLowerCase().includes(query)) results.push(person)
        if (results.length === 50) break
      }
      if (results.length === 50) break
    }
    if (results.length === 50) break
  }
  return Response.json(results, { headers: { 'Cache-Control': 'private, no-store' } })
}
