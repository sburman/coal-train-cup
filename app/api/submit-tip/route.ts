import { NextRequest, NextResponse } from "next/server";
import * as data from "@/lib/data";
import * as sheets from "@/lib/sheets";
import * as tipping from "@/lib/tipping";
import * as lb from "@/lib/leaderboard";
import { SPREADSHEET_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, tip, tipped_at } = body as {
      email: string;
      tip: tipping.AvailableTip;
      tipped_at: string;
    };
    if (!email || !tip || !tipped_at) {
      return NextResponse.json(
        { error: "Missing email, tip, or tipped_at" },
        { status: 400 }
      );
    }
    const users = await data.allUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return NextResponse.json(
        { error: `No user found with email: ${email}` },
        { status: 400 }
      );
    }
    const userTip = tipping.validateAndBuildTip(user, tip, tipped_at);
    await sheets.appendTipToSheet(userTip, SPREADSHEET_NAME);
    data.invalidateTipsCache();
    lb.invalidateLeaderboardCache();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 400 }
    );
  }
}
