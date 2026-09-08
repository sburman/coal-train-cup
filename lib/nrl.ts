import { getEnv } from "./env";
import { CURRENT_SEASON } from "./constants";
import type { Game } from "./types";

const NRL_BASE = "http://rugbyleague-api.stats.com/api/NRL";
const COMPETITION_ID = 111;

interface NrlFixtureTeam {
  teamName: string;
  isHomeTeam?: boolean;
  teamFinalScore?: number;
}

interface NrlFixture {
  gameId: string;
  startTimeUTC: string;
  venueName?: string;
  city?: string;
  gameStateName?: string;
  teams: NrlFixtureTeam[];
}

function parseKickoff(iso: string): string {
  return iso.replace("Z", "+00:00");
}

function fixtureToGame(fixture: NrlFixture, season: number, roundNumber: number): Game {
  const home = fixture.teams.find((t) => t.isHomeTeam);
  const away = fixture.teams.find((t) => !t.isHomeTeam);
  if (!home || !away) throw new Error(`Missing home/away for game ${fixture.gameId}`);
  const state = fixture.gameStateName ?? "";
  const scoreDefault = state === "Final" ? 0 : null;
  const venue = [fixture.venueName ?? "Unknown Venue", fixture.city ?? "Unknown City"].join(", ");
  return {
    season,
    round: roundNumber,
    kickoff: parseKickoff(fixture.startTimeUTC),
    home_team: home.teamName,
    away_team: away.teamName,
    venue,
    home_score: home.teamFinalScore ?? scoreDefault,
    away_score: away.teamFinalScore ?? scoreDefault,
  };
}

export async function fetchFixturesFromNrl(
  season: number,
  round: number
): Promise<NrlFixture[]> {
  const { nrlAuth } = getEnv();
  const url = `${NRL_BASE}/competitions/roundFixtures/${COMPETITION_ID}/${season}/${round}.json`;
  const res = await fetch(url, {
    headers: {
      Authorization: nrlAuth,
      "Content-Type": "application/json, charset=UTF-8",
    },
  });
  if (!res.ok) throw new Error(`NRL API error: ${res.status}`);
  const data = (await res.json()) as { roundFixtures?: { gameFixtures?: NrlFixture[] }[] };
  return data.roundFixtures?.[0]?.gameFixtures ?? [];
}

export async function loadFixturesFromNrl(
  season: number,
  round: number
): Promise<Game[]> {
  const fixtures = await fetchFixturesFromNrl(season, round);
  return fixtures.map((f) => fixtureToGame(f, season, round));
}

export async function getLatestDrawFromNrl(
  existing: Game[],
  roundsToUpdate: number[]
): Promise<Game[]> {
  let games = [...existing];
  for (const roundNumber of roundsToUpdate) {
    if (roundNumber > 31) continue;
    const fixtures = await loadFixturesFromNrl(CURRENT_SEASON, roundNumber);
    games = games.filter((g) => g.round !== roundNumber);
    games.push(...fixtures);
  }
  games.sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );
  return games;
}

interface NrlSnapshot {
  gameStats?: {
    teams?: {
      teamsMatch?: Array<{
        teamName?: string;
        teamLineup?: { teamPlayer?: { playerName?: string }[] };
      }>;
    };
  };
}

/** A named player tied to the team whose fixture governs their availability. */
export interface RoundPlayer {
  name: string;
  team: string;
}

/**
 * Lineups for a round, with enough detail for callers to tell "not published
 * yet" apart from "something broke".
 *
 * The NRL match endpoint returns HTTP 200 with an EMPTY teamLineup before team
 * lists drop (Tuesday afternoon), so status codes cannot be used to detect
 * readiness - only lineup population can.
 */
export interface RoundLineups {
  players: RoundPlayer[];
  /** Fixtures in the round, per the NRL draw. */
  fixtureCount: number;
  /** Fixtures for which at least one team lineup was populated. */
  fixturesWithLineups: number;
  /** Fixtures whose match payload could not be fetched or parsed. */
  fixtureFetchFailures: number;
}

export async function getRoundLineups(
  round: number,
  season: number = CURRENT_SEASON
): Promise<RoundLineups> {
  const { nrlAuth } = getEnv();
  const fixtures = await fetchFixturesFromNrl(season, round);
  const players: RoundPlayer[] = [];
  let fixturesWithLineups = 0;
  let fixtureFetchFailures = 0;

  for (const f of fixtures) {
    const matchId = f.gameId;
    if (!matchId) {
      fixtureFetchFailures += 1;
      continue;
    }
    const url = `${NRL_BASE}/matchStatsAndEvents/${matchId}.json`;
    let data: NrlSnapshot;
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: nrlAuth,
          "Content-Type": "application/json, charset=UTF-8",
        },
      });
      if (!res.ok) {
        fixtureFetchFailures += 1;
        continue;
      }
      data = (await res.json()) as NrlSnapshot;
    } catch {
      fixtureFetchFailures += 1;
      continue;
    }

    const teams = data.gameStats?.teams?.teamsMatch ?? [];
    let fixtureHadLineup = false;
    for (const team of teams) {
      const teamName = team?.teamName;
      const lineup = team?.teamLineup?.teamPlayer ?? [];
      if (!teamName || lineup.length === 0) continue;
      fixtureHadLineup = true;
      for (const p of lineup) {
        if (p.playerName) players.push({ name: p.playerName, team: teamName });
      }
    }
    if (fixtureHadLineup) fixturesWithLineups += 1;
  }

  const seen = new Set<string>();
  const deduped = players.filter((p) => {
    const key = `${p.team}|${p.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.sort((a, b) => a.name.localeCompare(b.name));

  return {
    players: deduped,
    fixtureCount: fixtures.length,
    fixturesWithLineups,
    fixtureFetchFailures,
  };
}
