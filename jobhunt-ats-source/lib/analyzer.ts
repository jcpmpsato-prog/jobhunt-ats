import { TAXONOMY, countPatternMatches, getMetricColor, normalize } from './taxonomy'

export function smartAnalyze(cvText: string, jdText: string, lang: string) {
  const jdMatches: Record<string, any> = {}
  for (const tax of TAXONOMY) {
    const r = countPatternMatches(jdText, tax.patterns)
    if (r.count > 0) jdMatches[tax.id] = r
  }
  const cvMatches: Record<string, any> = {}
  for (const tax of TAXONOMY) {
    cvMatches[tax.id] = countPatternMatches(cvText, tax.patterns)
  }

  let reqScore = 0, reqMax = 0, expScore = 0, expMax = 0, eduScore = 0, eduMax = 0

  for (const tax of TAXONOMY) {
    const required = !!jdMatches[tax.id]
    if (!required) continue
    const cvHas = cvMatches[tax.id].count > 0
    const cvStrength = Math.min(cvMatches[tax.id].count, 4) / 4
    if (tax.cat === 'requirements') reqMax += tax.weight
    if (tax.cat === 'experience') expMax += tax.weight
    if (tax.cat === 'education') eduMax += tax.weight
    const earned = cvHas ? Math.round(tax.weight * (0.65 + 0.35 * cvStrength)) : 0
    if (tax.cat === 'requirements') reqScore += earned
    if (tax.cat === 'experience') expScore += earned
    if (tax.cat === 'education') eduScore += earned
  }

  const reqPct = reqMax > 0 ? Math.min(100, Math.round((reqScore / reqMax) * 100)) : 60
  const expPct = expMax > 0 ? Math.min(100, Math.round((expScore / expMax) * 100)) : 60
  const eduPct = eduMax > 0 ? Math.min(100, Math.round((eduScore / eduMax) * 100)) : 60
  const reqVal = Math.round((reqPct / 100) * 40)
  const expVal = Math.round((expPct / 100) * 30)
  const eduVal = Math.round((eduPct / 100) * 10)

  const jdTaxIds = Object.keys(jdMatches)
  const matchedTaxIds = jdTaxIds.filter(id => cvMatches[id].count > 0)
  const termsRatio = jdTaxIds.length > 0 ? matchedTaxIds.length / jdTaxIds.length : 0.7
  const termsPct = Math.round(termsRatio * 100)
  const termsVal = Math.round(termsRatio * 20)
  const score = Math.min(100, reqVal + expVal + termsVal + eduVal)

  const present: string[] = []
  const missing: string[] = []
  for (const taxId of jdTaxIds) {
    const tax = TAXONOMY.find(t => t.id === taxId)!
    const label = lang === 'pt' ? tax.label : tax.labelEn
    if (cvMatches[taxId].count > 0) present.push(label)
    else missing.push(label)
  }

  const missingTax = jdTaxIds
    .filter(id => cvMatches[id].count === 0)
    .map(id => TAXONOMY.find(t => t.id === id)!)
    .sort((a, b) => b.weight - a.weight)

  const alerts = missingTax.slice(0, 4).map((tax, i) => {
    const label = lang === 'pt' ? tax.label : tax.labelEn
    return {
      num: lang === 'pt' ? `FALHA 0${i+1}` : `GAP 0${i+1}`,
      text: lang === 'pt'
        ? `Falta evidência clara de ${label} no currículo. A vaga menciona explicitamente esse tema.`
        : `Missing clear evidence of ${label} in the resume. The job explicitly mentions this topic.`
    }
  })
  if (alerts.length === 0) alerts.push({
    num: lang === 'pt' ? 'OBSERVAÇÃO' : 'NOTE',
    text: lang === 'pt' ? 'Currículo bem alinhado à vaga. Refinamentos de linguagem ainda podem otimizar a triagem ATS.' : 'Resume well-aligned. Language refinements can still optimize ATS screening.'
  })

  const presentTax = jdTaxIds
    .filter(id => cvMatches[id].count > 0)
    .map(id => ({ ...TAXONOMY.find(t => t.id === id)!, strength: cvMatches[id].count }))
    .sort((a, b) => b.weight * b.strength - a.weight * a.strength)

  const strengths = presentTax.slice(0, 4).map(tax => {
    const label = lang === 'pt' ? tax.label : tax.labelEn
    return tax.strength >= 3
      ? (lang === 'pt' ? `Forte cobertura em ${label} — múltiplas evidências no currículo.` : `Strong coverage in ${label} — multiple evidences in the resume.`)
      : (lang === 'pt' ? `Boa presença de ${label} no histórico profissional.` : `Good presence of ${label} in professional history.`)
  })

  const presentLabels = present.slice(0, 4).join(', ')
  const missingLabels = missing.slice(0, 3).join(', ')
  const optimizerSuggestion = lang === 'pt'
    ? `Profissional sênior com sólida trajetória em liderança de transformação digital em ambientes corporativos regulados, consolidando expertise progressiva em ${presentLabels}, com atuação direta na ponte entre tecnologia, áreas de negócio e alta liderança. ${missing.length > 0 ? `Atuação estratégica integrando ${missingLabels} para estruturação, avaliação e priorização de casos de uso de alto impacto, alinhados a objetivos institucionais e geração de valor mensurável. ` : ''}Coordenação de projetos transversais com múltiplos stakeholders, governança técnica responsável sob frameworks como SAFe, Scrum e Kanban, aderência a SLOs de performance e arquitetura de soluções com foco em ROI operacional.`
    : `Senior professional with solid digital transformation leadership track record in regulated corporate environments, consolidating progressive expertise in ${presentLabels}, with direct action bridging technology, business areas and senior leadership. ${missing.length > 0 ? `Strategic action integrating ${missingLabels} for structuring, evaluating and prioritizing high-impact use cases. ` : ''}Cross-functional project coordination with multiple stakeholders, technical governance under SAFe, Scrum and Kanban frameworks.`

  const firstLine = (jdText.split('\n').find(l => l.trim().length > 5) || '').trim()
  let jobTitle = firstLine.length > 70 ? firstLine.slice(0, 67) + '...' : firstLine
  const titleMatch = jdText.match(/Buscamos um[a]?\s+([^,.\n]+)/i) || jdText.match(/We['']?re looking for\s+([^,.\n]+)/i) || jdText.match(/Vaga\s+(?:de|para)\s+([^,.\n]+)/i)
  if (titleMatch) jobTitle = titleMatch[1].trim().slice(0, 70)

  const labels = lang === 'pt'
    ? { requirements: 'Requisitos', experience: 'Experiência', terms: 'Termos', education: 'Formação' }
    : { requirements: 'Requirements', experience: 'Experience', terms: 'Terms', education: 'Education' }

  return {
    score, jobTitle: jobTitle || (lang === 'pt' ? 'Vaga' : 'Job'), timestamp: Date.now(),
    metrics: {
      requirements: { val: reqVal, total: 40, pct: Math.round((reqVal/40)*100), label: labels.requirements, desc: lang === 'pt' ? 'Cobertura dos requisitos centrais da vaga.' : 'Coverage of central job requirements.', color: getMetricColor((reqVal/40)*100) },
      experience: { val: expVal, total: 30, pct: Math.round((expVal/30)*100), label: labels.experience, desc: lang === 'pt' ? 'Maturidade profissional alinhada à vaga.' : 'Professional maturity aligned with the job.', color: getMetricColor((expVal/30)*100) },
      terms: { val: termsVal, total: 20, pct: termsPct, label: labels.terms, desc: lang === 'pt' ? 'Vocabulário do CV alinhado à vaga.' : 'CV vocabulary aligned with the job.', color: getMetricColor(termsPct) },
      education: { val: eduVal, total: 10, pct: Math.round((eduVal/10)*100), label: labels.education, desc: lang === 'pt' ? 'Formação e certificações pertinentes.' : 'Relevant education and certifications.', color: getMetricColor((eduVal/10)*100) }
    },
    alerts, strengths, keywords: { present, missing },
    keywordsDesc: lang === 'pt'
      ? `Match semântico entre ${jdTaxIds.length} categorias-chave da vaga e o conteúdo do currículo. ${matchedTaxIds.length} categorias presentes, ${jdTaxIds.length - matchedTaxIds.length} ausentes.`
      : `Semantic match between ${jdTaxIds.length} key job categories and CV content. ${matchedTaxIds.length} categories present, ${jdTaxIds.length - matchedTaxIds.length} missing.`,
    optimizerSuggestion, integratedTerms: missing.slice(0, 5)
  }
}

