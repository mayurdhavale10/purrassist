// src/app/api/users/search/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
import { auth } from "../../../../../../auth";

export const dynamic = "force-dynamic";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    if (!q) return NextResponse.json({ results: [] }, { status: 200 });

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    const meEmailLower = session.user.email.toLowerCase();
    const or: any[] = [];

    // Prioritize exact email match (raw + derived)
    if (q.includes("@")) {
      const qLower = q.toLowerCase();
      or.push({ email: q });            // raw field from adapter
      or.push({ emailLower: qLower });  // derived if present
    } else if (q.startsWith("@")) {
      const h = q.slice(1);
      or.push({ handle: h });                  // raw (if set)
      or.push({ handleLower: h.toLowerCase() });// derived (if set)
    } else {
      // Name / handle prefix search (case-insensitive)
      const rx = new RegExp("^" + escapeRegex(q), "i");
      or.push({ name: rx });                 // adapter default
      or.push({ displayName: rx });          // if you set it later
      or.push({ handle: rx });               // raw handle prefix
      or.push({ handleLower: { $regex: "^" + escapeRegex(q.toLowerCase()) } });
    }

    const cursor = users
      .find(
        {
          $and: [
            { email: { $ne: session.user.email } },      // exclude self by raw email
            { $or: or },
          ],
        },
        {
          projection: {
            _id: 1,
            email: 1,
            name: 1,
            image: 1,
            handle: 1,
          },
        }
      )
      .limit(10);

    const rows = await cursor.toArray();
    const results = rows.map((u) => ({
      userId: String(u._id),
      email: u.email ?? null,
      name: u.name ?? null,
      image: u.image ?? null,
      handle: u.handle ?? null,
    }));

    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    console.error("users/search error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
