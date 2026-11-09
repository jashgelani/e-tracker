const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const safeUrl = (u) => (/^https?:\/\//.test(u) ? esc(u) : "#");

export function toMarkdown({ date, industry, result, health }) {
  const L = [`# SaaS ideas — ${date}`, `Focus industry: **${industry.name}**`, ""];
  if (!result.ideas.length) L.push("_No idea passed the evidence check today._", "");
  result.ideas.forEach((i, n) => {
    const p = i.path_to_30k_mrr || {};
    L.push(
      `## ${n + 1}. ${i.name}${i.name === result.top_pick ? " ⭐ top pick" : ""}  (score ${i.total_score}/50, confidence ${i.confidence})`,
      `**${i.one_liner}**`, "",
      `- Buyer: ${i.target_customer}`,
      `- Math: $${p.price_per_month}/mo × ${p.customers_needed} customers ≈ $30k MRR · channel: ${p.acquisition_channel}`,
      `- Build: ${i.build_difficulty}, ~${i.days_to_mvp} days to MVP`,
      `- Why now: ${i.why_now}`,
      `- Biggest risk: ${i.biggest_risk}`, "",
      "**Evidence**", ...(i.pain_evidence || []).map((e) => `- ${e.summary} ([${e.source}](${e.url}))`), "",
      "**Alternatives**", ...(i.existing_alternatives || []).map((a) => `- ${a.name}: ${a.weakness}`), "",
      "**MVP**", ...(i.mvp_scope || []).map((x) => `- ${x}`), "",
      "**7-day validation**", ...(i.validation_plan_7_days || []).map((x, k) => `${k + 1}. ${x}`), "",
    );
  });
  if (result.analyst_note) L.push(`> ${result.analyst_note}`, "");
  L.push("Source health: " + Object.entries(health).map(([k, v]) => `${k} ${v.ok ? "✓" + v.count : "✗"}`).join(", "));
  return L.join("\n");
}

export function toHtml({ date, industry, result, health }) {
  const card = (i, n) => {
    const p = i.path_to_30k_mrr || {};
    const list = (arr, f) => `<ul style="margin:4px 0 12px;padding-left:18px">${(arr || []).map((x) => `<li>${f(x)}</li>`).join("")}</ul>`;
    return `<div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:16px 0">
<h2 style="margin:0 0 4px;font-size:18px">${n + 1}. ${esc(i.name)}${i.name === result.top_pick ? " ⭐" : ""}
<span style="font-size:12px;color:#64748b;font-weight:normal"> score ${i.total_score}/50 · ${esc(i.confidence)} confidence</span></h2>
<p style="margin:0 0 10px"><b>${esc(i.one_liner)}</b></p>
<p style="margin:0 0 10px;font-size:14px">Buyer: ${esc(i.target_customer)}<br>
Math: <b>$${esc(p.price_per_month)}/mo × ${esc(p.customers_needed)}</b> customers ≈ $30k MRR · ${esc(p.acquisition_channel)}<br>
Build: ${esc(i.build_difficulty)}, ~${esc(i.days_to_mvp)} days · Why now: ${esc(i.why_now)}<br>
<span style="color:#b91c1c">Risk: ${esc(i.biggest_risk)}</span></p>
<b style="font-size:13px">Evidence</b>${list(i.pain_evidence, (e) => `${esc(e.summary)} (<a href="${safeUrl(e.url)}">${esc(e.source)}</a>)`)}
<b style="font-size:13px">Alternatives</b>${list(i.existing_alternatives, (a) => `${esc(a.name)}: ${esc(a.weakness)}`)}
<b style="font-size:13px">MVP</b>${list(i.mvp_scope, esc)}
<b style="font-size:13px">7-day validation</b>${list(i.validation_plan_7_days, esc)}
</div>`;
  };
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:680px;margin:auto;color:#0f172a;line-height:1.45">
<h1 style="font-size:22px;margin-bottom:2px">SaaS ideas — ${esc(date)}</h1>
<p style="margin:0;color:#64748b">Focus: ${esc(industry.name)}</p>
${result.ideas.length ? result.ideas.map(card).join("") : "<p><i>No idea passed the evidence check today.</i></p>"}
${result.analyst_note ? `<p style="background:#f1f5f9;padding:10px;border-radius:8px">${esc(result.analyst_note)}</p>` : ""}
<p style="font-size:12px;color:#94a3b8">Sources: ${Object.entries(health).map(([k, v]) => `${esc(k)} ${v.ok ? "✓ " + v.count : "✗"}`).join(" · ")}.<br>
Ideas are AI-analysed from public signals. Validate before building; nothing here guarantees revenue.</p></div>`;
}
