import { NextRequest, NextResponse } from "next/server";
import * as data from "@/lib/data";
import * as tipping from "@/lib/tipping";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email") ?? "";
  if (!email.trim()) {
    const round = await data.getCurrentTippingRound();
    return NextResponse.json({ currentRound: round });
  }
  try {
    const payload = await tipping.getMakeTipPayload(email.trim());
    return NextResponse.json(payload);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
