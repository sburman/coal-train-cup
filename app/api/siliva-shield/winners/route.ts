import { NextRequest, NextResponse } from "next/server";
import * as data from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const roundParam = request.nextUrl.searchParams.get("round");
  if (!roundParam) {
    return NextResponse.json(
      { error: "Missing round" },
      { status: 400 }
    );
  }
  const round = parseInt(roundParam, 10);
  if (Number.isNaN(round)) {
    return NextResponse.json(
      { error: "Invalid round" },
      { status: 400 }
    );
  }
  try {
    const winners = await data.getShieldWinners(round);
    return NextResponse.json({ round, winners });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
