/**
 * Siliva Shield rules - finals-only knockout side competition.
 *
 * Pure functions only: no fetching, no clock reads. Callers pass `now` and the
 * already-loaded data. This mirrors the lib/tipping.ts <-> /make-tip split and
 * is what makes weeks 2-4 testable before they are ever played.
 */
import {
  CURRENT_SEASON,
  SHIELD_FINALS_START_ROUND,
  SHIELD_TIEBREAK_ROUND,
  SHIELD_TIP_GRACE_MINUTES,
} from "./constants";
import type { Game, User, UserShieldTip } from "./types";
import type { RoundLineups, RoundPlayer } from "./nrl";

// --- Round helpers -------------------------------------------------------

export function isShieldRound(round: number): boolean {
  return round >= SHIELD_FINALS_START_ROUND && round <= SHIELD_TIEBREAK_ROUND;
}

/** Round 28 -> 1, round 31 -> 4. */
export function finalsWeekNumber(round: number): number {
  return round - SHIELD_FINALS_START_ROUND + 1;
}

export function finalsWeekLabel(round: number): string {
  return `Finals Week ${finalsWeekNumber(round)}`;
}

/** Rounds whose winners constrain this round's selections. */
export function priorShieldRounds(round: number): number[] {
  const rounds: number[] = [];
  for (let r = SHIELD_FINALS_START_ROUND; r < round; r++) rounds.push(r);
  return rounds;
}

/** The tie-break total is collected in the deciding week only. */
export function requiresTieBreak(round: number): boolean {
  return round === SHIELD_TIEBREAK_ROUND;
}

// --- Lineup readiness ----------------------------------------------------

export type LineupReadiness = "not_published" | "partial" | "ready";

/**
 * Team lists are published for every club at once on Tuesday afternoon, so
 * "none yet" is a normal pre-Tuesday state while "some but not all" can only
 * mean something is broken. The NRL match endpoint answers 200 with an empty
 * lineup before the drop, so HTTP status tells us nothing here.
 */
export function lineupReadiness(lineups: RoundLineups): LineupReadiness {
  if (lineups.fixtureCount === 0) return "not_published";
  if (lineups.fixturesWithLineups === 0) {
    return lineups.fixtureFetchFailures > 0 ? "partial" : "not_published";
  }
  if (
    lineups.fixturesWithLineups < lineups.fixtureCount ||
    lineups.fixtureFetchFailures > 0
  ) {
    return "partial";
  }
  return "ready";
}

// --- Eligibility ---------------------------------------------------------

export type IneligibleReason = "not_registered" | "not_previous_winner";

export interface Eligibility {
  eligible: boolean;
  reason?: IneligibleReason;
  user: User | null;
  /** The winning selection that qualified them, when there is a prior week. */
  qualifyingSelection: UserShieldTip | null;
}

