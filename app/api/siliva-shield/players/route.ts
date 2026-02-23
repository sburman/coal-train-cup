import { NextRequest, NextResponse } from "next/server";
import * as data from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const roundParam = request.nextUrl.searchParams.get("round");
  const round = roundParam ? parseInt(roundParam, 10) : 31;
  if (Number.isNaN(round)) {
    return NextResponse.json(
      { error: "Invalid round" },
      { status: 400 }
    );
  }
  try {
    const players = await data.allPlayersInRound(round);
    return NextResponse.json({ round, players });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
