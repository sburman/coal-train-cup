# Siliva Shield Reference

How the Siliva Shield works and how it is implemented, so it can be run again
next season without rediscovering any of it.

Rebuilt for 2026 (Finals Week 1 = round 28). The 2025 Streamlit-era notes that
this document used to carry are in git history.

## What Siliva Shield Is

A **finals-only knockout side competition**, separate from the weekly Coal Train
Cup tipping flow. Each finals week an entrant picks one team to win and one
player to score a try. Get both right and you continue; get either wrong and you
are out.

## How It Differs From Coal Train Cup

| | Coal Train Cup | Siliva Shield |
|---|---|---|
| Runs | Rounds 1-27 | Finals rounds 28-31 |
| Selection | Home/away team tip | Team winner **+** tryscorer |
| Who can enter | Any registered user | Week 1: any registered user. Week 2+: previous week's winners only |
| Repeats | Max 3 tips per team | No team or tryscorer may be reused across the whole finals |
| Lock | Kickoff + 10 min grace | Kickoff + **1 min** grace |
| Resubmits | Replaces previous tip | Appends; cleaned up manually |
| Tie-break | n/a | `match_total` in the deciding week only |

## Where The Code Lives

- **Rules** - `lib/shield.ts`. Pure functions, no fetching, no clock reads.
  Callers pass `now` and pre-loaded data. This is what makes weeks 2-4 testable
  before they are played.
- **Orchestration** - bottom of `lib/shield.ts` (`getShieldPayload`,
  `submitShieldTip`). Mirrors how `lib/tipping.ts` sits behind `/make-tip`.
- **Page** - `app/siliva-shield/page.tsx`. Rendering and fetching only.
- **APIs** - `GET /api/siliva-shield?email=` (everything the page needs),
  `POST /api/siliva-shield/submit`, plus the older `/players` and `/winners`
  routes.
- **Storage** - `lib/sheets.ts`: `loadShieldWinners`, `loadShieldTips`,
  `appendShieldTipToSheet`.
- **Tests** - `__tests__/shield.test.ts`, fixture-driven.

## Configuration

All in `lib/constants.ts`:

| Constant | 2026 value | Meaning |
|---|---|---|
| `SHIELD_FINALS_START_ROUND` | 28 | Finals Week 1 |
| `SHIELD_TIEBREAK_ROUND` | 31 | Only week collecting `match_total` |
| `SHIELD_TIP_GRACE_MINUTES` | 1 | Grace after kickoff |
| `SHIELD_LINEUPS_PENDING_TTL_SECONDS` | 30 | Negative cache for pending lineups |

**The current finals week is not configured.** It comes from
`getCurrentTippingRound()`, which reads round statuses off the sheet and returns
`max(closed) + 1`. Closing round 28 in the `Rounds` worksheet advances the app to
Finals Week 2 with no deploy. This is the whole reason weeks 2-4 need no code
change.

## Worksheets

- **Read winners:** `Winners - Shield Round {N}` - precomputed manually, one row
  per surviving entrant. Read-only from the app.
- **Write tips:** `Shield Round {N}`.
- **Columns:** `email, season, round, team, tryscorer, match_total, tipped_at`.

`appendShieldTipToSheet` creates the sheet **with its header row** if absent.
Do not remove that: `createWorksheet` makes a bare grid, and record reads treat
row 0 as the header, so without it the first tip of a finals week becomes the
column headings and disappears from every later read.

## Weekly Operating Procedure

1. **Tuesday afternoon** - NRL clubs publish team lists. The form stays shut
   until then and says so; nothing to do.
2. **During the week** - entrants tip. Each team locks as its own game kicks
   off, along with that team's players.
3. **After the last game** - work out who got both legs right and write them
   into `Winners - Shield Round {N}`.
4. **Then** mark round `N` closed in the `Rounds` worksheet. The app rolls to
   the next finals week on its own.

Order matters. Between step 2 and step 3 the winners sheet is empty, and the app
reports "last round's winners haven't been published yet" rather than telling
everyone they were eliminated - but nobody can tip the next week until step 3 is
done.

## Lineups And Readiness

Player lists come from the NRL API per fixture. `getRoundLineups` returns
players tagged with their team - needed to know which kickoff governs a given
player - plus counts used to decide readiness.

**The NRL match endpoint returns HTTP 200 with an empty lineup before team lists
drop.** Status codes cannot be used to detect readiness; only lineup population
can. Because all clubs publish together:

- no lineups at all -> `not_published` (normal, pre-Tuesday)
- some but not all, or any fetch failure -> `partial` (something is broken)
- every fixture with **both** squads -> `ready`

`partial` deliberately refuses to show a half-populated tryscorer list. In a
knockout, a silently missing player costs someone their season and they would
have no way to tell it had happened.

## Known Design Constraints

- **Two data sources.** Fixtures come from the `Games` worksheet, players from
  the NRL API, joined on exact team name. `lineupsMatchDraw` guards the seam; a
  mismatch reports `partial` rather than silently marking every player locked.
- **Duplicate submissions are allowed by design.** The page warns, the sheet
  gets multiple rows, cleanup is manual. Accepted deliberately for a comp this
  size - no `/admin` support was built.
- **Eligibility depends on winners-sheet quality.** If a week's winners sheet is
  wrong, valid entrants are blocked.
- **Identity is a typed email.** No auth, matching `/make-tip`. `User.pin`
  exists in the sheet and in `lib/types.ts` but nothing verifies it.
- **`/api/siliva-shield/winners` is unauthenticated** and returns full email
  addresses for any round. Nothing in the app calls it any more.

## Next Season

1. Set `SHIELD_FINALS_START_ROUND` to the new Finals Week 1 round, and
   `SHIELD_TIEBREAK_ROUND` to that plus three.
2. Confirm the regular season really ended where you think - the archive page
   `app/leaderboard-2026/page.tsx` pins its final round for the same reason.
3. Nothing else. The team pool, the current week and the player lists all derive
   from data.
