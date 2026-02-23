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
        teamLineup?: { teamPlayer?: { playerName?: string }[] };
      }>;
    };
  };
}

export async function getPlayerNamesInRound(
  round: number,
  season: number = CURRENT_SEASON
): Promise<string[]> {
  const { nrlAuth } = getEnv();
  const fixtures = await fetchFixturesFromNrl(season, round);
  const allNames: string[] = [];
  for (const f of fixtures) {
    const matchId = f.gameId;
    if (!matchId) continue;
    const url = `http://rugbyleague-api.stats.com/api/NRL/matchStatsAndEvents/${matchId}.json`;
    const res = await fetch(url, {
      headers: {
        Authorization: nrlAuth,
        "Content-Type": "application/json, charset=UTF-8",
      },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as NrlSnapshot;
    const teams = data.gameStats?.teams?.teamsMatch ?? [];
    for (const team of teams) {
      const lineup = team?.teamLineup as { teamPlayer?: { playerName?: string }[] } | undefined;
      const players = lineup?.teamPlayer ?? [];
      for (const p of players) {
        if (p.playerName) allNames.push(p.playerName);
      }
    }
  }
  return [...new Set(allNames)].sort();
}
