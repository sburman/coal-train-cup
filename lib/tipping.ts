import * as data from "./data";
import {
  CURRENT_SEASON,
  ROUND_9_MAGIC_ROUND,
  MAX_HOME_AWAY_TIPS,
  MAX_TIPS_PER_TEAM,
  TIP_GRACE_PERIOD_MINUTES,
  TIP_DISPLAY_GRACE_MINUTES,
} from "./constants";
import type { User, UserTip, Tip, Game, ResultRow } from "./types";
import * as lb from "./leaderboard";

export interface AvailableTip {
  season: number;
  round: number;
  team: string;
  opponent: string;
  home: boolean;
  available_until: string;
}

export function getGamesForRound(
  games: Game[],
  round: number,
  season: number = CURRENT_SEASON
): Game[] {
  return games.filter((g) => g.round === round && g.season === season);
}

export function availableTipsForRound(
  games: Game[],
  round: number,
  season: number = CURRENT_SEASON
): Record<string, AvailableTip> {
  const tips: Record<string, AvailableTip> = {};
  const roundGames = getGamesForRound(games, round, season);
  for (const g of roundGames) {
    if (g.round !== round || g.season !== season) continue;
    tips[g.home_team] = {
      season,
      round,
      team: g.home_team,
      opponent: g.away_team,
      home: true,
      available_until: g.kickoff,
    };
    tips[g.away_team] = {
      season,
      round,
      team: g.away_team,
      opponent: g.home_team,
      home: false,
      available_until: g.kickoff,
    };
  }
  return tips;
}

export interface UnavailableReason {
  team: string;
  reasons: string[];
}

export interface MakeTipPayload {
  currentRound: number;
  user: User | null;
  previousRoundTip: ResultRow | null;
  availableTips: AvailableTip[];
  unavailableReasons: UnavailableReason[];
  error?: string;
}

export async function getMakeTipPayload(email: string): Promise<MakeTipPayload> {
  const currentRound = await data.getCurrentTippingRound();
  const users = await data.allUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  if (!user) {
    return {
      currentRound,
      user: null,
      previousRoundTip: null,
      availableTips: [],
      unavailableReasons: [],
      error: `No user found with email: ${email}`,
    };
  }

  const previousRound = currentRound - 1;
  const fullResults = await lb.buildFullResultsDataframe();
  const filteredByRound = previousRound >= 1
    ? lb.getFullResultsDataframe(fullResults, previousRound)
    : [];
  const userResults = filteredByRound.filter((r) => r.email.toLowerCase() === user.email.toLowerCase());
  const previousRoundTipRow = userResults.find((r) => r.round === previousRound) ?? null;

  const games = await data.allGames();
  let currentRoundTips = availableTipsForRound(games, currentRound);

  const unavailableReasons: UnavailableReason[] = [];
  const unavailableTeams = new Map<string, string[]>();

  if (previousRoundTipRow) {
    const prev = previousRoundTipRow;
    unavailableTeams.set(prev.team, ["Last round tip"]);
    for (const tip of Object.values(currentRoundTips)) {
      if (tip.opponent === prev.opponent) {
        const existing = unavailableTeams.get(tip.team) ?? [];
        existing.push(`Playing last round tip's opponent ${prev.opponent}`);
        unavailableTeams.set(tip.team, existing);
      }
    }
    const teamCounts = new Map<string, number>();
    for (const r of userResults) {
      teamCounts.set(r.team, (teamCounts.get(r.team) ?? 0) + 1);
    }
    for (const [team, count] of teamCounts) {
      if (count >= MAX_TIPS_PER_TEAM) {
        const existing = unavailableTeams.get(team) ?? [];
        existing.push(`Team already tipped ${count} times`);
        unavailableTeams.set(team, existing);
      }
    }
    const nonRound9 = userResults.filter((r) => r.round !== ROUND_9_MAGIC_ROUND);
    const homeCount = nonRound9.filter((r) => r.home).length;
    const awayCount = nonRound9.filter((r) => !r.home).length;
    for (const [team, tip] of Object.entries(currentRoundTips)) {
      if (tip.home && homeCount >= MAX_HOME_AWAY_TIPS) {
        const existing = unavailableTeams.get(team) ?? [];
        existing.push(`Already tipped ${MAX_HOME_AWAY_TIPS} home teams`);
        unavailableTeams.set(team, existing);
      } else if (!tip.home && awayCount >= MAX_HOME_AWAY_TIPS) {
        const existing = unavailableTeams.get(team) ?? [];
        existing.push(`Already tipped ${MAX_HOME_AWAY_TIPS} away teams`);
        unavailableTeams.set(team, existing);
      }
    }
  }

  for (const [team, reasons] of unavailableTeams) {
    unavailableReasons.push({ team, reasons });
  }

  currentRoundTips = Object.fromEntries(
    Object.entries(currentRoundTips).filter(([team]) => !unavailableTeams.has(team))
  );

  const graceMs = TIP_DISPLAY_GRACE_MINUTES * 60 * 1000;
  const now = Date.now();
  currentRoundTips = Object.fromEntries(
    Object.entries(currentRoundTips).filter(([, tip]) => new Date(tip.available_until).getTime() + graceMs > now)
  );

  const availableTipsList = Object.values(currentRoundTips);

  return {
    currentRound,
    user,
    previousRoundTip: previousRoundTipRow,
    availableTips: availableTipsList,
    unavailableReasons: unavailableReasons.map((r) => ({ team: r.team, reasons: r.reasons })),
  };
}

export function validateAndBuildTip(
  user: User,
  tip: AvailableTip,
  tippedAt: string
): UserTip {
  const tipTime = new Date(tippedAt).getTime();
  const until = new Date(tip.available_until).getTime();
  const grace = TIP_GRACE_PERIOD_MINUTES * 60 * 1000;
  if (until + grace < tipTime) {
    throw new Error("Can't make tip for a game that has already kicked off");
  }
  return {
    email: user.email,
    username: user.username,
    season: tip.season,
    round: tip.round,
    team: tip.team,
    opponent: tip.opponent,
    home: tip.home,
    tipped_at: tippedAt,
  };
}