export async function claudeAnalyze(cvText: string, jdText: string, lang: string, apiKey: string) {
  const prompt = lang === 'pt'
    ? `Você é um especialista em ATS. Analise a aderência entre o currículo e a vaga.\n\nCURRÍCULO:\n${cvText.slice(0,3000)}\n\nDESCRIÇÃO DA VAGA:\n${jdText.slice(0,2000)}\n\nResponda APENAS com JSON válido:\n{"score":<0-100>,"jobTitle":"<título>","summary":"<análise 2-3 frases>","metrics":{"requirements":{"val":<0-40>,"total":40,"desc":"<desc>"},"experience":{"val":<0-30>,"total":30,"desc":"<desc>"},"terms":{"val":<0-20>,"total":20,"desc":"<desc>"},"education":{"val":<0-10>,"total":10,"desc":"<desc>"}},"alerts":[{"num":"FALHA 01","text":"<desc>"}],"strengths":["<ponto>"],"keywords":{"present":["<termo>"],"missing":["<termo>"]},"optimizerSuggestion":"<parágrafo executivo>","integratedTerms":["<termo>"]}`
    : `You are an ATS expert. Analyze the match between the resume and job.\n\nRESUME:\n${cvText.slice(0,3000)}\n\nJOB DESCRIPTION:\n${jdText.slice(0,2000)}\n\nRespond ONLY with valid JSON:\n{"score":<0-100>,"jobTitle":"<title>","summary":"<2-3 sentence analysis>","metrics":{"requirements":{"val":<0-40>,"total":40,"desc":"<desc>"},"experience":{"val":<0-30>,"total":30,"desc":"<desc>"},"terms":{"val":<0-20>,"total":20,"desc":"<desc>"},"education":{"val":<0-10>,"total":10,"desc":"<desc>"}},"alerts":[{"num":"GAP 01","text":"<desc>"}],"strengths":["<strength>"],"keywords":{"present":["<term>"],"missing":["<term>"]},"optimizerSuggestion":"<executive summary paragraph>","integratedTerms":["<term>"]}`

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] })
  })
  if (!resp.ok) throw new Error('API error: ' + resp.status)
  const data = await resp.json()
  const text = data.content[0].text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(text)
  const labels = lang === 'pt'
    ? { requirements: 'Requisitos', experience: 'Experiência', terms: 'Termos', education: 'Formação' }
    : { requirements: 'Requirements', experience: 'Experience', terms: 'Terms', education: 'Education' };
  ['requirements','experience','terms','education'].forEach(k => {
    parsed.metrics[k].label = labels[k as keyof typeof labels]
    parsed.metrics[k].pct = Math.round((parsed.metrics[k].val / parsed.metrics[k].total) * 100)
    parsed.metrics[k].color = getMetricColor(parsed.metrics[k].pct)
  })
  parsed.timestamp = Date.now()
  parsed.analyzedBy = 'claude'
  parsed.keywordsDesc = lang === 'pt'
    ? `Análise profunda com Claude AI. ${parsed.keywords.present.length} termos presentes, ${parsed.keywords.missing.length} ausentes.`
    : `Deep analysis with Claude AI. ${parsed.keywords.present.length} terms present, ${parsed.keywords.missing.length} missing.`
  return parsed
}

