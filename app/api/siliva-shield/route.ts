import { NextRequest, NextResponse } from "next/server";
import { getShieldPayload } from "@/lib/shield";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email") ?? undefined;
  try {
    const payload = await getShieldPayload(email);
    return NextResponse.json(payload);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
