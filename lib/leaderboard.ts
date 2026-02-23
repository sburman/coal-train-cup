import * as data from "./data";
import { get, set, invalidate } from "./cache";
import { SPREADSHEET_NAME, LEGACY_SPREADSHEET_2025, CACHE_TTL_SECONDS } from "./constants";
import type { ResultRow, LeaderboardRow } from "./types";
import * as sheets from "./sheets";

const CACHE_FULL_RESULTS = "lb:full:";
const CACHE_LEGACY_FULL = "lb:legacy:";

export async function buildFullResultsDataframe(
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<ResultRow[]> {
  const key = CACHE_FULL_RESULTS + spreadsheetName;
  const cached = get<ResultRow[]>(key);
  if (cached) return cached;

  const tips =
    spreadsheetName === SPREADSHEET_NAME
      ? await data.allUserTips(SPREADSHEET_NAME)
      : await sheets.loadUserTipsFromSheets(spreadsheetName);
  // Always use current app users (username/email) for display
  const users = await data.allUsers();
  const gameResults =
    spreadsheetName === SPREADSHEET_NAME
      ? await data.allGameResults(SPREADSHEET_NAME)
      : await (async () => {
          const games = await sheets.loadGamesFromSheets(spreadsheetName);
          const results: { season: number; round: number; team: string; opponent: string; home: boolean; score_for: number; score_against: number; margin: number }[] = [];
          for (const g of games) {
            if (g.home_score == null || g.away_score == null) continue;
            results.push({
              season: g.season,
              round: g.round,
              team: g.home_team,
              opponent: g.away_team,
              home: true,
              score_for: g.home_score,
              score_against: g.away_score,
              margin: g.home_score - g.away_score,
            });
            results.push({
              season: g.season,
              round: g.round,
              team: g.away_team,
              opponent: g.home_team,
              home: false,
              score_for: g.away_score,
              score_against: g.home_score,
              margin: g.away_score - g.home_score,
            });
          }
          return results;
        })();

  if (tips.length === 0) {
    const out: ResultRow[] = [];
    set(key, out, CACHE_TTL_SECONDS);
    return out;
  }

  const userByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
  const resultsByKey = new Map(
    gameResults.map((r) => [
      `${r.season}:${r.round}:${r.team}:${r.opponent}:${r.home}`,
      r,
    ])
  );

  const rows: ResultRow[] = [];
  for (const tip of tips) {
    const user = userByEmail.get(tip.email.toLowerCase());
    const username = user?.username ?? tip.username;
    const resKey = `${tip.season}:${tip.round}:${tip.team}:${tip.opponent}:${tip.home}`;
    const res = resultsByKey.get(resKey);
    if (!res) continue; // no result yet for this tip
    const margin = res.margin;
    rows.push({
      email: tip.email,
      username,
      season: tip.season,
      round: tip.round,
      team: tip.team,
      opponent: tip.opponent,
      home: tip.home,
      tipped_at: tip.tipped_at,
      margin,
      win: margin > 0,
      draw: margin === 0,
      loss: margin < 0,
      points: margin > 0 ? 2 : margin === 0 ? 1 : 0,
    });
  }
  set(key, rows, CACHE_TTL_SECONDS);
  return rows;
}

export function getFullResultsDataframe(
  full: ResultRow[],
  maxRound: number | null
): ResultRow[] {
  if (!maxRound) return full;
  return full.filter((r) => r.round <= maxRound);
}

export function getLeaderboardDataframe(
  full: ResultRow[],
  maxRound: number | null
): LeaderboardRow[] {
  const filtered = getFullResultsDataframe(full, maxRound);
  const byUser = new Map<
    string,
    { email: string; username: string; points: number; margin: number; count: number }
  >();
  for (const r of filtered) {
    const key = r.email;
    const existing = byUser.get(key);
    if (!existing) {
      byUser.set(key, {
        email: r.email,
        username: r.username,
        points: r.points,
        margin: r.margin,
        count: 1,
      });
    } else {
      existing.points += r.points;
      existing.margin += r.margin;
      existing.count += 1;
    }
  }
  const sorted = [...byUser.values()].sort(
    (a, b) => b.points - a.points || b.margin - a.margin
  );
  return sorted.map((s, i) => ({
    email: s.email,
    username: s.username,
    tips_count: s.count,
    points: s.points,
    margin: s.margin,
    position: i + 1,
  }));
}

export async function getFullResultsForSpreadsheet(
  spreadsheetName: string
): Promise<ResultRow[]> {
  if (spreadsheetName === SPREADSHEET_NAME) {
    return buildFullResultsDataframe(SPREADSHEET_NAME);
  }
  const key = CACHE_LEGACY_FULL + spreadsheetName;
  const cached = get<ResultRow[]>(key);
  if (cached) return cached;
  const rows = await buildFullResultsDataframe(spreadsheetName);
  set(key, rows, CACHE_TTL_SECONDS);
  return rows;
}

export function invalidateLeaderboardCache(): void {
  invalidate(CACHE_FULL_RESULTS + SPREADSHEET_NAME);
  invalidate(CACHE_LEGACY_FULL + LEGACY_SPREADSHEET_2025);
}
