// ============================================
// JOB HUNT ATS — Edge Function: search-jobs
// Busca vagas em múltiplas fontes, calcula match com Claude
// Deploy: supabase functions deploy search-jobs
// ============================================
// Secrets necessários (supabase secrets set):
//   ANTHROPIC_API_KEY
//   ADZUNA_APP_ID, ADZUNA_APP_KEY  (gratuito em developer.adzuna.com)
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://vslrnhuzzyltzhbzzdcc.supabase.co";
const SUPABASE_KEY = "sb_secret_TP-7jdwBf6rrtVbxkVk8uA_S83d0jn-";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const ADZUNA_ID = Deno.env.get("ADZUNA_APP_ID") || "";
const ADZUNA_KEY = Deno.env.get("ADZUNA_APP_KEY") || "";

// ---------- FONTE 1: Adzuna (API oficial, gratuita) ----------
async function searchAdzuna(keywords: string[], location: string) {
  if (!ADZUNA_ID || !ADZUNA_KEY) return [];
  const what = encodeURIComponent(keywords.slice(0, 3).join(" "));
  const where = encodeURIComponent(location);
  const url = `https://api.adzuna.com/v1/api/jobs/br/search/1?app_id=${ADZUNA_ID}&app_key=${ADZUNA_KEY}&what=${what}&where=${where}&results_per_page=10&content-type=application/json`;
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    return (data.results || []).map((j: any) => ({
      external_id: String(j.id),
      source: "adzuna",
      title: j.title,
      company: j.company?.display_name || null,
      location: j.location?.display_name || location,
      url: j.redirect_url,
      description: (j.description || "").slice(0, 2000),
      salary_min: j.salary_min || null,
      salary_max: j.salary_max || null,
    }));
  } catch { return []; }
}

// ---------- FONTE 2: LinkedIn Jobs RSS (público, sem auth) ----------
async function searchLinkedInRSS(keywords: string[], location: string) {
  // LinkedIn expõe um endpoint público de busca usado pelos feeds
  const kw = encodeURIComponent(keywords.slice(0, 3).join(" "));
  const loc = encodeURIComponent(location);
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${kw}&location=${loc}&start=0`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return [];
    const html = await r.text();
    const jobs: any[] = [];
    // Parse dos cards de vaga no HTML retornado
    const cardRegex = /<li[\s\S]*?<\/li>/g;
    const cards = html.match(cardRegex) || [];
    for (const card of cards.slice(0, 10)) {
      const title = (card.match(/class="base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\//) || [])[1]?.trim();
      const company = (card.match(/class="base-search-card__subtitle[^"]*"[\s\S]*?>([\s\S]*?)<\/a/) || [])[1]?.trim();
      const loc2 = (card.match(/class="job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\//) || [])[1]?.trim();
      const link = (card.match(/href="(https:\/\/[^"]*linkedin\.com\/jobs\/view[^"]*)"/) || [])[1];
      const jobId = (link?.match(/view\/[^\/]*?(\d+)/) || [])[1];
      if (title && link) {
        jobs.push({
          external_id: jobId || link,
          source: "linkedin_rss",
          title: title.replace(/<[^>]+>/g, ""),
          company: company?.replace(/<[^>]+>/g, "") || null,
          location: loc2?.replace(/<[^>]+>/g, "") || location,
          url: link.split("?")[0],
          description: null,
          salary_min: null,
          salary_max: null,
        });
      }
    }
    return jobs;
  } catch { return []; }
}

// ---------- FONTE 3: Remotive (vagas remotas, API pública) ----------
async function searchRemotive(keywords: string[]) {
  const search = encodeURIComponent(keywords.slice(0, 2).join(" "));
  try {
    const r = await fetch(`https://remotive.com/api/remote-jobs?search=${search}&limit=10`);
    if (!r.ok) return [];
    const data = await r.json();
    return (data.jobs || []).map((j: any) => ({
      external_id: String(j.id),
      source: "remotive",
      title: j.title,
      company: j.company_name || null,
      location: "Remoto",
      url: j.url,
      description: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 2000),
      salary_min: null,
      salary_max: null,
    }));
  } catch { return []; }
}

// ---------- MATCH SCORE com Claude ----------
async function scoreJobs(cvText: string, jobs: any[]) {
  if (jobs.length === 0) return jobs;
  const jobsList = jobs.map((j, i) =>
    `[${i}] ${j.title} — ${j.company || "?"} — ${j.location || "?"}\n${(j.description || "").slice(0, 300)}`
  ).join("\n\n");

  const prompt = `Você é um especialista em recrutamento. Avalie o match entre o perfil do candidato e cada vaga.

PERFIL DO CANDIDATO (resumo do CV):
${cvText.slice(0, 2000)}

VAGAS:
${jobsList}

Responda APENAS com JSON válido (array, mesma ordem das vagas):
[{"index": 0, "score": <0-100>, "reasons": ["razão 1", "razão 2"]}]`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await r.json();
    const text = data.content[0].text.replace(/```json|```/g, "").trim();
    const scores = JSON.parse(text);
    for (const s of scores) {
      if (jobs[s.index]) {
        jobs[s.index].match_score = s.score;
        jobs[s.index].match_reasons = s.reasons;
      }
    }
  } catch (e) {
    console.error("Score error:", e);
  }
  return jobs;
}

// ---------- HANDLER ----------
Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { profile_id } = await req.json();

    // Carregar perfil
    const { data: profile, error } = await supabase
      .from("profiles").select("*").eq("id", profile_id).single();
    if (error || !profile) throw new Error("Perfil não encontrado");

    const keywords = profile.keywords?.length ? profile.keywords : ["product manager"];
    const location = profile.locations?.[0] || "São Paulo";

    // Buscar em todas as fontes em paralelo
    const [adzuna, linkedin, remotive] = await Promise.all([
      searchAdzuna(keywords, location),
      searchLinkedInRSS(keywords, location),
      searchRemotive(keywords),
    ]);

    let allJobs = [...adzuna, ...linkedin, ...remotive];

    // Score com Claude
    allJobs = await scoreJobs(profile.cv_text || "", allJobs);

    // Salvar no banco (upsert para dedupe)
    let saved = 0;
    for (const job of allJobs) {
      const { error: insErr } = await supabase.from("jobs").upsert(
        { ...job, profile_id },
        { onConflict: "profile_id,external_id,source", ignoreDuplicates: true }
      );
      if (!insErr) saved++;
    }

    return new Response(JSON.stringify({
      found: allJobs.length,
      saved,
      sources: { adzuna: adzuna.length, linkedin: linkedin.length, remotive: remotive.length },
      jobs: allJobs.sort((a, b) => (b.match_score || 0) - (a.match_score || 0)),
    }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
