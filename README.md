# Coal Train Cup

Application for managing the Coal Train Cup tipping competition.

## Web app (Next.js)

The main UI is a Next.js app (Vercel-ready, mobile-friendly).

- **Run locally**: `make run-web` (or `make env-local` then `npm run dev`). Open http://localhost:3000. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#run-locally-first) for env setup.
- **Build**: `npm run build && npm start`
- **Tests**: `npm test`
- **Deploy**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Vercel Hobby setup, env vars, and cron.

Data is read from and written to **Google Sheets** (same as the legacy Streamlit app). Env vars required: `GOOGLE_SERVICE_ACCOUNT_JSON`, and optionally `GOOGLE_SPREADSHEET_ID`, `NRL_AUTH`, `PIN_SALT`, `CRON_SECRET`.

## Legacy Streamlit app

The previous UI lives in `app.py` and can still be run with Poetry: `poetry run streamlit run app.py`. It shares the same Google Sheets backend.
