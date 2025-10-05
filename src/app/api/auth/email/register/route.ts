import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/clientPromise";
import { getUsersCollection, withDerivedUserFields } from "@/models/user.model";

export const runtime = "nodejs";

type Lane = "A" | "B";

function normHandle(u: string) {
  return u.trim();
}
function normEmail(e: string) {
  return e.trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const emailRaw = String(body?.email ?? "");
    const password = String(body?.password ?? "");
    const profileName = String(body?.profileName ?? "");
    const usernameRaw = String(body?.username ?? "");
    const lane: Lane = (body?.lane === "A" || body?.lane === "B") ? body.lane : "B";

    const email = normEmail(emailRaw);
    const handle = normHandle(usernameRaw);

    // Basic validation
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: "weak_password" }, { status: 400 });
    }
    if (!handle || handle.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(handle)) {
      return NextResponse.json({ ok: false, error: "invalid_username" }, { status: 400 });
    }
    if (!profileName || profileName.length < 2) {
      return NextResponse.json({ ok: false, error: "invalid_profile_name" }, { status: 400 });
    }

    const users = await getUsersCollection();

    // If email already exists (by derived or raw), bail with 409
    const existing = await users.findOne({ $or: [{ emailLower: email }, { email }] });
    if (existing) {
      return NextResponse.json({ ok: false, error: "email_exists" }, { status: 409 });
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Decide verification status by lane
    const verificationStatus = lane === "A" ? "auto" : "pending";

    // Prepare doc
    const docBase = withDerivedUserFields({
      _id: new ObjectId(),
      email,
      name: profileName,                 // optional: you might also keep displayName separately
      displayName: profileName,
      handle,                            // case-preserving
      // derived fields (emailLower/handleLower/displayNameLower) are set by helper
      passwordHash,
      lane,
      verificationStatus,
      planTier: "FREE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert with duplicate key handling (race-safe)
    try {
      await users.insertOne(docBase as any);
    } catch (err: any) {
      if (err?.code === 11000) {
        // Duplicate key — figure out if it's emailLower or handleLower
        const kp = err?.keyPattern || {};
        if (kp.handleLower) {
          return NextResponse.json({ ok: false, error: "username_taken" }, { status: 409 });
        }
        if (kp.emailLower || kp.email) {
          return NextResponse.json({ ok: false, error: "email_exists" }, { status: 409 });
        }
        // Fallback
        return NextResponse.json({ ok: false, error: "conflict" }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    console.error("register error:", e);
    return NextResponse.json({ ok: false, error: "server_error", detail: e?.message }, { status: 500 });
  }
}
