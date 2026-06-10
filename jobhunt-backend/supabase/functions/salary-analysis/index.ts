// ============================================
// JOB HUNT ATS — Edge Function: salary-analysis
// Analisa faixa salarial de mercado para uma vaga usando
// Claude com web search nativo
// Deploy: supabase functions deploy salary-analysis
// ============================================
// Secrets necessários:
//   ANTHROPIC_API_KEY
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

Deno.serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { job_id } = await req.json();

    // Carregar vaga
    const { data: job, error } = await supabase
      .from("jobs").select("*").eq("id", job_id).single();
    if (error || !job) throw new Error("Vaga não encontrada");

    // Já existe análise?
    const { data: existing } = await supabase
      .from("salary_analyses").select("*").eq("job_id", job_id).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify(existing), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const prompt = `Pesquise na web a faixa salarial de mercado atual no Brasil para esta posição:

CARGO: ${job.title}
EMPRESA: ${job.company || "não informada"}
LOCALIZAÇÃO: ${job.location || "Brasil"}
${job.salary_min ? `SALÁRIO ANUNCIADO: R$ ${job.salary_min}${job.salary_max ? " - R$ " + job.salary_max : ""}` : "SALÁRIO: não divulgado"}

Pesquise em fontes como Glassdoor, Salario.com.br, Catho, Vagas.com e Levels.fyi.

Depois responda APENAS com JSON válido:
{
  "market_min": <salário mensal mínimo em BRL, número>,
  "market_median": <mediana mensal em BRL, número>,
  "market_max": <máximo mensal em BRL, número>,
  "analysis": "<2-3 frases: como o salário anunciado (se houver) se compara ao mercado, e dica de negociação>",
  "sources": ["<fonte 1>", "<fonte 2>"]
}`;

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
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(data));

    // Resposta pode ter múltiplos blocos (tool use + text) — pegar o último texto
    const textBlocks = (data.content || []).filter((b: any) => b.type === "text");
    const lastText = textBlocks[textBlocks.length - 1]?.text || "";
    const jsonMatch = lastText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Resposta sem JSON");
    const parsed = JSON.parse(jsonMatch[0]);

    // Salvar análise
    const { data: saved } = await supabase.from("salary_analyses").insert({
      job_id,
      market_min: parsed.market_min,
      market_median: parsed.market_median,
      market_max: parsed.market_max,
      analysis: parsed.analysis,
      sources: parsed.sources || [],
    }).select().single();

    // Atualizar vaga com salário estimado se não tinha
    if (!job.salary_min && parsed.market_median) {
      await supabase.from("jobs").update({
        salary_min: parsed.market_min,
        salary_max: parsed.market_max,
        salary_estimated: true,
      }).eq("id", job_id);
    }

    return new Response(JSON.stringify(saved), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
