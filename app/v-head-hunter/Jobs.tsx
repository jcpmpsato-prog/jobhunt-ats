'use client'
import { useState } from 'react'

interface Job { title: string; company: string; url: string; description: string; location: string; source: string }
function plain(html: string) {
  const document = new DOMParser().parseFromString(html.replace(/<\/(p|li|div|h[1-6])>|<br\s*\/?>/gi, '\n'), 'text/html')
  return document.body.textContent?.trim() || ''
}
export default function Jobs() {
  const [query, setQuery] = useState('Delivery Manager')
  const [jobs, setJobs] = useState<Job[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  function show(list: Job[]) {
    const seen = new Set<string>()
    const filtered = list.filter(job => {
      if (!job.title || !/^https?:\/\//i.test(job.url) || seen.has(job.url)) return false
      seen.add(job.url)
      return true
    })
    setJobs(filtered)
    setMessage(filtered.length ? filtered.length + ' oportunidades encontradas.' : 'Nenhuma oportunidade encontrada nesta busca.')
  }
  async function search() {
    setBusy(true); setMessage('Consultando Remotive…'); setJobs([])
    try {
      const res = await fetch('/.netlify/functions/job-radar?q='+encodeURIComponent(query.trim()))
      if (!res.ok) throw new Error()
      show(await res.json())
    } catch { setMessage('Fonte indisponível. Você também pode abrir a busca no LinkedIn ou Indeed.') }
    finally { setBusy(false) }
  }
  return <section id="radar" className="vh-section"><p className="vh-kicker">OPORTUNIDADES</p><h2>Radar de vagas.</h2>
    <form className="vh-row" onSubmit={e=>{e.preventDefault();search()}}><label>Cargo ou competência<input value={query} maxLength={120} onChange={e=>setQuery(e.target.value)}/></label><button disabled={busy || !query.trim()}>Buscar na Remotive</button></form>
    <div className="vh-actions"><a target="_blank" rel="noreferrer" href={'https://www.linkedin.com/jobs/search/?location=Brasil&keywords='+encodeURIComponent(query)}>LinkedIn ↗</a><a target="_blank" rel="noreferrer" href={'https://br.indeed.com/jobs?q='+encodeURIComponent(query)}>Indeed ↗</a>
    <label>Importar relatório JSON do Head Hunter Diário<input type="file" accept=".json" disabled={busy} onChange={async e=>{
      const file = e.target.files?.[0]; e.target.value=''; if (!file) return
      try {
        const data = JSON.parse(await file.text())
        if (!Array.isArray(data.vagas)) throw new Error()
        show(data.vagas.map((v: Record<string,unknown>)=>({
          title:String(v.cargo||''), company:String(v.empresa||''), location:String(v.local||''), url:String(v.link||''),
          description:String(v.descricao_completa||''), source:String(v.fonte||'Head Hunter Diário')
        })))
      } catch {setMessage('Arquivo inválido. Use o JSON da rodada com a lista vagas.')}
    }}/></label></div>
    <details className="vh-help"><summary>O que é este arquivo?</summary>
      <p>É o arquivo .json exportado pelo Head Hunter Diário, com uma lista chamada <code>vagas</code>. Ele serve para carregar várias oportunidades de uma rodada. Para uma única vaga, abra o anúncio ou copie a descrição e use o Estúdio de entrevistas.</p>
      <pre>{'{ "vagas": [{ "cargo": "Gerente de Projetos", "empresa": "Empresa", "local": "São Paulo", "link": "https://...", "descricao_completa": "..." }] }'}</pre>
    </details><p role="status">{message}</p>
    {jobs.map(job=><article className="vh-result" key={job.url}><div><small>{job.source} · {job.location}</small><h3>{job.title}</h3><p>{job.company}</p></div><div className="vh-actions"><a href={job.url} target="_blank" rel="noreferrer">Ver anúncio ↗</a>
    <button onClick={()=>{try {sessionStorage.setItem('vh-selected-job',JSON.stringify({url:job.url, description:job.description ? job.title+'\n'+plain(job.description) : ''}));location.assign('/')} catch {setMessage('Não foi possível transferir a vaga. Abra o anúncio e copie a descrição.')}}}>Analisar com meu CV</button></div></article>)}
  </section>
}
