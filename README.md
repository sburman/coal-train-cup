# Coal Train Cup

Application for managing the Coal Train Cup tipping competition.

## Web app (Next.js)

The app is Next.js (Vercel-ready, mobile-friendly).

- **Run locally**: `make run-web` or `npm run dev` and open http://localhost:3000
- **Build**: `npm run build && npm start`
- **Lint**: `npm run lint`
- **Tests**: `npm test`
- **Deploy**: see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

Data is read from and written to Google Sheets. Required env vars:
- `GOOGLE_SERVICE_ACCOUNT_JSON` (or `GOOGLE_SERVICE_ACCOUNT_JSON_B64`)
- `NRL_AUTH`

Optional env vars:
- `GOOGLE_SPREADSHEET_ID`
- `PIN_SALT`
- `CRON_SECRET`
