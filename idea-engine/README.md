# SaaS Idea Engine

Every morning a GitHub Actions job collects real demand signals, has Claude analyse them, and emails you up to 3 scored SaaS ideas. A markdown copy is committed to `ideas/`. You only read the email.

## How it works

1. **Pick the focus industry.** It rotates through 38 industries in `src/industries.mjs`, so every sector gets covered.
2. **Collect signals** from:
   - Hacker News: "is there a tool", "I wish there was" and similar posts.
   - Reddit: complaint and "looking for software" posts in industry subreddits.
   - Product Hunt: new launches, to show competition.
   - App Store: 1-2★ reviews of existing software.
   - Google autocomplete: what people actually type. This is a proxy only and gives no search volumes.
   - Optionally, Claude's web search checks G2/Capterra complaints and competitor pricing.
3. **Claude scores the ideas.** It rates demand, willingness to pay, competition gap, buildability and distribution. It also works out the path to about $30k MRR (price × customers) and a 7-day, near-zero-cost validation plan.
4. **Evidence gate.** Any cited URL that wasn't in the collected signals or the search results is discarded. An idea with fewer than 2 verified evidence links is dropped. On a weak-data day you may get fewer than 3 ideas, or none, rather than invented ones.
5. **De-duplication.** `data/history.json` stops past ideas from repeating.

## Setup (about 5 minutes, once)

1. Merge this to your default branch. GitHub only runs scheduled workflows from the default branch.
2. Get the keys:
   - `ANTHROPIC_API_KEY` from console.anthropic.com. Expect roughly $0.10–0.50 per day.
   - `RESEND_API_KEY` from resend.com (free tier). With the default sender `onboarding@resend.dev` you can only email the address you signed up with. To send elsewhere, verify a domain and set the repo variable `RESEND_FROM`.
3. In the repo, go to Settings → Secrets and variables → Actions → Secrets and add `ANTHROPIC_API_KEY`, `RESEND_API_KEY` and `EMAIL_TO`. `EMAIL_TO` takes comma-separated addresses.
4. Run it once from the Actions tab → "Daily SaaS ideas" → Run workflow, to confirm the email arrives.
5. Optional: add `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` (a free "script" app at reddit.com/prefs/apps). Reddit often blocks the public JSON endpoint from cloud IPs, so these make Reddit reliable.

To change the delivery time, edit the cron line in `.github/workflows/daily-ideas.yml`. Cron uses UTC, and GitHub can delay a run by 10–30 minutes.

## Local test (no keys needed)

```
cd idea-engine
npm run mock
```

This runs the scoring, evidence gate and render with fake data. It also shows a hallucinated URL being dropped.

## Settings

| Env or variable | Meaning |
|---|---|
| `INDUSTRY` | Force a focus industry, e.g. `Dentistry` |
| `ENABLE_WEB_SEARCH=0` | Turn off Claude web search (cheaper) |
| `CLAUDE_MODEL` | Override the model |

## Caveats

- No tool can guarantee $1k/day. These are researched hypotheses. The 7-day validation plan in each email is the step that tells you whether to build.
- Public signals skew toward tech-savvy communities. Offline-heavy industries produce thinner data, and the email's source-health line tells you what worked that day.
