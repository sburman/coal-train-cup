/**
 * Domain types – parity with coal_train_cup.models.
 * All optional timestamps are ISO strings in API payloads.
 */

export interface User {
  email: string;
  username: string;
  pin?: string;
}

export interface UserTip {
  email: string;
  username: string;
  season: number;
  round: number;
  team: string;
  opponent: string;
  home: boolean;
  tipped_at: string; // ISO
}

export interface UserShieldTip {
  email: string;
  season: number;
  round: number;
  team: string;
  tryscorer: string;
  match_total: number | null;
  tipped_at: string;
}

export interface Tip {
  season: number;
  round: number;
  team: string;
  opponent: string;
  home: boolean;
  available_until: string; // ISO
}

export interface Game {
  season: number;
  round: number;
  kickoff: string; // ISO UTC
  home_team: string;
  away_team: string;
  venue: string;
  home_score: number | null;
  away_score: number | null;
}

export interface GameResult {
  season: number;
  round: number;
  team: string;
  opponent: string;
  home: boolean;
  score_for: number;
  score_against: number;
  margin: number; // score_for - score_against
}

export type RoundStatus = "upcoming" | "in_progress" | "closed";

export interface ResultRow {
  email: string;
  username: string;
  season: number;
  round: number;
  team: string;
  opponent: string;
  home: boolean;
  tipped_at: string;
  margin: number;
  win: boolean;
  draw: boolean;
  loss: boolean;
  points: number; // 2 win, 1 draw, 0 loss
}

export interface LeaderboardRow {
  email: string;
  username: string;
  tips_count: number;
  points: number;
  margin: number;
  position: number;
}