function sameEmail(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * `previousRoundWinners` is null in Finals Week 1, where no Shield round has
 * been played and every registered user may enter. From week 2 it is the
 * contents of `Winners - Shield Round {round - 1}`.
 */
export function shieldEligibility(
  email: string,
  users: User[],
  previousRoundWinners: UserShieldTip[] | null
): Eligibility {
  const user = users.find((u) => sameEmail(u.email, email)) ?? null;
  if (!user) {
    return {
      eligible: false,
      reason: "not_registered",
      user: null,
      qualifyingSelection: null,
    };
  }
  if (previousRoundWinners === null) {
    return { eligible: true, user, qualifyingSelection: null };
  }
  const win = previousRoundWinners.find((w) => sameEmail(w.email, email));
  if (!win) {
    return {
      eligible: false,
      reason: "not_previous_winner",
      user,
      qualifyingSelection: null,
    };
  }
  return { eligible: true, user, qualifyingSelection: win };
}

// --- Selection pool ------------------------------------------------------

export type ExclusionReason = "used" | "locked";

export interface TeamOption {
  team: string;
  opponent: string;
  kickoff: string;
  available: boolean;
  reason?: ExclusionReason;
}

export interface TryscorerOption {
  name: string;
  team: string;
  available: boolean;
  reason?: ExclusionReason;
}

export interface SelectionPool {
  teams: TeamOption[];
  tryscorers: TryscorerOption[];
}

export interface PriorSelections {
  teams: Set<string>;
  tryscorers: Set<string>;
}

/** Everything this user has already spent across earlier finals weeks. */
export function priorSelectionsFor(
  email: string,
  priorWinners: UserShieldTip[]
): PriorSelections {
  const teams = new Set<string>();
  const tryscorers = new Set<string>();
  for (const w of priorWinners) {
    if (!sameEmail(w.email, email)) continue;
    if (w.team) teams.add(w.team);
    if (w.tryscorer) tryscorers.add(w.tryscorer);
  }
  return { teams, tryscorers };
}

/** Kickoff plus the Shield's own (deliberately tiny) grace. */
export function lockTimeFor(game: Game): number {
  return (
    new Date(game.kickoff).getTime() + SHIELD_TIP_GRACE_MINUTES * 60 * 1000
  );
}

export function isLocked(game: Game, now: Date): boolean {
  return now.getTime() > lockTimeFor(game);
}

export function shieldSelectionPool(
  roundGames: Game[],
  players: RoundPlayer[],
  prior: PriorSelections,
  now: Date
): SelectionPool {
  const gameByTeam = new Map<string, Game>();
  for (const g of roundGames) {
    gameByTeam.set(g.home_team, g);
    gameByTeam.set(g.away_team, g);
  }

  const teams: TeamOption[] = [];
  for (const g of roundGames) {
    for (const [team, opponent] of [
      [g.home_team, g.away_team],
      [g.away_team, g.home_team],
    ] as const) {
      const used = prior.teams.has(team);
      const locked = isLocked(g, now);
      teams.push({
        team,
        opponent,
        kickoff: g.kickoff,
        available: !used && !locked,
        reason: used ? "used" : locked ? "locked" : undefined,
      });
    }
  }
  teams.sort((a, b) => a.team.localeCompare(b.team));

  const tryscorers: TryscorerOption[] = players.map((p) => {
    const game = gameByTeam.get(p.team);
    const used = prior.tryscorers.has(p.name);
    // A player whose team is not in this round's draw has no kickoff to
    // measure against; treat as locked rather than silently selectable.
    const locked = game ? isLocked(game, now) : true;
    return {
      name: p.name,
      team: p.team,
      available: !used && !locked,
      reason: used ? "used" : locked ? "locked" : undefined,
    };
  });
  tryscorers.sort((a, b) => a.name.localeCompare(b.name));

  return { teams, tryscorers };
}

// --- Validation ----------------------------------------------------------

export interface BuildShieldTipInput {
  email: string;
  round: number;
  team: string;
  tryscorer: string;
  match_total?: number | null;
  users: User[];
  previousRoundWinners: UserShieldTip[] | null;
  priorWinners: UserShieldTip[];
  roundGames: Game[];
  players: RoundPlayer[];
  readiness: LineupReadiness;
  now: Date;
  season?: number;
}

/**
 * Server-side gate. The form filters the same rules for usability, but this is
 * the only place they are enforced - everything before it is advisory.
 */
export function validateAndBuildShieldTip(
  input: BuildShieldTipInput
): UserShieldTip {
  const {
    email,
    round,
    team,
    tryscorer,
    match_total,
    users,
    previousRoundWinners,
    priorWinners,
    roundGames,
    players,
    readiness,
    now,
    season = CURRENT_SEASON,
  } = input;

  if (!isShieldRound(round)) {
    throw new Error(`Round ${round} is not a Siliva Shield finals round`);
  }
  if (readiness === "not_published") {
    throw new Error(
      "Team lists have not been published yet. Tipping opens once they are."
    );
  }
  if (readiness === "partial") {
    throw new Error(
      "The player list is incomplete right now. Please try again shortly."
    );
  }

  const eligibility = shieldEligibility(email, users, previousRoundWinners);
  if (!eligibility.eligible || !eligibility.user) {
    throw new Error(
      eligibility.reason === "not_registered"
        ? `No user found with email: ${email}`
        : "Only previous round winners can continue in the Siliva Shield."
    );
  }

  const prior = priorSelectionsFor(email, priorWinners);
  const pool = shieldSelectionPool(roundGames, players, prior, now);

  const teamOption = pool.teams.find((t) => t.team === team);
  if (!teamOption) {
    throw new Error(`${team} is not playing in ${finalsWeekLabel(round)}`);
  }
  if (!teamOption.available) {
    throw new Error(
      teamOption.reason === "used"
        ? `You have already used ${team} earlier in the finals`
        : `${team} has already kicked off`
    );
  }

  const playerOption = pool.tryscorers.find((p) => p.name === tryscorer);
  if (!playerOption) {
    throw new Error(`${tryscorer} is not in a team list for this round`);
  }
  if (!playerOption.available) {
    throw new Error(
      playerOption.reason === "used"
        ? `You have already used ${tryscorer} earlier in the finals`
        : `${tryscorer}'s game has already kicked off`
    );
  }

  let total: number | null = null;
  if (requiresTieBreak(round)) {
    if (match_total == null || Number.isNaN(Number(match_total))) {
      throw new Error("Please enter match points total");
    }
    total = Number(match_total);
  }

  return {
    email: eligibility.user.email,
    season,
    round,
    team,
    tryscorer,
    match_total: total,
    tipped_at: now.toISOString(),
  };
}

// --- Orchestration -------------------------------------------------------
// Everything below fetches. Kept beneath the pure section (and imported
// lazily by callers) so the rules above stay unit-testable without network.

import * as data from "./data";
import { SPREADSHEET_NAME } from "./constants";

export interface ShieldPayload {
  /** False outside the four finals rounds - the form should not render. */
  shieldActive: boolean;
  round: number;
  weekLabel: string;
  requiresTieBreak: boolean;
  readiness: LineupReadiness;
  fixtures: { home_team: string; away_team: string; kickoff: string }[];
  eligibility: Eligibility | null;
  pool: SelectionPool | null;
  /** Existing submissions for this email this round (duplicates are allowed). */
  existingTips: UserShieldTip[];
  error?: string;
}

async function winnersForRounds(
  rounds: number[],
  spreadsheetName: string
): Promise<UserShieldTip[]> {
  const all = await Promise.all(
    rounds.map((r) => data.getShieldWinners(r, spreadsheetName))
  );
  return all.flat();
}

export async function getShieldPayload(
  email?: string,
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<ShieldPayload> {
  const round = await data.getCurrentTippingRound(spreadsheetName);
  const base = {
    round,
    weekLabel: finalsWeekLabel(round),
    requiresTieBreak: requiresTieBreak(round),
    fixtures: [] as ShieldPayload["fixtures"],
    eligibility: null,
    pool: null,
    existingTips: [] as UserShieldTip[],
  };

  if (!isShieldRound(round)) {
    return {
      ...base,
      shieldActive: false,
      weekLabel: "",
      readiness: "not_published",
    };
  }

  const games = await data.allGames(spreadsheetName);
  const roundGames = games.filter(
    (g) => g.round === round && g.season === CURRENT_SEASON
  );
  const lineups = await data.roundLineups(round);
  const readiness = lineupReadiness(lineups);
  const fixtures = roundGames.map((g) => ({
    home_team: g.home_team,
    away_team: g.away_team,
    kickoff: g.kickoff,
  }));

  if (!email?.trim()) {
    return { ...base, shieldActive: true, readiness, fixtures };
  }

  const users = await data.allUsers();
  const previousRoundWinners =
    round === SHIELD_FINALS_START_ROUND
      ? null
      : await data.getShieldWinners(round - 1, spreadsheetName);
  const eligibility = shieldEligibility(email, users, previousRoundWinners);

  if (!eligibility.eligible) {
    return {
      ...base,
      shieldActive: true,
      readiness,
      fixtures,
      eligibility,
    };
  }

  const priorWinners = await winnersForRounds(
    priorShieldRounds(round),
    spreadsheetName
  );
  const prior = priorSelectionsFor(email, priorWinners);
  const pool = shieldSelectionPool(roundGames, lineups.players, prior, new Date());
  const roundTips = await data.getShieldTips(round, spreadsheetName);
  const existingTips = roundTips.filter((t) => sameEmail(t.email, email));

  return {
    ...base,
    shieldActive: true,
    readiness,
    fixtures,
    eligibility,
    pool,
    existingTips,
  };
}

/** Loads everything validateAndBuildShieldTip needs, then enforces the rules. */
export async function submitShieldTip(
  input: {
    email: string;
    round: number;
    team: string;
    tryscorer: string;
    match_total?: number | null;
  },
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<UserShieldTip> {
  const { round } = input;
  const [users, games, lineups] = await Promise.all([
    data.allUsers(),
    data.allGames(spreadsheetName),
    data.roundLineups(round),
  ]);
  const previousRoundWinners =
    round === SHIELD_FINALS_START_ROUND
      ? null
      : await data.getShieldWinners(round - 1, spreadsheetName);
  const priorWinners = await winnersForRounds(
    priorShieldRounds(round),
    spreadsheetName
  );

  return validateAndBuildShieldTip({
    ...input,
    users,
    previousRoundWinners,
    priorWinners,
    roundGames: games.filter(
      (g) => g.round === round && g.season === CURRENT_SEASON
    ),
    players: lineups.players,
    readiness: lineupReadiness(lineups),
    now: new Date(),
  });
}
