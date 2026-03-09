# Siliva Shield Reference

This document captures the Siliva Shield behavior and historical implementation details so it can be rebuilt quickly in future seasons.

## What Siliva Shield Is

Siliva Shield is a **finals-only knockout side competition** that is different from the weekly Coal Train Cup tipping flow.

## How Siliva Shield Differs From Coal Train Cup

- **Eligibility gate:** only previous-round winners can submit in the next Shield round.
- **Selection type:** users submit a **team winner + tryscorer** (not a normal home/away tip).
- **No repeats across finals:** user cannot reuse previously selected team/tryscorer across finals weeks.
- **Limited team pool (late finals):** in the current implementation, available teams are hardcoded for the finals week.
- **Tie-break field:** `match_total` is collected for Finals Week 4 (`THIS_WEEK === 31`).
- **Data source shape:** winners are read from `Winners - Shield Round {N}`, submissions are written to `Shield Round {N}` sheets.

## Current Web App Flow (TypeScript)

- Page: `app/siliva-shield/page.tsx`
- APIs:
  - `GET /api/siliva-shield/players?round=N`
  - `GET /api/siliva-shield/winners?round=N`
  - `POST /api/siliva-shield/submit`
- Storage:
  - Read winners via `lib/sheets.ts` -> `loadShieldWinners()` from `Winners - Shield Round {round}`
  - Write submissions via `appendShieldTipToSheet()` to `Shield Round {round}`

## Data Model

From `lib/types.ts`:

```ts
export interface UserShieldTip {
  email: string;
  season: number;
  round: number;
  team: string;
  tryscorer: string;
  match_total: number | null;
  tipped_at: string;
}
```

## Worksheet Conventions

- **Read winners:** `Winners - Shield Round 28`, `29`, `30`, etc.
- **Write tips:** `Shield Round 31` (or current finals week).
- **Expected columns:** `email, season, round, team, tryscorer, match_total, tipped_at`

## Known Peculiarities / Design Constraints

- Winners list is **precomputed elsewhere** and read-only from the app perspective.
- Eligibility logic depends on winners sheet quality; if winners are stale/missing, valid users may be blocked.
- Player list comes from NRL API by round and can vary as lineups update.
- Finals week constants are currently hardcoded in UI (`THIS_WEEK`, fixed available teams).

## Legacy Python Reference (for future rebuilds)

Below are preserved examples from the old Streamlit codebase for parity/reference.

### 1) Winners Loader (`Winners - Shield Round N`)

```python
@st.cache_data(ttl=60 * 60 * 24)
def __last_round_winners(round: int) -> list[UserShieldTip]:
    df: pd.DataFrame = worksheet_to_dataframe(
        SPREADSHEET_NAME, f"Winners - Shield Round {round}"
    )

    winners = []
    for _, row in df.iterrows():
        winner = UserShieldTip(
            email=row["email"],
            season=int(row["season"]),
            round=int(row["round"]),
            team=row["team"],
            tryscorer=row["tryscorer"],
            tipped_at=pd.to_datetime(row["tipped_at"]),
        )
        winners.append(winner)

    return winners
```

### 2) Eligibility + No-Repeat Filtering

```python
user_last_round_winners = [
    winner for winner in last_round_winners if winner.email == email
]
if not user_last_round_winners:
    st.error("Only previous round winners can continue in the Siliva Shield.")
    st.stop()

last_weeks_selection = user_last_round_winners[0]
unavailable_teams = [last_weeks_selection.team]
unavailable_tryscorers = [last_weeks_selection.tryscorer]

earlier_selections = [w for w in earlier_winners if w.email == email]
for selection in earlier_selections:
    unavailable_teams.append(selection.team)
    unavailable_tryscorers.append(selection.tryscorer)

available_teams = [t for t in available_teams if t not in unavailable_teams]
all_players = [p for p in all_players if p not in unavailable_tryscorers]
```

### 3) Shield Tip Construction + Submission

```python
def make_shield_tip(
    email: str,
    team: str,
    tryscorer: str,
    round: int,
    match_total: int | None = None,
    season: int = CURRENT_SEASON,
) -> UserShieldTip:
    tipped_at_time = datetime.now(timezone.utc)
    return UserShieldTip(
        email=email,
        season=season,
        round=round,
        team=team,
        tryscorer=tryscorer,
        match_total=match_total,
        tipped_at=tipped_at_time,
    )


def submit_shield_tip(tip: UserShieldTip) -> None:
    worksheet_name = f"Shield Round {tip.round}"
    append_shield_row_to_worksheet(
        tip=tip,
        spreadsheet_name=SPREADSHEET_NAME,
        worksheet_name=worksheet_name,
    )
```

## Recommended Rebuild Checklist (Later This Year)

- Parameterize `THIS_WEEK` and team pool from data/config (not hardcoded UI constants).
- Keep winners ingest and tip submission schemas stable with explicit sheet headers.
- Add validation tests for:
  - previous-round-winner gating
  - no repeat team/tryscorer across all finals rounds
  - finals-week tie-break (`match_total`) requirement logic
- Keep APIs force-dynamic and cache winners/player reads with explicit TTL.

