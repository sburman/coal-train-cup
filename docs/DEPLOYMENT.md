# Vercel deployment (Hobby)

## Run locally first

1. **Environment**
   - **Option A**: From existing Streamlit secrets:
     ```bash
     make env-local
     ```
     This reads `.streamlit/secrets.toml` and writes `.env.local` (Google + NRL + salt).
   - **Option B**: Manual:
     - Copy `.env.local.example` to `.env.local`
     - Set `GOOGLE_SERVICE_ACCOUNT_JSON` (full service account JSON string), `NRL_AUTH`, and optionally `PIN_SALT`, `GOOGLE_SPREADSHEET_ID`.

2. **Install and run**
   ```bash
   npm install
   npm run dev
   ```
   Or in one step: `make run-web` (installs deps, runs `env-local` if `.env.local` is missing, then `npm run dev`).

3. **Use the app**
   - Open http://localhost:3000
   - Home stats and any API that hits Google Sheets or NRL will use the credentials from `.env.local`.

---

## Prerequisites (for deploy)

- Vercel account (Hobby plan)
- Google Cloud project with Sheets API and Drive API enabled
- Service account key (JSON) with access to the spreadsheet(s)
- NRL API auth token (if using games refresh / Siliva Shield players)

## Environment variables

Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON string of the service account key (private_key, client_email, etc.) |
| `GOOGLE_SPREADSHEET_ID` | (Optional) ID of the main spreadsheet. If unset, the app resolves by name via Drive API. |
| `NRL_AUTH` | Authorization header value for the NRL stats API (e.g. `Bearer …`) |
| `PIN_SALT` | (Optional) Salt for user PIN derivation. Defaults to `default-salt`. |
| `CRON_SECRET` | (Optional) Secret for cron endpoint. If set, requests to `/api/cron/warm` must send `Authorization: Bearer <CRON_SECRET>`. |

## Deploy

1. Connect the repo to Vercel (GitHub/GitLab).
2. Framework preset: **Next.js**. Root directory: repo root.
3. Build command: `npm run build`. Output: `.next`.
4. Add all environment variables above.
5. Deploy. The app will be served at `*.vercel.app`.

## Cron (Hobby)

- One cron is configured: `/api/cron/warm` runs daily at 06:00 UTC.
- It warms the in-memory caches (users, tips, games) so the first user requests after a cold start are faster.
- On Hobby, cron can run at most **once per day**. More frequent schedules are not supported.

## Side-by-side validation

1. Deploy the Next.js app to a Vercel preview URL.
2. Run the existing Streamlit app locally (or on a separate host).
3. For a fixed round and a known user email, compare:
   - Leaderboard order and points (GET `/api/leaderboard?round=N` vs Streamlit leaderboard).
   - User tips view (GET `/api/user-tips?email=…` vs Streamlit “2026 tips by user”).
4. After validation, point your domain to the Vercel deployment and retire the Streamlit deployment.

## Rollback

- In Vercel, open Deployments and promote a previous deployment to Production.
- Or revert the Git branch and redeploy.
