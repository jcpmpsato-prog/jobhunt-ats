export const TAXONOMY = [
  { id: 'ai_genai', label: 'IA Generativa', labelEn: 'Generative AI', cat: 'requirements', weight: 10,
    patterns: ['ia generativa','generative ai','genai','gemini','claude','chatgpt','gpt','watsonx','watson.x','notebooklm','perplexity','rovo','llm','large language model','fine-tuning','rag','copilot','ai enablement'] },
  { id: 'ai_ml', label: 'Machine Learning', labelEn: 'Machine Learning', cat: 'requirements', weight: 6,
    patterns: ['machine learning','ml ','aprendizado de máquina','ia aplicada','ai applied','inteligência artificial','artificial intelligence','ia,','ai,','neural','deep learning','nlp','analytics preditivo','predictive analytics'] },
  { id: 'ai_arch', label: 'Arquitetura de IA', labelEn: 'AI Architecture', cat: 'requirements', weight: 5,
    patterns: ['arquitetura de ia','ai architecture','arquitetura de soluções','solution architecture','governança de ia','ai governance','governança cognitiva','ai enablement','casos de uso de ia','ai use cases','casos de uso'] },
  { id: 'aws', label: 'AWS', labelEn: 'AWS', cat: 'requirements', weight: 4, patterns: ['aws','amazon web services'] },
  { id: 'cloud_other', label: 'Cloud (Azure/GCP)', labelEn: 'Cloud', cat: 'requirements', weight: 3,
    patterns: ['azure','gcp','google cloud','cloud computing','nuvem','migração cloud'] },
  { id: 'databricks', label: 'Databricks', labelEn: 'Databricks', cat: 'requirements', weight: 3,
    patterns: ['databricks','data lake','spark','lakehouse'] },
  { id: 'data_analytics', label: 'Data Analytics', labelEn: 'Data Analytics', cat: 'requirements', weight: 4,
    patterns: ['power bi','tableau','looker','data analytics','análise de dados','data mining','business intelligence','eazybi','sql','python','data-driven','kpi','kpis','okr','okrs'] },
  { id: 'agile', label: 'Metodologias Ágeis', labelEn: 'Agile Methodologies', cat: 'requirements', weight: 4,
    patterns: ['safe','scrum','kanban','agile','ágil','agilidade','pmp','pmo','okr','sprint','pi planning','lean','kaizen','discovery','delivery'] },
  { id: 'product', label: 'Product Management', labelEn: 'Product Management', cat: 'requirements', weight: 3,
    patterns: ['product owner','product manager','gestão de produto','roadmap','backlog','priorização','casos de uso','po/pm','popm'] },
  { id: 'leadership', label: 'Liderança', labelEn: 'Leadership', cat: 'experience', weight: 5,
    patterns: ['liderança','leadership','lider','liderar','gestão','management','team lead','gerência'] },
  { id: 'stakeholder', label: 'Stakeholders', labelEn: 'Stakeholders', cat: 'experience', weight: 4,
    patterns: ['stakeholder','stakeholders','partes interessadas','c-level','alta liderança','senior leadership','executiva','executive','diretoria','board'] },
  { id: 'cross_func', label: 'Cross-functional', labelEn: 'Cross-functional', cat: 'experience', weight: 3,
    patterns: ['multidisciplinar','multidisciplinares','cross-functional','transversal','transversais','multifuncional'] },
  { id: 'transformation', label: 'Transformação Digital', labelEn: 'Digital Transformation', cat: 'experience', weight: 4,
    patterns: ['transformação digital','digital transformation','modernização','modernization','change management','mudança cultural'] },
  { id: 'compliance', label: 'Compliance', labelEn: 'Compliance', cat: 'requirements', weight: 4,
    patterns: ['compliance','conformidade','regulado','regulated','regulatório','regulatory','lgpd','gdpr','segurança da informação','information security','governança','governance'] },
  { id: 'regulated_env', label: 'Ambientes Regulados', labelEn: 'Regulated Environments', cat: 'experience', weight: 4,
    patterns: ['susep','ans','bacen','cvm','banco central','detran','seguradora','insurance','financeiro','mercado financeiro','regulado','institutional'] },
  { id: 'communication', label: 'Comunicação Executiva', labelEn: 'Executive Communication', cat: 'experience', weight: 3,
    patterns: ['comunicação','communication','tradução','translate','ponte','bridge','apresentação executiva','reporte','reporting'] },
  { id: 'edu_higher', label: 'Ensino Superior', labelEn: 'Higher Education', cat: 'education', weight: 3,
    patterns: ['graduação','graduado','graduation','bachelor','engenharia','engineering','ciência da computação','computer science','sistemas de informação','administração','economia'] },
  { id: 'edu_post', label: 'Pós-graduação', labelEn: 'Postgraduate', cat: 'education', weight: 3,
    patterns: ['pós-graduação','pos-graduacao','mestrado','master','mba','especialização','doctorate','phd','doutorado'] },
  { id: 'cert_pm', label: 'Cert. PM', labelEn: 'PM Cert.', cat: 'education', weight: 2,
    patterns: ['pmp','csm','cspo','pspo','safe','scrum master','pmi','pm3'] },
  { id: 'cert_ai', label: 'Cert. IA', labelEn: 'AI Cert.', cat: 'education', weight: 2,
    patterns: ['watsonx certification','watson.x','azure ai','aws ai','google ai','genai cert','machine learning cert'] },
]

export function normalize(text: string) {
  return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function countPatternMatches(text: string, patterns: string[]) {
  const norm = normalize(text)
  let count = 0
  const matched: string[] = []
  for (const p of patterns) {
    if (norm.includes(normalize(p))) { count++; matched.push(p) }
  }
  return { count, matched }
}

export function getScoreColor(s: number) { return s < 50 ? '#f87171' : s < 70 ? '#fbbf24' : '#10d9a0' }
export function getScoreClass(s: number) { return s < 50 ? 'low' : s < 70 ? 'mid' : 'high' }
export function getMetricColor(pct: number) { return pct < 50 ? 'red' : pct < 70 ? 'gold' : 'green' }
