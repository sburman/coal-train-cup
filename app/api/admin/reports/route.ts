import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import * as data from "@/lib/data";
import {
  MAX_HOME_AWAY_TIPS,
  MAX_TIPS_PER_TEAM,
  ROUND_9_MAGIC_ROUND,
} from "@/lib/constants";
import type { UserTip, Game } from "@/lib/types";

export const dynamic = "force-dynamic";

type InvalidTipRow = UserTip & { kickoff: string };
type DuplicateGroup = { round: number; email: string; count: number; tips: UserTip[] };
type TeamViolation = { user: string; team: string; count: number };
type VenueViolation = { user: string; type: "home" | "away"; count: number };

export type AdminReports = {
  invalidTips: InvalidTipRow[];
  duplicateTips: DuplicateGroup[];
  teamViolations: TeamViolation[];
  venueViolations: VenueViolation[];
};

function findGameForTip(games: Game[], tip: UserTip): Game | undefined {
  return games.find(
    (g) =>
      g.season === tip.season &&
      g.round === tip.round &&
      (g.home_team === tip.team || g.away_team === tip.team)
  );
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const [tips, games] = await Promise.all([
      data.allUserTips(),
      data.allGames(),
    ]);

    const invalidTips: InvalidTipRow[] = [];
    for (const tip of tips) {
      const game = findGameForTip(games, tip);
      if (game && new Date(tip.tipped_at) > new Date(game.kickoff)) {
        invalidTips.push({ ...tip, kickoff: game.kickoff });
      }
    }

    const roundEmailKey = (t: UserTip) => `${t.round}:${t.email}`;
    const byRoundEmail = new Map<string, UserTip[]>();
    for (const tip of tips) {
      const key = roundEmailKey(tip);
      if (!byRoundEmail.has(key)) byRoundEmail.set(key, []);
      byRoundEmail.get(key)!.push(tip);
    }
    const duplicateTips: DuplicateGroup[] = [];
    for (const [key, group] of byRoundEmail) {
      if (group.length <= 1) continue;
      const [roundStr, emailPart] = key.split(":");
      duplicateTips.push({
        round: Number(roundStr),
        email: emailPart,
        count: group.length,
        tips: group,
      });
    }

    const userTeamCounts = new Map<string, Map<string, number>>();
    for (const tip of tips) {
      const u = tip.email;
      if (!userTeamCounts.has(u)) userTeamCounts.set(u, new Map());
      const teams = userTeamCounts.get(u)!;
      teams.set(tip.team, (teams.get(tip.team) ?? 0) + 1);
    }
    const teamViolations: TeamViolation[] = [];
    for (const [user, teams] of userTeamCounts) {
      for (const [team, count] of teams) {
        if (count > MAX_TIPS_PER_TEAM) {
          teamViolations.push({ user, team, count });
        }
      }
    }

    const userVenueCounts = new Map<string, { home: number; away: number }>();
    for (const tip of tips) {
      if (tip.round === ROUND_9_MAGIC_ROUND) continue;
      const u = tip.email;
      if (!userVenueCounts.has(u)) userVenueCounts.set(u, { home: 0, away: 0 });
      const v = userVenueCounts.get(u)!;
      if (tip.home) v.home += 1;
      else v.away += 1;
    }
    const venueViolations: VenueViolation[] = [];
    for (const [user, v] of userVenueCounts) {
      if (v.home > MAX_HOME_AWAY_TIPS) {
        venueViolations.push({ user, type: "home", count: v.home });
      }
      if (v.away > MAX_HOME_AWAY_TIPS) {
        venueViolations.push({ user, type: "away", count: v.away });
      }
    }

    const payload: AdminReports = {
      invalidTips,
      duplicateTips,
      teamViolations,
      venueViolations,
    };
    return NextResponse.json(payload);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
