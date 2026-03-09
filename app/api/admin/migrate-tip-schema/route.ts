import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import * as sheets from "@/lib/sheets";
import * as data from "@/lib/data";
import * as lb from "@/lib/leaderboard";
import { SPREADSHEET_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let email: string | null = null;
  try {
    const body = await request.json();
    email = (body?.email as string) ?? null;
  } catch {
    email = null;
  }
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const results = await sheets.migrateRoundTipSheetsSchema(SPREADSHEET_NAME);
    data.invalidateTipsCache();
    lb.invalidateLeaderboardCache();
    return NextResponse.json({ ok: true, results });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
