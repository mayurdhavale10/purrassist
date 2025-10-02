import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";            // ← root auth.ts
import { listConversations } from "@/lib/connections/inbox";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const meId = String((session.user as any).id);

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor") || undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);

  const data = await listConversations({ userId: meId, cursor, limit });
  return NextResponse.json(data);
}
