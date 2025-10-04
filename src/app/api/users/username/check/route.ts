// src/app/api/users/username/check/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
import { normalizeHandle, validateHandle } from "@/lib/users/handle";
import { auth } from "../../../../../../auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // optional: signed-in users can skip their own handle
    const session = await auth();
    const myEmail = session?.user?.email?.toLowerCase() ?? null;

    const { searchParams } = new URL(req.url);
    const handleRaw = searchParams.get("handle") ?? "";
    const clean = normalizeHandle(handleRaw);
    const v = validateHandle(clean);
    if (!v.ok) {
      return NextResponse.json({ ok: false, reason: v.reason }, { status: 200 });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    const hLower = clean.toLowerCase();
    const existing = await users.findOne(
      { handleLower: hLower },
      { projection: { _id: 1, email: 1 } }
    );

    // Free if no one has it, or only the same person (by email) has it
    if (!existing) {
      return NextResponse.json({ ok: true, available: true }, { status: 200 });
    }
    if (myEmail && existing.email?.toLowerCase() === myEmail) {
      return NextResponse.json({ ok: true, available: true, mine: true }, { status: 200 });
    }

    return NextResponse.json({ ok: true, available: false, reason: "taken" }, { status: 200 });
  } catch (err) {
    console.error("username/check error", err);
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500 });
  }
}
