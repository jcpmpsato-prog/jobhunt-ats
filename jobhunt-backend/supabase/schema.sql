-- ============================================
-- JOB HUNT ATS - Schema do Banco (Supabase)
-- Execute em: SQL Editor do Supabase
-- ============================================

-- Perfil do usuário (CV + preferências)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  cv_text text,                          -- texto do currículo
  keywords text[],                       -- palavras-chave do perfil (extraídas do CV)
  locations text[] default '{Remoto,São Paulo}',
  seniority text default 'senior',       -- junior | pleno | senior | executive
  daily_digest boolean default true,     -- receber e-mail diário?
  digest_hour int default 8,             -- hora do envio (0-23)
  created_at timestamptz default now()
);

-- Vagas encontradas pelos agentes
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  external_id text,                      -- id na fonte (dedupe)
  source text not null,                  -- adzuna | linkedin_rss | jooble | remotive
  title text not null,
  company text,
  location text,
  url text not null,
  description text,
  salary_min numeric,
  salary_max numeric,
  salary_currency text default 'BRL',
  salary_estimated boolean default false, -- true se estimado por IA
  match_score int,                        -- 0-100 calculado pela IA
  match_reasons text[],                   -- por que deu match
  found_at timestamptz default now(),
  sent_in_digest boolean default false,
  unique(profile_id, external_id, source)
);

-- Análises salariais por vaga
create table if not exists salary_analyses (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  market_min numeric,
  market_median numeric,
  market_max numeric,
  currency text default 'BRL',
  analysis text,                          -- texto da análise da IA
  sources text[],                         -- fontes usadas
  created_at timestamptz default now()
);

-- Log de digests enviados
create table if not exists digest_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  jobs_count int,
  sent_at timestamptz default now()
);

-- Índices
create index if not exists idx_jobs_profile on jobs(profile_id, found_at desc);
create index if not exists idx_jobs_digest on jobs(profile_id, sent_in_digest) where sent_in_digest = false;

-- RLS (Row Level Security)
alter table profiles enable row level security;
alter table jobs enable row level security;
alter table salary_analyses enable row level security;
alter table digest_log enable row level security;

-- Políticas: service_role tem acesso total (Edge Functions usam service_role)
create policy "service_all_profiles" on profiles for all using (true);
create policy "service_all_jobs" on jobs for all using (true);
create policy "service_all_salary" on salary_analyses for all using (true);
create policy "service_all_digest" on digest_log for all using (true);
