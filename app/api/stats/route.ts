import { NextResponse } from "next/server";
import * as data from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [users, tips, games, gameResults] = await Promise.all([
      data.allUsers(),
      data.allUserTips(),
      data.allGames(),
      data.allGameResults(),
    ]);
    const res = NextResponse.json({
      usersCount: users.length,
      tipsCount: tips.length,
      gamesCount: games.length,
      resultedGamesCount: Math.floor(gameResults.length / 2),
    });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
