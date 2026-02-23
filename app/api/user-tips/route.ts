import { NextRequest, NextResponse } from "next/server";
import * as data from "@/lib/data";
import * as lb from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email?.trim()) {
    return NextResponse.json(
      { error: "Missing email" },
      { status: 400 }
    );
  }
  try {
    const maxRound = await data.getMostRecentClosedRound();
    const full = await lb.buildFullResultsDataframe();
    const filtered = lb.getFullResultsDataframe(full, maxRound);
    const userResults = filtered.filter(
      (r) => r.email.toLowerCase() === email.trim().toLowerCase()
    );
    const users = await data.allUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return NextResponse.json(
        { error: `No user found with email: ${email}` },
        { status: 404 }
      );
    }
    const teams = await data.allTeams();
    const positionsByRound: { round: number; position: number }[] = [];
    for (let r = 1; r <= maxRound; r++) {
      const board = lb.getLeaderboardDataframe(full, r);
      const row = board.find((x) => x.email.toLowerCase() === user.email.toLowerCase());
      if (row) positionsByRound.push({ round: r, position: row.position });
    }
    return NextResponse.json({
      user,
      maxRound,
      results: userResults,
      teams,
      positionsByRound,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
