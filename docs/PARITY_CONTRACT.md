# Coal Train Cup – Behavioral Parity Contract

This document defines the exact behavioral contract for each page and service rule. The Next.js migration must preserve these behaviors.

---

## Constants

| Name | Value |
|-----|--------|
| `CURRENT_SEASON` | 2026 |
| `SPREADSHEET_NAME` | "Coal Train Cup App 2026" |
| `LEGACY_SPREADSHEET_2025` | "Coal Train Cup App 2025" |
| Default cache TTL | 8 hours (28_800 s) |
| Players-in-round cache TTL | 600 s |
| Shield winners cache TTL | 24 h |

---

## Domain Models (must match)

- **User**: `email` (EmailStr), `username`, `pin` (derived from email + salt).
- **UserTip**: `email`, `username`, `season`, `round`, `team`, `opponent`, `home`, `tipped_at`.
- **UserShieldTip**: `email`, `season`, `round`, `team`, `tryscorer`, `match_total?`, `tipped_at`.
- **Tip** (available tip): `season`, `round`, `team`, `opponent`, `home`, `available_until`.
- **Game**: `season`, `round`, `kickoff` (UTC), `home_team`, `away_team`, `venue`, `home_score?`, `away_score?`.
- **GameResult**: `season`, `round`, `team`, `opponent`, `home`, `score_for`, `score_against`; `margin` = score_for − score_against.

---

## Data Store / Caching Contract

- **all_users()**: Load from sheet "Users". TTL 8h. Case-insensitive email lookup elsewhere.
- **all_user_tips()**: Load from all "Round N" worksheets (and local archive if present). TTL 8h.
- **all_games()**: Load from "Games", then refresh from NRL API for round(s) needing lookup (latest closed, + next). Save updated games to Sheets. Return merged list. TTL 8h.
- **all_teams()**: Distinct `home_team` from `all_games()`. TTL 8h.
- **all_game_results()**: Derived from `all_games()`; two rows per game (home + away), only when both scores present. TTL 8h.
- **all_players_in_round(round, competition_id=111, season=CURRENT_SEASON)**: NRL API player names for round. TTL 600s.
- **Round status**: Per round, from games in that round:
  - **CLOSED**: all games kicked off and (kickoff + 3h) passed.
  - **IN_PROGRESS**: at least one game kicked off and within 3h of kickoff.
  - **UPCOMING**: at least one game not yet kicked off.
- **get_current_tipping_round()**: max(closed rounds) + 1, or 1 if no closed rounds.
- **get_most_recent_closed_round()**: max round with status CLOSED, or 0.

---

## Leaderboard / Points Rules

- **Points per tip**: Win = 2, Draw = 1, Loss = 0 (from margin: >0, ==0, <0).
- **Full results dataframe**: tips merged with users (on email) and game results (on season, round, team, opponent, home). Columns include: email, username, season, round, team, opponent, home, tipped_at, margin, win, draw, loss, points.
- **Leaderboard (per round)**: Filter full results to `round <= selected_round`; group by (email, username); aggregate sum(points), sum(margin), count → tips_count. Sort by (points DESC, margin DESC). Position = 1-based index.
- **2025 leaderboard**: Same aggregation logic; data from `LEGACY_SPREADSHEET_2025` (tips + games from that spreadsheet; users from current `all_users()`). Rounds 1–27. Filter by selected round in UI.

---

## Make Tip Page

