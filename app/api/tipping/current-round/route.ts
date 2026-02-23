import { NextResponse } from "next/server";
import * as data from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const round = await data.getCurrentTippingRound();
    return NextResponse.json({ round });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
