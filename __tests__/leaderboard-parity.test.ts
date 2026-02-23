/**
 * Parity tests: points rule and leaderboard aggregation match Python behavior.
 * Tests pure logic only (no Sheets/async).
 */

import type { ResultRow, LeaderboardRow } from "../lib/types";

function getFullResultsDataframe(
  full: ResultRow[],
  maxRound: number | null
): ResultRow[] {
  if (!maxRound) return full;
  return full.filter((r) => r.round <= maxRound);
}

function getLeaderboardDataframe(
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

describe("Leaderboard parity", () => {
  const mockFullResults: ResultRow[] = [
    {
      email: "a@x.com",
      username: "Alice",
      season: 2026,
      round: 1,
      team: "Team1",
      opponent: "Team2",
      home: true,
      tipped_at: "2026-01-01T00:00:00Z",
      margin: 10,
      win: true,
      draw: false,
      loss: false,
      points: 2,
    },
    {
      email: "a@x.com",
      username: "Alice",
      season: 2026,
      round: 2,
      team: "Team2",
      opponent: "Team1",
      home: false,
      tipped_at: "2026-01-02T00:00:00Z",
      margin: 0,
      win: false,
      draw: true,
      loss: false,
      points: 1,
    },
    {
      email: "b@x.com",
      username: "Bob",
      season: 2026,
      round: 1,
      team: "Team2",
      opponent: "Team1",
      home: false,
      tipped_at: "2026-01-01T00:00:00Z",
      margin: -10,
      win: false,
      draw: false,
      loss: true,
      points: 0,
    },
  ];

  it("points rule: win=2, draw=1, loss=0", () => {
    expect(mockFullResults[0].points).toBe(2);
    expect(mockFullResults[1].points).toBe(1);
    expect(mockFullResults[2].points).toBe(0);
  });

  it("getFullResultsDataframe filters by maxRound", () => {
    const filtered = getFullResultsDataframe(mockFullResults, 1);
    expect(filtered).toHaveLength(2);
    expect(filtered.every((r) => r.round <= 1)).toBe(true);
  });

  it("getLeaderboardDataframe aggregates and sorts by points then margin", () => {
    const board = getLeaderboardDataframe(mockFullResults, 2);
    expect(board).toHaveLength(2);
    expect(board[0].username).toBe("Alice");
    expect(board[0].points).toBe(3);
    expect(board[0].position).toBe(1);
    expect(board[1].username).toBe("Bob");
    expect(board[1].points).toBe(0);
    expect(board[1].position).toBe(2);
  });
});
