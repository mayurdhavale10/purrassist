// src/app/api/users/search/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
// From /src/app/api/users/search/route.ts to project root is 4 levels:
import { auth } from "../../../../../auth";

export const dynamic = "force-dynamic"; // no caching in dev

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
    const qRaw = (searchParams.get("q") || "").trim();
    if (!qRaw) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const q = qRaw.replace(/^@/, ""); // allow @handle style later

    const client = await clientPromise;
    const db = client.db(); // DB from your MONGODB_URI
    const users = db.collection("users");

    // Exclude self
    const meEmail = (session.user.email as string) || "";

    // Match on current fields: name (contains), email (contains)
    const filter = {
      email: { $ne: meEmail },
      $or: [
        { name: { $regex: escapeRegex(q), $options: "i" } },
        { email: { $regex: escapeRegex(q), $options: "i" } },
      ],
    };

    // Project only what exists today. Keep _id so we can build userId.
    const docs = await users
      .find(filter, { projection: { email: 1, name: 1, image: 1 } })
      .limit(10)
      .toArray();

    const results = docs.map((u: any) => ({
      userId: u._id?.toString(),   // use _id for now
      email: u.email ?? null,
      name: u.name ?? null,
      image: u.image ?? null,
      handle: null,                // you don’t store handles yet
    }));

    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    console.error("users/search error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}




















