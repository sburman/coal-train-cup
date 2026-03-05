import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import * as sheets from "@/lib/sheets";
import * as data from "@/lib/data";
import * as lb from "@/lib/leaderboard";
import { SPREADSHEET_NAME } from "@/lib/constants";
import type { UserTip } from "@/lib/types";

export const dynamic = "force-dynamic";

function duplicateKey(t: UserTip): string {
  return `${t.email}|${t.season}|${t.round}|${t.team}|${t.opponent}`;
}

/**
 * Find duplicate tips (same email, season, round, team, opponent); keep last by tipped_at.
 * Returns the row indices to delete, grouped by round.
 */
function getRowsToDelete(
  withRows: sheets.UserTipWithRow[]
): Map<number, number[]> {
  const byKey = new Map<string, sheets.UserTipWithRow[]>();
  for (const row of withRows) {
    const key = duplicateKey(row.tip);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(row);
  }
  const toDelete: sheets.UserTipWithRow[] = [];
  for (const group of byKey.values()) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort(
      (a, b) =>
        new Date(a.tip.tipped_at).getTime() -
        new Date(b.tip.tipped_at).getTime()
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      toDelete.push(sorted[i]);
    }
  }
  const byRound = new Map<number, number[]>();
  for (const { round, zeroBasedRowIndex } of toDelete) {
    if (!byRound.has(round)) byRound.set(round, []);
    byRound.get(round)!.push(zeroBasedRowIndex);
  }
  return byRound;
}

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
    const withRows = await sheets.loadUserTipsWithRowIndices(SPREADSHEET_NAME);
    const byRound = getRowsToDelete(withRows);
    let deleted = 0;
    for (const [round, indices] of byRound) {
      await sheets.deleteRows(
        SPREADSHEET_NAME,
        `Round ${round}`,
        indices
      );
      deleted += indices.length;
    }
    data.invalidateTipsCache();
    lb.invalidateLeaderboardCache();
    return NextResponse.json({ ok: true, deleted });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
