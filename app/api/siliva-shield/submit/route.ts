import { NextRequest, NextResponse } from "next/server";
import * as data from "@/lib/data";
import * as sheets from "@/lib/sheets";
import { submitShieldTip } from "@/lib/shield";
import { SPREADSHEET_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, round, team, tryscorer, match_total } = body as {
      email?: string;
      round?: number | string;
      team?: string;
      tryscorer?: string;
      match_total?: number | null;
    };
    if (!email || !round || !team || !tryscorer) {
      return NextResponse.json(
        { error: "Missing email, round, team, or tryscorer" },
        { status: 400 }
      );
    }

    // The round is not taken on trust: a stale tab (or a crafted body) must not
    // be able to write into a different finals week.
    const currentRound = await data.getCurrentTippingRound();
    if (Number(round) !== currentRound) {
      return NextResponse.json(
        {
          error:
            "That tipping round has moved on. Please refresh and try again.",
        },
        { status: 400 }
      );
    }

    // Every rule is enforced here. The form filters the same options for
    // usability, but this is the only place the rules actually hold.
    let tip;
    try {
      tip = await submitShieldTip({
        email: String(email),
        round: currentRound,
        team: String(team),
        tryscorer: String(tryscorer),
        match_total: match_total ?? null,
      });
    } catch (validationError) {
      return NextResponse.json(
        { error: (validationError as Error).message },
        { status: 400 }
      );
    }

    await sheets.appendShieldTipToSheet(tip, SPREADSHEET_NAME);
    data.invalidateShieldTips(tip.round, SPREADSHEET_NAME);
    return NextResponse.json({ ok: true, tip });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
