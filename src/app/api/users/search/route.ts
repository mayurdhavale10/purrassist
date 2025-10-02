// src/app/api/users/search/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import clientPromise from "@/lib/clientPromise";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { query } = (await req.json().catch(() => ({}))) as { query?: string };
  const q = (query ?? "").trim();
  if (!q) return NextResponse.json({ items: [] });

  const client = await clientPromise;
  const db = client.db();
  const users = db.collection("users");

  let filter: any;

  if (q.includes("@")) {
    // Email exact lookup (normalize to lower)
    filter = { emailLower: q.toLowerCase() };
  } else if (q.startsWith("@")) {
    // Handle exact (strip @)
    const handle = q.slice(1).toLowerCase();
    filter = { handle: handle };
  } else {
    // Name/handle prefix (case-insensitive)
    const rx = new RegExp("^" + escapeRx(q), "i");
    filter = { $or: [{ displayName: rx }, { handle: rx }] };
  }

  const items = await users
    .find(filter, {
      projection: {
        _id: 0,
        userId: 1,
        handle: 1,
        displayName: 1,
        avatarUrl: 1,
        collegeId: 1,
        planTier: 1,
      },
    })
    .limit(20)
    .toArray();

  return NextResponse.json({ items });
}

function escapeRx(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
