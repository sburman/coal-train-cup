import { NextRequest, NextResponse } from "next/server";
import * as data from "@/lib/data";
import * as sheets from "@/lib/sheets";
import * as lb from "@/lib/leaderboard";
import { SPREADSHEET_NAME } from "@/lib/constants";
import type { UserTip } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tips = await data.allUserTips();
    return NextResponse.json({ tips });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      username,
      season,
      round,
      team,
      opponent,
      home,
      tipped_at,
    } = body as Partial<UserTip>;
    if (
      !email ||
      !username ||
      season == null ||
      !round ||
      !team ||
      !opponent ||
      home === undefined ||
      !tipped_at
    ) {
      return NextResponse.json(
        { error: "Missing required fields: email, username, season, round, team, opponent, home, tipped_at" },
        { status: 400 }
      );
    }
    const tip: UserTip = {
      email: String(email),
      username: String(username),
      season: Number(season),
      round: Number(round),
      team: String(team),
      opponent: String(opponent),
      home: Boolean(home),
      tipped_at: String(tipped_at),
    };
    await sheets.appendTipToSheet(tip, SPREADSHEET_NAME);
    data.invalidateTipsCache();
    lb.invalidateLeaderboardCache();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
