/** Shared constants – must match Python constants. */
export const CURRENT_SEASON = 2026;
export const SPREADSHEET_NAME = "Coal Train Cup App 2026";
export const LEGACY_SPREADSHEET_2025 = "Coal Train Cup App 2025";

export const CACHE_TTL_SECONDS = 60 * 60 * 8; // 8 hours
export const GAMES_CACHE_TTL_SECONDS = 60 * 5; // 5 minutes
export const PLAYERS_CACHE_TTL_SECONDS = 600;
export const SHIELD_WINNERS_CACHE_TTL_SECONDS = 60 * 60 * 24;

export const MAGIC_ROUNDS: Record<number, number> = { 2025: 9, 2026: 11 };
export const MAX_HOME_AWAY_TIPS = 13;
export const MAX_TIPS_PER_TEAM = 3;
export const TIP_GRACE_PERIOD_MINUTES = 10;
export const TIP_DISPLAY_GRACE_MINUTES = 5;
export const ROUND_IN_PROGRESS_HOURS = 3;

/**
 * Siliva Shield: finals-only knockout side competition.
 * The four finals weeks are SHIELD_FINALS_START_ROUND .. SHIELD_TIEBREAK_ROUND.
 */
export const SHIELD_FINALS_START_ROUND = 28;
export const SHIELD_TIEBREAK_ROUND = 31;
export const SHIELD_FINALS_WEEKS = 4;

/**
 * Deliberately far tighter than TIP_GRACE_PERIOD_MINUTES. A Shield selection
 * includes a tryscorer, so minutes of grace after kickoff is a window to tip
 * something already witnessed, not leniency. Kept as its own constant so the
 * two cannot drift into each other.
 */
export const SHIELD_TIP_GRACE_MINUTES = 1;

export const SHIELD_TIPS_CACHE_TTL_SECONDS = 60;

/** Negative cache for a pending/incomplete lineup fetch - see data.roundLineups. */
export const SHIELD_LINEUPS_PENDING_TTL_SECONDS = 30;
