import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import * as sheets from "@/lib/sheets";
import * as data from "@/lib/data";
import * as lb from "@/lib/leaderboard";
import { SPREADSHEET_NAME } from "@/lib/constants";
import type { UserTip } from "@/lib/types";
import type { Game } from "@/lib/types";

export const dynamic = "force-dynamic";

function duplicateKey(t: UserTip): string {
  return `${t.email}|${t.season}|${t.round}|${t.team}|${t.opponent}`;
}

function roundEmailKey(t: UserTip): string {
  return `${t.email}|${t.round}`;
}

function findKickoff(games: Game[], tip: UserTip): Date | null {
  const g = games.find(
    (x) =>
      x.season === tip.season &&
      x.round === tip.round &&
      (x.home_team === tip.team || x.away_team === tip.team)
  );
  return g ? new Date(g.kickoff) : null;
}

/**
 * Phase 1: Same (email, season, round, team, opponent); keep last by tipped_at.
 * Returns rows to delete, grouped by round.
 */
function getPhase1RowsToDelete(
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

export type IllegalTip = UserTip;

/**
 * Phase 2: Same (email, round) but different games. Keep the latest LEGAL tip.
 * A tip is illegal if it was submitted after an earlier tip's game had already kicked off
 * (user can't override a locked-in tip). Sort by tipped_at; tip i is legal iff for all j < i,
 * kickoff[j] > tipped_at[i]. Keep max{i : legal[i]}, delete the rest.
 * Returns row indices to delete and the list of tips that were illegal (deleted for that reason).
 */
function getPhase2RowsToDelete(
  withRows: sheets.UserTipWithRow[],
  games: Game[]
): { byRound: Map<number, number[]>; illegalTips: IllegalTip[] } {
  const byRoundEmail = new Map<string, sheets.UserTipWithRow[]>();
  for (const row of withRows) {
    const key = roundEmailKey(row.tip);
    if (!byRoundEmail.has(key)) byRoundEmail.set(key, []);
    byRoundEmail.get(key)!.push(row);
  }
  const toDelete: sheets.UserTipWithRow[] = [];
  const illegalTips: IllegalTip[] = [];
  for (const group of byRoundEmail.values()) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort(
      (a, b) =>
        new Date(a.tip.tipped_at).getTime() -
        new Date(b.tip.tipped_at).getTime()
    );
    const kickoffs = sorted.map((r) => findKickoff(games, r.tip));
    const legal = sorted.map((_, i) => {
      const tippedAt = new Date(sorted[i].tip.tipped_at).getTime();
      for (let j = 0; j < i; j++) {
        const k = kickoffs[j];
        if (k != null && k.getTime() <= tippedAt) return false;
      }
      return true;
    });
    let keepIndex = 0;
    for (let i = legal.length - 1; i >= 0; i--) {
      if (legal[i]) {
        keepIndex = i;
        break;
      }
    }
    for (let i = 0; i < sorted.length; i++) {
      if (i !== keepIndex) {
        toDelete.push(sorted[i]);
        if (!legal[i]) illegalTips.push(sorted[i].tip);
      }
    }
  }
  const byRound = new Map<number, number[]>();
  for (const { round, zeroBasedRowIndex } of toDelete) {
    if (!byRound.has(round)) byRound.set(round, []);
    byRound.get(round)!.push(zeroBasedRowIndex);
  }
  return { byRound, illegalTips };
}

/** Merge per-round index lists and dedupe (same row must not be deleted twice). */
function mergeAndDedupe(
  a: Map<number, number[]>,
  b: Map<number, number[]>
): Map<number, number[]> {
  const rounds = new Set([...a.keys(), ...b.keys()]);
  const out = new Map<number, number[]>();
  for (const round of rounds) {
    const set = new Set<number>([...(a.get(round) ?? []), ...(b.get(round) ?? [])]);
    out.set(round, [...set].sort((x, y) => y - x));
  }
  return out;
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
    const [withRows, games] = await Promise.all([
      sheets.loadUserTipsWithRowIndices(SPREADSHEET_NAME),
      data.allGames(SPREADSHEET_NAME),
    ]);
    const phase1 = getPhase1RowsToDelete(withRows);
    const phase2Result = getPhase2RowsToDelete(withRows, games);
    const byRound = mergeAndDedupe(phase1, phase2Result.byRound);
    let deleted = 0;
    for (const [round, indices] of byRound) {
      if (indices.length === 0) continue;
      await sheets.deleteRows(
        SPREADSHEET_NAME,
        `Round ${round}`,
        indices
      );
      deleted += indices.length;
    }
    data.invalidateTipsCache();
    lb.invalidateLeaderboardCache();
    return NextResponse.json({
      ok: true,
      deleted,
      illegalTips: phase2Result.illegalTips,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
