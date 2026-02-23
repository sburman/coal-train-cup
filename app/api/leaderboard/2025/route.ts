import { NextRequest, NextResponse } from "next/server";
import * as lb from "@/lib/leaderboard";
import { LEGACY_SPREADSHEET_2025 } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const roundParam = request.nextUrl.searchParams.get("round") ?? "27";
    const maxRound = parseInt(roundParam, 10);
    if (Number.isNaN(maxRound) || maxRound < 1 || maxRound > 27) {
      return NextResponse.json(
        { error: "Invalid round (1-27)" },
        { status: 400 }
      );
    }
    const full = await lb.getFullResultsForSpreadsheet(LEGACY_SPREADSHEET_2025);
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
