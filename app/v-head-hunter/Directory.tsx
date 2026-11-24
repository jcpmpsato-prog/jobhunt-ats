'use client'
import {useState} from 'react'

interface Person {name:string; email:string; skills:string; portfolio:string}
export default function Directory({track}:{track:string}){
  const [token,setToken]=useState('')
  const [query,setQuery]=useState('')
  const [people,setPeople]=useState<Person[]>([])
  const [status,setStatus]=useState('')
  const [busy,setBusy]=useState(false)
  async function search(){
    setBusy(true);setPeople([]);setStatus('Consultando…')
    try{
      const res=await fetch('/.netlify/functions/community-directory?'+new URLSearchParams({track,q:query}),{headers:{Authorization:'Bearer '+token},cache:'no-store'})
      if(!res.ok) throw new Error(res.status===403?'Credencial inválida.':'Diretório indisponível. Verifique a configuração do departamento.')
      const list:Person[]=await res.json()
      setPeople(list);setStatus(list.length===50?'Exibindo 50 perfis. Refine a busca para localizar outros inscritos.':list.length+' perfis encontrados.')
    }catch(e){setStatus((e as Error).message)}finally{setBusy(false)}
  }
  return <details className="vh-panel" style={{marginTop:16}}><summary>Área do departamento · Inscritos em {track}</summary>
    <form className="vh-row" onSubmit={e=>{e.preventDefault();search()}}><label>Credencial do departamento<input type="password" required value={token} onChange={e=>{setToken(e.target.value);setPeople([])}}/></label>
    <label>Nome ou competência<input value={query} onChange={e=>setQuery(e.target.value)}/></label><button disabled={busy}>Consultar inscritos</button></form>
    <p role="status">{status}</p>{people.map((p,i)=><article key={i} className="vh-result"><div><h3>{p.name}</h3><p>{p.skills}</p><a href={'mailto:'+p.email}>{p.email}</a></div><a href={p.portfolio} target="_blank" rel="noreferrer">Portfólio ↗</a></article>)}</details>
}
