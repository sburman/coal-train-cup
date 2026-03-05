import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { invalidateAll } from "@/lib/cache";

export const dynamic = "force-dynamic";

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
  invalidateAll();
  return NextResponse.json({ ok: true });
}