1. Show current tipping round (from `get_current_tipping_round()`).
2. Single text input: "Enter your patreon email address".
3. If no email entered: show only title + round + email input.
4. Lookup user by email (case-insensitive). If not found: show warning "No user found with email: {email}", stop.
5. Previous round tip: from full results for (previous_round), filtered by user email; take single row for that round. Round 1: no previous tip.
6. **Unavailable tips** (team → list of reasons):
   - Last round tip: same team as previous round tip → "Last round tip".
   - Same opponent: any tip whose opponent equals previous round's opponent → "Playing last round tip's opponent {opponent}".
   - Team already tipped ≥ 3 times (from user's full results) → "Team already tipped {count} times".
   - Home limit: if user's home tips (excluding round 9) ≥ 13, mark all home tips in current round as unavailable → "Already tipped 13 home teams".
   - Away limit: if user's away tips (excluding round 9) ≥ 13, mark all away tips as unavailable → "Already tipped 13 away teams".
7. **Available tips**: `available_tips_for_round(current_round)` minus keys in unavailable_tips, and minus tips where `available_until + 5min grace < now` (grace = 5 min for display cutoff; submit uses 10 min in make_tip).
8. If no available tips: show warning "No tips available for this round...", stop.
9. If there are unavailable tips: show info box "This week you can't select:" with bullet list of team [reasons].
10. Radio: "Select a tip for round {N}" with options formatted as "**Team (H|A)** vs Opponent".
11. Submit button: call `make_tip(user, tip)` then `submit_tip(user_tip)`. make_tip enforces: tipped_at and available_until in UTC; tip allowed only if `available_until + 10min >= tipped_at`. On success: success message. On error: error message.

---

## View User Tips Page

1. max_round = get_most_recent_closed_round().
2. Full results dataframe up to max_round.
3. Text input: "Enter your patreon email address". If empty: stop (show only input).
4. User lookup by email (exact match). If not found: warning "No user found with email: {email}", stop.
5. Filter results to user's email; columns: round, team, opponent, home (displayed as Home/Away), points, margin. Sort by round; index = round.
6. Leaderboard position chart: for each round 1..max_round, compute leaderboard for that round; get user's position; plus team, opponent, venue, result (Win/Draw/Loss), margin. Chart: line + points, Round on X, Position on Y (inverted so 1 at top), points colored by result (Win/Loss/Draw).
7. Metrics: "Home tips used" = count where Venue==Home and round!=9, format "{n} / 13". "Away tips used" = count where Venue==Away and round!=9, format "{n} / 13".
8. Table "Tips used by team": all teams (from all_teams()), count of tips per team for this user, sorted by count desc then team name.
9. Table "Tipping History": user_display_df (round, Team, Venue, vs Opponent, Points, Margin).
10. If user.email === "steven.burman@gmail.com": show admin section (clear cache, invalid tips, duplicates, archive round, rule violations).

---

## View Round Tips Page

1. tips = all_user_tips(); round_statuses = get_all_rounds_status().
2. Available rounds = rounds with status CLOSED. Pills selector "Show round tip summary for:", default last (max) round.
3. For selected round: filter tips by round; get game results for round. Team stats: count of tips per team; merge with result (Won/Lost/Draw) per team. Fill missing teams with 0.
4. Pie chart: "Distribution of Winning vs Losing Tips" (counts by result).
5. Bar chart: "Team Tips", horizontal bar, team on Y, count on X, color by result (Won=#00E5B4, Lost=#F45866, Draw=#9C6ADE).

---

## Leaderboard Page (2026)

1. max_round = get_most_recent_closed_round(); available_rounds = 1..max_round.
2. Pills "Show leaderboard after:", default last round.
3. Full results filtered to round <= selected_round; aggregate by (email, username): sum points, sum margin, count tips; sort points DESC, margin DESC; 1-based position. Columns: Username, Tips made, Coal Train Cup points, Accumulated margin. Display as table with Position index.

---

## 2025 Results Page

1. available_rounds = 1..27; pills "Show leaderboard after:", default 27.
2. Data from get_full_results_for_spreadsheet(LEGACY_SPREADSHEET_2025). Filter to round <= selected_round; same aggregation as leaderboard. Table: Username, Tips made, Coal Train Cup points, Accumulated margin, Position.

---

## Siliva Shield Page

1. THIS_WEEK = 31; header "Finals Week 4". Static copy: rules (1 team, 1 tryscorer; no repeat team/tryscorer in finals).
2. available_teams = ["Melbourne Storm", "Brisbane Broncos"].
3. all_players = all_players_in_round(THIS_WEEK). last_round_winners = from sheet "Winners - Shield Round 30". earlier_winners = rounds 28 + 29 same way.
4. Email input. If email present: user must be in last_round_winners; else error "Only previous round winners can continue...", stop.
5. Show success with last week's selection (team + tryscorer). Unavailable = last week's team + tryscorer + any from earlier_selections for this user. Info box listing already selected teams and tryscorers. Filter available_teams and all_players to exclude unavailable.
6. Select team, select tryscorer. If THIS_WEEK === 31: number input "Match points total" 0–100.
7. Submit: validate email, team, tryscorer, and (if week 31) match_total. make_shield_tip + submit_shield_tip. Success/error message.

---

## Home Page

1. Image assets/brlogo.jpeg (width 300).
2. Patreon link: "Join the patreon, to access the competition!"
3. "Congrats to the 2025 Coal Train Cup winner!" → "Paul Mac".
4. "Congrats to the 2025 Siliva Shield winner!" → "Kyle (damiencooked)".
5. Rules: weekly one tip per round; resubmit replaces previous; no same team in consecutive rounds (for/against); end of season: 13 home, 13 away (round 9 neutral), every team once, no team >3 times.
6. Stats: Total users = len(all_users()); Total tips made = len(all_user_tips()); 2026 games loaded = len(all_games()); 2026 resulted games = len(all_game_results())/2.
7. Version caption: "version: 2026.1.0".

---

## Admin Section (steven.burman@gmail.com only)

- Clear cache: invalidate all read caches.
- Invalid tips: tips where tipped_at > game.kickoff for matching game.
- Display duplicates (same round + email); cleanup button removes duplicates (keep latest by tipped_at), then clear cache.
- Archive round: number input + "Archive round locally" (only if round closed); writes local archive for that round's tips.
- 3-tips-per-team violations: list user/team/count where count > 3.
- Home/away limit violations: list users with home > 13 or away > 13 (excluding round 9).

---

## API / Write Contract

- **Submit tip**: Append one row to sheet "Round {round}" (create sheet if missing). Invalidate: all_user_tips (and any derived caches).
- **Submit shield tip**: Append one row to "Shield Round {round}". Invalidate: shield-related caches if any.
- **Games refresh**: Inside all_games(), read Games, determine rounds to update from NRL API, fetch, merge, write full Games sheet. Cache result 8h.

---

## Navigation

- Default page: Home.
- Pages: Home, Make a tip, 2026 tips by user, 2026 tips by round, 2026 Leaderboard, 2025 Results, Siliva Shield.
- (Current app has Leaderboard/View user/View round/Shield commented out; parity = support all and match structure.)

---

## Theme / UX Notes (for migration)

- Dark theme; primary #00E5B4; background #2D0A54; secondary background #3B1373; text white.
- All flows must be mobile-friendly (touch targets, readable text, no horizontal scroll for content).
