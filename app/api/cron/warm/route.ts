import { NextResponse } from "next/server";
import * as data from "@/lib/data";

/**
 * Daily cron at 14:00 UTC (midnight AEST) to warm caches so first user requests are fast.
 * Hobby plan: cron runs at most once per day.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await Promise.all([
      data.allUsers(),
      data.allUserTips(),
      data.allGames(),
      data.getMostRecentClosedRound(),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Cron warm error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
