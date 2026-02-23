import { NextRequest, NextResponse } from "next/server";
import * as data from "@/lib/data";
import * as sheets from "@/lib/sheets";
import { SPREADSHEET_NAME } from "@/lib/constants";
import type { UserShieldTip } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, season, round, team, tryscorer, match_total } = body as Partial<UserShieldTip> & {
      match_total?: number | null;
    };
    if (!email || !round || !team || !tryscorer) {
      return NextResponse.json(
        { error: "Missing email, round, team, or tryscorer" },
        { status: 400 }
      );
    }
    const tip: UserShieldTip = {
      email: String(email),
      season: season ?? 2026,
      round: Number(round),
      team: String(team),
      tryscorer: String(tryscorer),
      match_total: match_total != null ? Number(match_total) : null,
      tipped_at: new Date().toISOString(),
    };
    await sheets.appendShieldTipToSheet(tip, SPREADSHEET_NAME);
    data.getShieldWinners(round).then(() => {}); // cache will refresh on next read with TTL
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
