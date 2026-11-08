// Demand-signal collectors. Every collector is failure-tolerant: a blocked or
// changed source returns [] and is reported in the digest footer, never crashes the run.
import { GENERAL_SUBS } from "./industries.mjs";

const UA = "saas-idea-engine/1.0 (daily research bot)";
const DAYS = 21;

async function getJson(url, headers = {}, timeoutMs = 15000) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json", ...headers }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${new URL(url).host}`);
  return res.json();
}
async function getText(url, headers = {}, timeoutMs = 15000) {
  const res = await fetch(url, { headers: { "User-Agent": UA, ...headers }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${new URL(url).host}`);
  return res.text();
}
const clip = (s, n = 300) => (s || "").replace(/\s+/g, " ").trim().slice(0, n);
const sinceUnix = () => Math.floor(Date.now() / 1000) - DAYS * 86400;

// ---- Hacker News (Algolia, free, no key) ----
export async function hackerNews(industry) {
  const queries = [
    "Ask HN is there a tool",
    "Ask HN how do you manage",
    "I wish there was",
    "frustrated with",
    "alternative to",
    ...industry.terms,
  ];
  const out = [];
  for (const q of queries) {
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(q)}&tags=story&numericFilters=created_at_i>${sinceUnix()}&hitsPerPage=8`;
    const j = await getJson(url);
    for (const h of j.hits || []) {
      if (!h.title) continue;
      out.push({
        source: "Hacker News",
        title: clip(h.title, 160),
        text: clip(h.story_text, 400),
        url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        score: (h.points || 0) + (h.num_comments || 0) * 2,
      });
    }
  }
  return out;
}

// ---- Reddit (OAuth if creds present, else public JSON which is often blocked on cloud IPs) ----
let redditToken = null;
async function redditAuth() {
  const { REDDIT_CLIENT_ID: id, REDDIT_CLIENT_SECRET: secret } = process.env;
  if (!id || !secret) return null;
  if (redditToken) return redditToken;
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"), "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Reddit auth HTTP ${res.status}`);
  redditToken = (await res.json()).access_token;
  return redditToken;
}

export async function reddit(industry) {
  const token = await redditAuth();
  const base = token ? "https://oauth.reddit.com" : "https://www.reddit.com";
  const headers = token ? { Authorization: `bearer ${token}` } : {};
  const subs = [...new Set([...(industry.subs || []).slice(0, 3), ...GENERAL_SUBS.slice(0, 2)])];
  const q = '("is there a tool" OR "wish there was" OR "looking for software" OR "how do you handle" OR "alternative to" OR "too expensive" OR "frustrated")';
  const out = [];
  let lastErr;
  for (const sub of subs) {
    try {
      const j = await getJson(`${base}/r/${sub}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=new&t=month&limit=10`, headers);
      for (const c of j.data?.children || []) {
        const d = c.data;
        out.push({
          source: `Reddit r/${sub}`,
          title: clip(d.title, 160),
          text: clip(d.selftext, 400),
          url: `https://www.reddit.com${d.permalink}`,
          score: (d.score || 0) + (d.num_comments || 0) * 2,
        });
      }
    } catch (e) { lastErr = e; }
  }
  if (!out.length && lastErr) throw lastErr;
  return out;
}

// ---- Product Hunt feed: what's launching = competition / what's hot ----
export async function productHunt() {
  const xml = await getText("https://www.producthunt.com/feed");
  const out = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const title = /<title>([\s\S]*?)<\/title>/.exec(e)?.[1];
    const link = /<link[^>]*href="([^"]+)"/.exec(e)?.[1];
    const body = /<content[^>]*>([\s\S]*?)<\/content>/.exec(e)?.[1] || "";
    if (!title || !link) continue;
    out.push({
      source: "Product Hunt launch",
      title: clip(decode(title), 120),
      text: clip(decode(body).replace(/<[^>]+>/g, " "), 300),
      url: link,
      score: 1,
    });
  }
  return out.slice(0, 15);
}
const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

// ---- App Store low-star reviews of existing software in the industry ----
export async function appStoreReviews(industry) {
  const out = [];
  for (const term of industry.terms.slice(0, 2)) {
    const s = await getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(term + " software")}&entity=software&limit=3&country=us`);
    for (const app of s.results || []) {
      try {
        const r = await getJson(`https://itunes.apple.com/us/rss/customerreviews/page=1/id=${app.trackId}/sortby=mostrecent/json`);
        for (const e of (r.feed?.entry || []).slice(1)) {
          const rating = Number(e["im:rating"]?.label);
          if (rating > 2) continue;
          out.push({
            source: `App Store review (${app.trackName}, ${rating}★)`,
            title: clip(e.title?.label, 120),
            text: clip(e.content?.label, 400),
            url: app.trackViewUrl,
            score: 3,
          });
        }
      } catch { /* one app failing is fine */ }
    }
  }
  return out;
}

// ---- Google autocomplete: free demand proxy (no volumes; shows what people actually type) ----
export async function autocomplete(industry) {
  const out = [];
  for (const term of industry.terms) {
    for (const stem of [`${term} software`, `${term} app to`, `best tool for ${term}`, `${term} automation`]) {
      try {
        const j = await getJson(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(stem)}`);
        for (const s of (j[1] || []).slice(0, 6)) {
          out.push({ source: "Google autocomplete", title: s, text: `Seen as a completion of "${stem}"`, url: `https://www.google.com/search?q=${encodeURIComponent(s)}`, score: 1 });
        }
      } catch { /* skip */ }
    }
  }
  return out;
}

export async function collectSignals(industry) {
  const jobs = {
    "Hacker News": () => hackerNews(industry),
    Reddit: () => reddit(industry),
    "Product Hunt": () => productHunt(),
    "App Store reviews": () => appStoreReviews(industry),
    "Google autocomplete": () => autocomplete(industry),
  };
  const health = {};
  const signals = [];
  await Promise.all(
    Object.entries(jobs).map(async ([name, fn]) => {
      try {
        const rows = await fn();
        health[name] = { ok: true, count: rows.length };
        signals.push(...rows);
      } catch (e) {
        health[name] = { ok: false, error: String(e.message || e) };
      }
    }),
  );
  const seen = new Set();
  const unique = signals.filter((s) => (seen.has(s.url + s.title) ? false : seen.add(s.url + s.title)));
  unique.sort((a, b) => b.score - a.score);
  return { signals: unique.slice(0, 80), health };
}
