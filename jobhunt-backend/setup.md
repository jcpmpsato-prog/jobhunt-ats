# 🚀 JOB HUNT ATS — Setup do Backend (Fase 2)

Guia completo para colocar o modo autônomo no ar. Tempo estimado: ~30 min.

---

## 1️⃣ SUPABASE (banco + funções)

### Criar projeto
1. Acesse https://supabase.com → **New project**
2. Nome: `jobhunt-ats` · Região: `South America (São Paulo)`
3. Guarde a **senha do banco**

### Criar as tabelas
1. No painel, abra **SQL Editor**
2. Cole todo o conteúdo de `supabase/schema.sql`
3. Clique **Run** ✅

### Instalar a CLI e fazer deploy das funções
```bash
# Instalar CLI (Windows via npm)
npm install -g supabase

# Login
supabase login

# Vincular ao projeto (pegue o ref em Project Settings → General)
supabase link --project-ref SEU_PROJECT_REF

# Deploy das 3 funções
supabase functions deploy search-jobs
supabase functions deploy daily-digest
supabase functions deploy salary-analysis
```

### Configurar secrets
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-SUA_CHAVE
supabase secrets set ADZUNA_APP_ID=SEU_ID
supabase secrets set ADZUNA_APP_KEY=SUA_KEY
supabase secrets set RESEND_API_KEY=re_SUA_CHAVE
```

---

## 2️⃣ ADZUNA (busca de vagas — gratuito)

1. Acesse https://developer.adzuna.com → **Register**
2. Crie um app → copie **Application ID** e **Application Key**
3. Use no secret acima ⬆️

> O LinkedIn RSS e o Remotive não precisam de chave — já funcionam direto.

---

## 3️⃣ RESEND (e-mails — gratuito até 3k/mês)

1. Acesse https://resend.com → **Sign up**
2. **API Keys** → Create API Key → copie
3. Use no secret acima ⬆️

> Para enviar do seu próprio domínio depois: adicione domínio em Domains.
> Por enquanto usa `onboarding@resend.dev` (funciona para testes).

---

## 4️⃣ AGENDAR EXECUÇÃO DIÁRIA (pg_cron)

No **SQL Editor** do Supabase, rode (substitua SEU_PROJECT_REF e SUA_ANON_KEY —
encontre em Project Settings → API):

```sql
-- Habilitar extensões
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Buscar vagas todo dia às 7h (UTC-3 = 10h UTC)
select cron.schedule(
  'search-jobs-daily',
  '0 10 * * *',
  $$
  select net.http_post(
    url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/search-jobs',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer SUA_ANON_KEY"}'::jsonb,
    body := json_build_object('profile_id', (select id from profiles limit 1))::jsonb
  );
  $$
);

-- Enviar digest todo dia às 8h (11h UTC)
select cron.schedule(
  'daily-digest',
  '0 11 * * *',
  $$
  select net.http_post(
    url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/daily-digest',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer SUA_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

---

## 5️⃣ CRIAR SEU PERFIL

No **SQL Editor**, insira seu perfil (ajuste os dados):

```sql
insert into profiles (email, full_name, cv_text, keywords, locations, seniority)
values (
  'seu@email.com',
  'Seu Nome',
  'COLE AQUI O TEXTO DO SEU CURRÍCULO',
  array['product manager', 'ia generativa', 'transformação digital', 'agile'],
  array['São Paulo', 'Remoto'],
  'senior'
);
```

---

## 6️⃣ TESTAR

```bash
# Testar busca de vagas (pegue o profile_id na tabela profiles)
curl -X POST https://SEU_PROJECT_REF.supabase.co/functions/v1/search-jobs \
  -H "Authorization: Bearer SUA_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "SEU_PROFILE_ID"}'

# Testar envio do digest
curl -X POST https://SEU_PROJECT_REF.supabase.co/functions/v1/daily-digest \
  -H "Authorization: Bearer SUA_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## ✅ Resultado final

| Hora | O que acontece |
|------|----------------|
| 07:00 | Agente busca vagas no Adzuna + LinkedIn + Remotive |
| 07:00 | Claude calcula match score de cada vaga vs seu CV |
| 08:00 | E-mail chega com as 8 melhores vagas do dia |
| Sob demanda | Análise salarial de qualquer vaga via Claude + web search |

## ⚠️ Notas

- **LinkedIn:** usamos o endpoint público de busca (sem login). É o método
  mais seguro — não usa sua conta Premium nem viola ToS de scraping autenticado.
- **Custos:** Supabase free + Resend free + Adzuna free. Único custo é a
  Anthropic API (~US$ 0,01-0,05 por busca diária).
