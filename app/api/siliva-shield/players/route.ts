import { NextRequest, NextResponse } from "next/server";
import * as data from "@/lib/data";
import { lineupReadiness } from "@/lib/shield";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const roundParam = request.nextUrl.searchParams.get("round");
  const round = roundParam
    ? parseInt(roundParam, 10)
    : await data.getCurrentTippingRound();
  if (Number.isNaN(round)) {
    return NextResponse.json({ error: "Invalid round" }, { status: 400 });
  }
  try {
    const lineups = await data.roundLineups(round);
    return NextResponse.json({
      round,
      readiness: lineupReadiness(lineups),
      players: lineups.players,
      fixtureCount: lineups.fixtureCount,
      fixturesWithLineups: lineups.fixturesWithLineups,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
