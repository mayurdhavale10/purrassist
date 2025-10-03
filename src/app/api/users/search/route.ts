// src/app/api/users/search/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
// If your auth export is at project root `auth.ts`, this relative import works from /src/app/api/**/*
import { auth } from "../../../../../auth"; // adjust if your path differs

export const dynamic = "force-dynamic"; // no caching

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    if (!q) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    // Parse query: email, @handle, or name prefix
    const isEmail = q.includes("@");
    const isHandle = q.startsWith("@");
    const handle = isHandle ? q.slice(1) : null;

    const or: any[] = [];
    if (isEmail) {
      or.push({ emailLower: q });
    } else if (isHandle && handle) {
      or.push({ handleLower: handle });
    } else {
      // name/displayName prefix search (simple regex; tune later)
      or.push({ displayNameLower: { $regex: `^${escapeRegex(q)}` } });
      // also allow handle prefix without @
      or.push({ handleLower: { $regex: `^${escapeRegex(q)}` } });
    }

    // Exclude self
    const meEmail = session.user.email.toLowerCase();

    const cursor = users
      .find(
        {
          $and: [
            { emailLower: { $ne: meEmail } },
            { $or: or },
          ],
        },
        {
          projection: {
            _id: 0,
            userId: 1,
            emailLower: 1,
            handle: 1,
            handleLower: 1,
            displayName: 1,
            avatarUrl: 1,
            collegeName: 1,
            planTier: 1,
          },
        }
      )
      .limit(10);

    const results = await cursor.toArray();
    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    console.error("users/search error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// tiny helper to make regex safe
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
