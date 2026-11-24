export default async function radar(request) {
  const query = new URL(request.url).searchParams.get('q')?.trim()
  if (request.method !== 'GET' || !query || query.length > 120) return new Response(null, { status: 400 })
  const url = new URL('https://remotive.com/api/remote-jobs')
  url.searchParams.set('search', query)
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!response.ok) throw new Error()
    const { jobs } = await response.json()
    return Response.json(jobs.slice(0, 40).map(job => ({
      title: job.title, company: job.company_name, location: job.candidate_required_location,
      url: job.url, description: job.description, date: job.publication_date, source: 'Remotive',
    })), { headers: { 'Cache-Control': 'public, max-age=3600' } })
  } catch { return new Response(null, { status: 502 }) }
}