export async function claudeRewriteCV(cvText: string, jdText: string, missingKeywords: string[], lang: string, apiKey: string) {
  const prompt = lang === 'pt'
    ? `Você é especialista em currículos executivos e ATS brasileiros. Reescreva o currículo abaixo para maximizar aderência à vaga.\n\nCURRÍCULO:\n${cvText.slice(0,8000)}\n\nVAGA:\n${jdText.slice(0,3000)}\n\nTERMOS AUSENTES: ${missingKeywords.join(', ')}\n\nRegras: verbos de ação + métricas reais, sem "responsável por", integre termos da vaga naturalmente.\n\nResposta APENAS JSON:\n{"summary":"<resumo 3-4 linhas>","experience":"<bullets reescritos, um por linha, iniciando com •>","skills":"<5-8 categorias: Categoria: item | item | item>","keywords":"<palavras-chave separadas por vírgula>","checklist":"<ajustes estruturais no arquivo final>"}`
    : `You are an expert in executive resumes and ATS systems. Rewrite the resume below to maximize job match.\n\nRESUME:\n${cvText.slice(0,8000)}\n\nJOB:\n${jdText.slice(0,3000)}\n\nMISSING TERMS: ${missingKeywords.join(', ')}\n\nRules: action verbs + real metrics, no "responsible for", integrate job terms naturally.\n\nRespond ONLY JSON:\n{"summary":"<3-4 line summary>","experience":"<rewritten bullets, one per line, starting with •>","skills":"<5-8 categories: Category: item | item | item>","keywords":"<comma separated keywords>","checklist":"<structural fixes for final file>"}`

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] })
  })
  if (!resp.ok) throw new Error('API error: ' + resp.status)
  const data = await resp.json()
  const text = data.content[0].text.replace(/```json|```/g, '').trim()
  return JSON.parse(text)
}

export const HISTORY_KEY = 'ats_history_v1'
export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
export function saveToHistory(result: any) {
  const h = loadHistory()
  h.unshift({ id: Date.now(), ...result })
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 20)))
}
export function deleteFromHistory(id: number) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(loadHistory().filter((e: any) => e.id !== id)))
}
export function clearHistory() { localStorage.removeItem(HISTORY_KEY) }
