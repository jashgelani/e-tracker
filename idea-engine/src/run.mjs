import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pickIndustry } from "./industries.mjs";
import { collectSignals } from "./sources.mjs";
import { analyze, verify } from "./llm.mjs";
import { toHtml, toMarkdown } from "./render.mjs";
import { sendEmail } from "./email.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const mock = args.has("--mock");
const date = new Date().toISOString().slice(0, 10);

const histPath = join(root, "data/history.json");
const history = JSON.parse(await readFile(histPath, "utf8").catch(() => '{"ideas":[]}'));
const industry = pickIndustry();
console.log(`Date ${date} · industry: ${industry.name}${mock ? " · MOCK" : ""}`);

let signals, health, parsed, searchUrls = new Set();
if (mock) {
  signals = [
    { source: "Mock", title: "Dentists hate chasing insurance claims", text: "", url: "https://example.com/a", score: 9 },
    { source: "Mock", title: "Is there a tool to auto-chase unpaid claims?", text: "", url: "https://example.com/b", score: 7 },
  ];
  health = { Mock: { ok: true, count: 2 } };
  parsed = {
    ideas: [{
      name: "ClaimChaser", one_liner: "Auto-follows up on unpaid insurance claims for dental clinics", industry: industry.name,
      target_customer: "Practice manager",
      pain_evidence: [
        { summary: "Complaint", url: "https://example.com/a", source: "Mock" },
        { summary: "Request", url: "https://example.com/b", source: "Mock" },
        { summary: "Hallucinated", url: "https://fake.invalid/x", source: "Mock" },
      ],
      why_now: "LLMs can read EOBs", existing_alternatives: [{ name: "Incumbent", weakness: "pricey" }],
      path_to_30k_mrr: { price_per_month: 149, customers_needed: 202, acquisition_channel: "dental FB groups" },
      mvp_scope: ["Inbox parser"], build_difficulty: "medium", days_to_mvp: 21,
      validation_plan_7_days: ["Interview 10 managers"],
      scores: { demand: 7, willingness_to_pay: 8, competition_gap: 6, buildability: 7, distribution: 6 },
      biggest_risk: "HIPAA", confidence: "medium",
    }],
    analyst_note: "Mock run.",
  };
} else {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  ({ signals, health } = await collectSignals(industry));
  console.log(`Collected ${signals.length} signals`, health);
  ({ parsed, searchUrls } = await analyze({
    industry, signals, history: history.ideas.map((i) => i.name),
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.CLAUDE_MODEL || "claude-sonnet-5-5",
    webSearch: process.env.ENABLE_WEB_SEARCH !== "0",
  }));
}

const result = verify(parsed, signals, searchUrls);
console.log(`Verified ${result.ideas.length} idea(s), dropped ${result.dropped}`);

const ctx = { date, industry, result, health };
const md = toMarkdown(ctx);
const subject = result.ideas.length
  ? `💡 ${result.ideas[0].name}: ${result.ideas[0].one_liner}`.slice(0, 120)
  : `SaaS ideas ${date}: nothing strong today`;

if (mock) console.log("\n" + md);
if (!args.has("--no-archive")) {
  await writeFile(join(root, `ideas/${date}.md`), md + "\n");
  history.ideas.push(...result.ideas.map((i) => ({ name: i.name, date })));
  await writeFile(histPath, JSON.stringify(history, null, 2) + "\n");
}
if (!args.has("--no-email")) {
  await sendEmail({ subject, html: toHtml(ctx), text: md });
  console.log("Email sent");
}
