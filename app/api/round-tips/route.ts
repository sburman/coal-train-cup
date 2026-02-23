import { NextRequest, NextResponse } from "next/server";
import * as data from "@/lib/data";
import * as lb from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const roundParam = request.nextUrl.searchParams.get("round");
  if (!roundParam) {
    const statuses = await data.getAllRoundsStatus();
    const closed = Object.entries(statuses)
      .filter(([, s]) => s === "closed")
      .map(([r]) => parseInt(r, 10))
      .sort((a, b) => a - b);
    return NextResponse.json({ availableRounds: closed });
  }
  const round = parseInt(roundParam, 10);
  if (Number.isNaN(round)) {
    return NextResponse.json(
      { error: "Invalid round" },
      { status: 400 }
    );
  }
  try {
    const [tips, gameResults] = await Promise.all([
      data.allUserTips(),
      data.allGameResults(),
    ]);
    const roundTips = tips.filter((t) => t.round === round);
    const roundResults = data.getGameResultsForRound(gameResults, round);
    const teamCounts = new Map<string, number>();
    for (const t of roundTips) {
      teamCounts.set(t.team, (teamCounts.get(t.team) ?? 0) + 1);
    }
    const teamsWithResult = roundResults.map((r) => ({
      team: r.team,
      result: r.margin > 0 ? "Won" : r.margin < 0 ? "Lost" : "Draw",
    }));
    const allTeams = Array.from(new Set(roundResults.map((r) => r.team)));
    const teamStats = allTeams.map((team) => ({
      team,
      count: teamCounts.get(team) ?? 0,
      result: teamsWithResult.find((t) => t.team === team)?.result ?? "Unknown",
    }));
    const resultCounts = { Won: 0, Lost: 0, Draw: 0 };
    for (const t of roundTips) {
      const res = teamsWithResult.find((r) => r.team === t.team)?.result;
      if (res) resultCounts[res as keyof typeof resultCounts]++;
    }
    return NextResponse.json({
      round,
      tips: roundTips,
      teamStats,
      resultCounts,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
