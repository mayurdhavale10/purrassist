import { NextResponse } from "next/server";
// from src/app/api/user/plan/route.ts → project root auth.ts (5 levels up)
import { auth } from "../../../../../auth";
import clientPromise from "@/lib/clientPromise";

export async function GET() {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ planType: null }, { status: 200 });

    const db = (await clientPromise).db();
    const user = await db.collection("users").findOne(
      { email },
      { projection: { planType: 1 } }
    );

    return NextResponse.json({ planType: user?.planType ?? null }, { status: 200 });
  } catch (e) {
    console.error("GET /api/user/plan error:", e);
    return NextResponse.json({ planType: null, error: "Internal error" }, { status: 500 });
  }
}
