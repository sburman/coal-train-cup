import { NextRequest, NextResponse } from "next/server";
import * as data from "@/lib/data";
import * as lb from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const roundParam = request.nextUrl.searchParams.get("round");
    const maxRound =
      roundParam !== null ? parseInt(roundParam, 10) : await data.getMostRecentClosedRound();
    if (Number.isNaN(maxRound) || maxRound < 1) {
      return NextResponse.json(
        { error: "Invalid round" },
        { status: 400 }
      );
    }
    const full = await lb.buildFullResultsDataframe();
    const leaderboard = lb.getLeaderboardDataframe(full, maxRound);
    const res = NextResponse.json({ round: maxRound, leaderboard });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
