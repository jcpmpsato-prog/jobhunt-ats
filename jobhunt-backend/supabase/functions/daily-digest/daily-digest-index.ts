// ============================================
// JOB HUNT ATS — Edge Function: daily-digest
// Envia e-mail diário com as melhores vagas encontradas
// Deploy: supabase functions deploy daily-digest
// Agendamento: configurado via pg_cron (ver setup.md)
// ============================================
// Secrets necessários:
//   RESEND_API_KEY  (gratuito em resend.com — 3.000 emails/mês)
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://vslrnhuzzyltzhbzzdcc.supabase.co";
const SUPABASE_KEY = "sb_secret_TP-7jdwBf6rrtVbxkVk8uA_S83d0jn-";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;

function jobCard(job: any): string {
  const score = job.match_score || 0;
  const color = score >= 70 ? "#10d9a0" : score >= 50 ? "#fbbf24" : "#f87171";
  const salary = job.salary_min
    ? `<div style="color:#10d9a0;font-size:13px;margin-top:4px">💰 R$ ${Math.round(job.salary_min).toLocaleString("pt-BR")}${job.salary_max ? " – R$ " + Math.round(job.salary_max).toLocaleString("pt-BR") : "+"}${job.salary_estimated ? " (estimado)" : ""}</div>`
    : "";
  const reasons = (job.match_reasons || []).slice(0, 2).map((r: string) =>
    `<li style="color:#94a3b8;font-size:12px">${r}</li>`).join("");
  return `
  <div style="background:#0d1424;border:1px solid #1e293b;border-radius:12px;padding:18px;margin-bottom:14px">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="font-size:16px;font-weight:700;color:#f1f5f9">${job.title}</div>
        <div style="font-size:13px;color:#64748b;margin-top:2px">${job.company || ""} · ${job.location || ""} · via ${job.source}</div>
        ${salary}
        ${reasons ? `<ul style="margin:8px 0 0;padding-left:18px">${reasons}</ul>` : ""}
      </td>
      <td width="60" align="right" valign="top">
        <div style="background:${color}20;color:${color};border:1px solid ${color}50;border-radius:50%;width:48px;height:48px;line-height:48px;text-align:center;font-weight:800;font-size:14px">${score}%</div>
      </td>
    </tr></table>
    <a href="${job.url}" style="display:inline-block;margin-top:12px;background:linear-gradient(135deg,#00e5ff,#0080ff);color:#000;text-decoration:none;font-weight:700;font-size:13px;padding:8px 20px;border-radius:999px">Ver vaga →</a>
  </div>`;
}

function buildEmail(name: string, jobs: any[]): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:#050912;font-family:Arial,Helvetica,sans-serif;padding:24px">
  <div style="max-width:600px;margin:0 auto">
    <div style="text-align:center;padding:24px 0">
      <div style="font-size:22px;font-weight:800;color:#00e5ff">⚡ JOB HUNT ATS</div>
      <div style="font-size:11px;color:#64748b;letter-spacing:2px;text-transform:uppercase">Suas vagas do dia</div>
    </div>
    <p style="color:#94a3b8;font-size:14px">Olá${name ? " " + name : ""}! Encontramos <strong style="color:#00e5ff">${jobs.length} vagas</strong> compatíveis com seu perfil nas últimas 24h:</p>
    ${jobs.map(jobCard).join("")}
    <div style="text-align:center;padding:24px 0;color:#475569;font-size:11px">
      JOB HUNT ATS · <a href="https://jobhuntats.netlify.app" style="color:#00e5ff">jobhuntats.netlify.app</a>
    </div>
  </div></body></html>`;
}

Deno.serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // Buscar todos os perfis com digest ativado
    const { data: profiles } = await supabase
      .from("profiles").select("*").eq("daily_digest", true);

    const results: any[] = [];

    for (const profile of profiles || []) {
      // Vagas ainda não enviadas, ordenadas por score
      const { data: jobs } = await supabase
        .from("jobs")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("sent_in_digest", false)
        .order("match_score", { ascending: false })
        .limit(8);

      if (!jobs || jobs.length === 0) {
        results.push({ email: profile.email, sent: false, reason: "sem vagas novas" });
        continue;
      }

      // Enviar via Resend
      const emailResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Job Hunt ATS <onboarding@resend.dev>",
          to: [profile.email],
          subject: `⚡ ${jobs.length} novas vagas para você — ${new Date().toLocaleDateString("pt-BR")}`,
          html: buildEmail(profile.full_name, jobs),
        }),
      });

      if (emailResp.ok) {
        // Marcar como enviadas
        const ids = jobs.map((j) => j.id);
        await supabase.from("jobs").update({ sent_in_digest: true }).in("id", ids);
        await supabase.from("digest_log").insert({ profile_id: profile.id, jobs_count: jobs.length });
        results.push({ email: profile.email, sent: true, jobs: jobs.length });
      } else {
        const err = await emailResp.text();
        results.push({ email: profile.email, sent: false, reason: err });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
