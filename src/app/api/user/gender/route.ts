// /api/user/gender/route.ts or pages/api/user/gender.ts

import { auth } from "../../../../../auth";
import clientPromise from "@/lib/clientPromise";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gender } = await req.json();
    
    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    // Update user's gender in database
    const result = await users.updateOne(
      { email: session.user.email },
      { 
        $set: { 
          gender: gender,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    if (result.acknowledged) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error updating gender:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}