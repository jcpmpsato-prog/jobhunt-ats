'use client'
import { useState, type FormEvent } from 'react'
import Jobs from './Jobs'
import Studio from './Studio'
import Directory from './Directory'

interface TrackInfo {
  label?: string
  title: string
  text: string
  terms: string
}

const tracks: Record<string, TrackInfo> = {
  Thinkers: { title: 'Estratégia e produto', text: 'Pesquisa, visão de negócio e desenho de soluções.', terms: 'estratégia produto inovação' },
  Devs: { title: 'Engenharia e tecnologia', text: 'Software, arquitetura e automação aplicada.', terms: 'desenvolvedor engenharia de software' },
  'Gestão de Projetos': { label: 'Project & Delivery Managers', title: 'Portfólio, Programas e Delivery', text: 'Gestão de projetos, governança de portfólio, liderança de programas, Delivery e PMO/VMO.', terms: '("Gerente de Projetos" OR "Project Manager" OR "Gerente de Portfólio" OR "Portfolio Manager" OR "Gerente de Programas" OR "Program Manager" OR "Delivery Manager" OR PMO OR VMO)' },
  'Master Black Belts': { title: 'Excelência operacional', text: 'Lean Six Sigma, melhoria contínua e mentoria.', terms: '"Master Black Belt" Lean Six Sigma' },
}
type Track = keyof typeof tracks

export default function Department() {
  const [track, setTrack] = useState<Track>('Thinkers')
  const [term, setTerm] = useState('')
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)
  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setSending(true)
    setStatus('')
    try {
      const body = new URLSearchParams()
      new FormData(form).forEach((value, key) => body.append(key, String(value)))
      const res = await fetch('/.netlify/functions/community-application', { method: 'POST', body })
      if (!res.ok) throw new Error()
      setStatus('Inscrição recebida pelo departamento.')
      form.reset()
    } catch { setStatus('Falha ao enviar a inscrição. Seus campos continuam preenchidos para tentar novamente.') }
    finally { setSending(false) }
  }
  const keywords = [tracks[track].terms, term.trim()].filter(Boolean).join(' ')
  return <main className="vh">
    <header className="vh-nav"><a href="#inicio" className="vh-brand">V<span>／</span>WORK</a><nav aria-label="Departamento"><a href="#comunidade">Comunidade</a><a href="#radar">Vagas</a></nav></header>
    <section className="vh-hero" id="inicio"><div><p className="vh-kicker">V-WORK TOWER &nbsp; / &nbsp; DEPARTAMENTO DE PROFISSIONAIS</p>
      <h1>V-Head<br/><em>Hunter.</em></h1><p className="vh-intro">Encontre sua próxima oportunidade ou traga sua experiência para a comunidade de profissionais da V-WORK.</p>
      <div className="vh-actions"><a className="vh-primary" href="#comunidade">Conhecer a comunidade ↓</a><a href="#radar">Buscar vagas ↗</a></div></div>
      <div className="vh-art" aria-hidden="true"><div>V</div></div>
    </section>
    <section id="comunidade" className="vh-section"><p className="vh-kicker">COMUNIDADE V-WORK</p><h2>Encontre sua especialidade.</h2>
      <div className="vh-tracks">{(Object.keys(tracks) as Track[]).map(name => <button className="vh-track" aria-pressed={track === name} key={name} onClick={() => {setTrack(name); setStatus('')}}>
        <small>{tracks[name].title}</small><strong>{tracks[name].label || name}</strong><span>{tracks[name].text}</span></button>)}</div>
      <div className="vh-grid"><div className="vh-panel"><h3>Buscar profissionais</h3><p>Explore perfis de {tracks[track].label || track} por competência, empresa ou localização.</p>
      <label>Refinar busca<input value={term} onChange={e=>setTerm(e.target.value)} placeholder="Ex. São Paulo, saúde, gestão de portfólio"/></label>
      <div className="vh-actions"><a href={'https://www.linkedin.com/search/results/people/?keywords='+encodeURIComponent(keywords)} target="_blank" rel="noreferrer">Buscar no LinkedIn ↗</a>
      {track === 'Devs' && <a href={'https://github.com/search?type=users&q='+encodeURIComponent(term.trim() || 'location:Brazil')} target="_blank" rel="noreferrer">Buscar no GitHub ↗</a>}</div></div>
      <form className="vh-panel" onSubmit={apply}><h3>Participar como {tracks[track].label || track}</h3>
      <p>Inscreva seu perfil para fazer parte da comunidade V-WORK. Esta inscrição não é uma candidatura a uma vaga.</p><input type="hidden" name="track" value={track}/>
      <label>Nome<input name="name" required maxLength={120} autoComplete="name"/></label><label>E-mail de contato<input name="email" type="email" required maxLength={254} autoComplete="email"/></label>
      <label>Competências<input name="skills" maxLength={600} placeholder="Ex. Kaizen, gestão de portfólio"/></label><label>Perfil ou portfólio<input name="portfolio" type="url" placeholder="https://" required maxLength={1000}/></label>
      <label className="vh-check"><input type="checkbox" required name="consent" value="yes"/>Autorizo a V-WORK a avaliar meu perfil e entrar em contato sobre a comunidade.</label>
      <button disabled={sending}>{sending?'Enviando…':'Enviar inscrição'}</button><p role="status">{status}</p></form></div><Directory key={track} track={track} label={tracks[track].label || track}/>
    </section>
    <section className="vh-section" id="manual"><p className="vh-kicker">AJUDA</p><h2>Como usar o V-Head Hunter.</h2>
      <details className="vh-help"><summary>Radar de vagas</summary><p>Digite um cargo e busque na Remotive. LinkedIn e Indeed abrem buscas nas próprias plataformas. Para carregar várias vagas encontradas pelo Head Hunter Diário, selecione o arquivo JSON daquela rodada. Para uma vaga individual, use o link ou copie a descrição para o Estúdio.</p></details>
      <details className="vh-help"><summary>Comunidade e inscrição profissional</summary><p>Escolha Thinkers, Devs, Project &amp; Delivery Managers ou Master Black Belts. “Buscar profissionais” abre uma busca pública no LinkedIn e, para Devs, no GitHub. “Participar como…” cadastra seu perfil na comunidade V-WORK. Informe nome, e-mail, competências e link do perfil ou portfólio e autorize o contato. O diretório de inscritos é uma área interna e requer a credencial do departamento.</p></details>
      <details className="vh-help"><summary>Estúdio, triangulação com LinkedIn e arquivos</summary><p>Envie o currículo e revise o texto extraído. Cole a descrição completa da vaga. Selecione os módulos desejados; “Triangulação” compara a vaga e o currículo com o conteúdo do seu perfil do LinkedIn. Cole as seções relevantes do perfil, pois um link sozinho pode exigir login e não ser acessível. Aderência pode ser calculada localmente; os demais módulos usam a chave Anthropic. Para revisar uma gravação, envie áudio de até 25 MB e informe uma chave OpenAI para transcrição, ou cole uma transcrição. Confira a transcrição antes de gerar o relatório. Baixe o resultado em PDF ou Word.</p></details>
    </section>
    <Jobs/><Studio/><footer>V-WORK &nbsp; / &nbsp; Departamento de Profissionais</footer></main>
}
