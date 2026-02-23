# Vercel-only cache strategy

## In-memory TTL cache (`lib/cache.ts`)

In **Next.js dev**, hot reload normally re-runs modules and clears the cache every time, so each request could hit Google Sheets and you can hit **429 (rate limit)**. The cache is therefore attached to `globalThis` so it survives HMR and behaves more like Streamlit’s 8h cache. If you still see 429, wait ~1 minute (Sheets quota is per minute); the Sheets client will retry once after 65s on 429.

- **Scope**: Per serverless instance. Not shared across invocations or regions.
- **Keys**: `data:users`, `data:games:{spreadsheetName}`, `data:tips:{spreadsheetName}`, `data:shield:...`, `data:players:{round}`, `lb:full:...`, `lb:legacy:...`.
- **TTLs**: 8h for users, games, tips, leaderboard; 10min for players-in-round; 24h for shield winners.

## Invalidation on writes

| Write | Invalidated keys |
|-------|------------------|
| Submit tip (POST /api/submit-tip, POST /api/tips) | `data:tips` (current sheet), `lb:full:...`, `lb:legacy:...` |
| Submit shield tip (POST /api/siliva-shield/submit) | Shield winners cache for that round (via TTL; no explicit invalidation) |
| Games refresh (inside `allGames()`) | N/A (cache is updated with new data after save) |

## HTTP cache headers

- Read APIs can set `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` so the edge can serve stale while revalidating.
- Optional: add to GET /api/stats, /api/leaderboard, /api/leaderboard/2025 when you want CDN caching.

## Cron warm-up

- Use Vercel cron (daily on Hobby) to hit `/api/stats` and optionally `/api/tipping/current-round` so cold starts see a warm cache sooner.
