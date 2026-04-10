import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest } from "next/server";
import { GET } from "../app/api/round-tips/route";
import * as data from "../lib/data";
import type { Game, GameResult, UserTip } from "../lib/types";

jest.mock("../lib/data", () => {
  const actual = jest.requireActual("../lib/data") as typeof import("../lib/data");
  return {
    ...actual,
    allGames: jest.fn(),
    allUserTips: jest.fn(),
    allGameResults: jest.fn(),
  };
});

const mockedData = data as jest.Mocked<typeof data>;

describe("GET /api/round-tips", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists rounds that already have completed games", async () => {
    const games: Game[] = [
      {
        season: 2026,
        round: 5,
        kickoff: "2026-04-01T10:00:00+00:00",
        home_team: "Broncos",
        away_team: "Storm",
        venue: "Suncorp, Brisbane",
        home_score: 20,
        away_score: 10,
      },
      {
        season: 2026,
        round: 6,
        kickoff: "2026-04-08T10:00:00+00:00",
        home_team: "Tigers",
        away_team: "Raiders",
        venue: "Leichhardt, Sydney",
        home_score: 18,
        away_score: 14,
      },
      {
        season: 2026,
        round: 6,
        kickoff: "2026-04-09T10:00:00+00:00",
        home_team: "Eels",
        away_team: "Sharks",
        venue: "Parramatta, Sydney",
        home_score: null,
        away_score: null,
      },
      {
        season: 2026,
        round: 7,
        kickoff: "2026-04-15T10:00:00+00:00",
        home_team: "Roosters",
        away_team: "Bulldogs",
        venue: "Allianz, Sydney",
        home_score: null,
        away_score: null,
      },
    ];

    mockedData.allGames.mockResolvedValue(games);

    const response = await GET(new NextRequest("http://localhost/api/round-tips"));
    const payload = await response.json();

    expect(payload.availableRounds).toEqual([5, 6]);
  });

  it("returns round summary using completed games only", async () => {
    const tips: UserTip[] = [
      {
        email: "a@x.com",
        season: 2026,
        round: 6,
        team: "Broncos",
        opponent: "Storm",
        home: true,
        tipped_at: "2026-04-08T09:00:00+00:00",
      },
      {
        email: "b@x.com",
        season: 2026,
        round: 6,
        team: "Eels",
        opponent: "Sharks",
        home: true,
        tipped_at: "2026-04-08T09:05:00+00:00",
      },
    ];

    const results: GameResult[] = [
      {
        season: 2026,
        round: 6,
        team: "Broncos",
        opponent: "Storm",
        home: true,
        score_for: 20,
        score_against: 10,
        margin: 10,
      },
      {
        season: 2026,
        round: 6,
        team: "Storm",
        opponent: "Broncos",
        home: false,
        score_for: 10,
        score_against: 20,
        margin: -10,
      },
    ];

    const games: Game[] = [
      {
        season: 2026,
        round: 6,
        kickoff: "2026-04-08T10:00:00+00:00",
        home_team: "Broncos",
        away_team: "Storm",
        venue: "Suncorp, Brisbane",
        home_score: 20,
        away_score: 10,
      },
      {
        season: 2026,
        round: 6,
        kickoff: "2026-04-09T10:00:00+00:00",
        home_team: "Eels",
        away_team: "Sharks",
        venue: "Parramatta, Sydney",
        home_score: null,
        away_score: null,
      },
    ];

    mockedData.allUserTips.mockResolvedValue(tips);
    mockedData.allGameResults.mockResolvedValue(results);
    mockedData.allGames.mockResolvedValue(games);

    const response = await GET(new NextRequest("http://localhost/api/round-tips?round=6"));
    const payload = await response.json();

    expect(payload.resultCounts).toEqual({ Won: 1, Lost: 0, Draw: 0 });
    expect(payload.teamStats).toEqual([
      { team: "Broncos", count: 1, result: "Won" },
      { team: "Storm", count: 0, result: "Lost" },
    ]);
    expect(payload.roundProgress).toEqual({
      completedGames: 1,
      totalGames: 2,
      inProgress: true,
    });
  });

  it("marks round as closed when all games are completed", async () => {
    const tips: UserTip[] = [
      {
        email: "a@x.com",
        season: 2026,
        round: 5,
        team: "Broncos",
        opponent: "Storm",
        home: true,
        tipped_at: "2026-04-01T09:00:00+00:00",
      },
    ];

    const results: GameResult[] = [
      {
        season: 2026,
        round: 5,
        team: "Broncos",
        opponent: "Storm",
        home: true,
        score_for: 20,
        score_against: 10,
        margin: 10,
      },
      {
        season: 2026,
        round: 5,
        team: "Storm",
        opponent: "Broncos",
        home: false,
        score_for: 10,
        score_against: 20,
        margin: -10,
      },
    ];

    const games: Game[] = [
      {
        season: 2026,
        round: 5,
        kickoff: "2026-04-01T10:00:00+00:00",
        home_team: "Broncos",
        away_team: "Storm",
        venue: "Suncorp, Brisbane",
        home_score: 20,
        away_score: 10,
      },
    ];

    mockedData.allUserTips.mockResolvedValue(tips);
    mockedData.allGameResults.mockResolvedValue(results);
    mockedData.allGames.mockResolvedValue(games);

    const response = await GET(new NextRequest("http://localhost/api/round-tips?round=5"));
    const payload = await response.json();

    expect(payload.roundProgress).toEqual({
      completedGames: 1,
      totalGames: 1,
      inProgress: false,
    });
  });
});
