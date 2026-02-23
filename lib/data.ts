import {
  SPREADSHEET_NAME,
  LEGACY_SPREADSHEET_2025,
  CURRENT_SEASON,
  CACHE_TTL_SECONDS,
  PLAYERS_CACHE_TTL_SECONDS,
  SHIELD_WINNERS_CACHE_TTL_SECONDS,
  ROUND_IN_PROGRESS_HOURS,
} from "./constants";
import * as sheets from "./sheets";
import { getLatestDrawFromNrl, getPlayerNamesInRound as fetchPlayersInRound } from "./nrl";
import { get, set, invalidate } from "./cache";
import type { User, UserTip, Game, GameResult, RoundStatus } from "./types";

const CACHE_KEYS = {
  users: "data:users",
  usersLegacy: (name: string) => `data:users:${name}`,
  games: (name: string) => `data:games:${name}`,
  tips: (name: string) => `data:tips:${name}`,
  shieldWinners: (name: string, round: number) => `data:shield:${name}:${round}`,
  players: (round: number) => `data:players:${round}`,
};

export async function allUsers(): Promise<User[]> {
  let cached = get<User[]>(CACHE_KEYS.users);
  if (cached) return cached;
  const list = await sheets.loadUsersFromSheets(SPREADSHEET_NAME);
  set(CACHE_KEYS.users, list, CACHE_TTL_SECONDS);
  return list;
}

export async function allUserTips(spreadsheetName: string = SPREADSHEET_NAME): Promise<UserTip[]> {
  const key = CACHE_KEYS.tips(spreadsheetName);
  let cached = get<UserTip[]>(key);
  if (cached) return cached;
  const list = await sheets.loadUserTipsFromSheets(spreadsheetName);
  set(key, list, CACHE_TTL_SECONDS);
  return list;
}

function roundNeedingLookup(games: Game[]): number {
  const now = Date.now();
  const rounds = new Set(games.map((g) => g.round));
  const closed: number[] = [];
  for (const r of rounds) {
    const gamesInRound = games.filter((g) => g.round === r);
    if (gamesInRound.every((g) => new Date(g.kickoff).getTime() <= now)) {
      closed.push(r);
    }
  }
  if (closed.length === 0) return 0;
  return Math.max(...closed);
}

export async function allGames(spreadsheetName: string = SPREADSHEET_NAME): Promise<Game[]> {
  const key = CACHE_KEYS.games(spreadsheetName);
  let cached = get<Game[]>(key);
  if (cached) return cached;

  let existing = await sheets.loadGamesFromSheets(spreadsheetName);
  const latestClosed = roundNeedingLookup(existing);
  const roundsToUpdate =
    latestClosed === 0 ? [1] : [latestClosed, latestClosed + 1];
  const updated = await getLatestDrawFromNrl(existing, roundsToUpdate);
  if (spreadsheetName === SPREADSHEET_NAME) {
    await sheets.saveGamesToSheets(updated, SPREADSHEET_NAME);
  }
  set(key, updated, CACHE_TTL_SECONDS);
  return updated;
}

export async function allTeams(): Promise<string[]> {
  const games = await allGames();
  return [...new Set(games.map((g) => g.home_team))];
}

export async function allGameResults(spreadsheetName: string = SPREADSHEET_NAME): Promise<GameResult[]> {
  const games = await allGames(spreadsheetName);
  const results: GameResult[] = [];
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
}

export async function allPlayersInRound(
  round: number,
  _competitionId: number = 111,
  season: number = CURRENT_SEASON
): Promise<string[]> {
  const key = CACHE_KEYS.players(round);
  let cached = get<string[]>(key);
  if (cached) return cached;
  const list = await fetchPlayersInRound(round, season);
  set(key, list, PLAYERS_CACHE_TTL_SECONDS);
  return list;
}

export async function getShieldWinners(
  round: number,
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<import("./types").UserShieldTip[]> {
  const key = CACHE_KEYS.shieldWinners(spreadsheetName, round);
  let cached = get<import("./types").UserShieldTip[]>(key);
  if (cached) return cached;
  const list = await sheets.loadShieldWinners(spreadsheetName, round);
  set(key, list, SHIELD_WINNERS_CACHE_TTL_SECONDS);
  return list;
}

export function getRoundStatusFromGames(
  games: Game[],
  atTime: Date = new Date()
): Record<number, RoundStatus> {
  const rounds = new Set(games.map((g) => g.round));
  const result: Record<number, RoundStatus> = {};
  const threeHours = 3 * 60 * 60 * 1000;
  for (const r of rounds) {
    const gamesInRound = games.filter((g) => g.round === r);
    const now = atTime.getTime();
    const anyFuture = gamesInRound.some((g) => new Date(g.kickoff).getTime() > now);
    const anyInProgress = gamesInRound.some((g) => {
      const k = new Date(g.kickoff).getTime();
      return k <= now && k + threeHours > now;
    });
    if (anyFuture) result[r] = "upcoming";
    else if (anyInProgress) result[r] = "in_progress";
    else result[r] = "closed";
  }
  return result;
}

export async function getAllRoundsStatus(
  spreadsheetName: string = SPREADSHEET_NAME,
  atTime: Date = new Date()
): Promise<Record<number, RoundStatus>> {
  const games = await allGames(spreadsheetName);
  return getRoundStatusFromGames(games, atTime);
}

export async function getCurrentTippingRound(
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<number> {
  const statuses = await getAllRoundsStatus(spreadsheetName);
  const closed = Object.entries(statuses)
    .filter(([, s]) => s === "closed")
    .map(([r]) => Number(r));
  if (closed.length === 0) return 1;
  return Math.max(...closed) + 1;
}

export async function getMostRecentClosedRound(
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<number> {
  const statuses = await getAllRoundsStatus(spreadsheetName);
  const closed = Object.entries(statuses)
    .filter(([, s]) => s === "closed")
    .map(([r]) => Number(r));
  return closed.length > 0 ? Math.max(...closed) : 0;
}

export function getGamesForRound(
  games: Game[],
  round: number,
  season: number = CURRENT_SEASON
): Game[] {
  return games.filter((g) => g.round === round && g.season === season);
}

export function getGameResultsForRound(
  results: GameResult[],
  round: number,
  season: number = CURRENT_SEASON
): GameResult[] {
  return results.filter((r) => r.round === round && r.season === season);
}

/** Invalidate caches after a tip write so next read is fresh. */
export function invalidateTipsCache(): void {
  invalidate(CACHE_KEYS.tips(SPREADSHEET_NAME));
}

export function invalidateGamesCache(): void {
  invalidate(CACHE_KEYS.games(SPREADSHEET_NAME));
}
