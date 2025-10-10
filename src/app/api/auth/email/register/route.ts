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
    const lane: Lane = body?.lane === "A" || body?.lane === "B" ? body.lane : "B";

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

    // Collections
    const users = await getUsersCollection();
    const client = await clientPromise;
    const db = client.db();
    const pending = db.collection("pending_signups");

    // Uniqueness checks across BOTH users and pending_signups
    const emailExists =
      (await users.findOne({ $or: [{ emailLower: email }, { email }] }, { projection: { _id: 1 } })) ||
      (await pending.findOne({ $or: [{ emailLower: email }, { email }] }, { projection: { _id: 1 } }));
    if (emailExists) {
      return NextResponse.json({ ok: false, error: "email_exists" }, { status: 409 });
    }

    const handleTaken =
      (await users.findOne({ handleLower: handle.toLowerCase() }, { projection: { _id: 1 } })) ||
      (await pending.findOne({ handleLower: handle.toLowerCase() }, { projection: { _id: 1 } }));
    if (handleTaken) {
      return NextResponse.json({ ok: false, error: "username_taken" }, { status: 409 });
    }

    const passwordHash = await hash(password, 10);

    if (lane === "A") {
      // Lane A → write directly into users
      const userDoc = withDerivedUserFields({
        _id: new ObjectId(),
        email,
        name: profileName,
        displayName: profileName,
        handle,
        passwordHash,
        lane: "A",
        verificationStatus: "auto",
        planTier: "FREE",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      try {
        await users.insertOne(userDoc as any);
      } catch (err: any) {
        if (err?.code === 11000) {
          const kp = err?.keyPattern || {};
          if (kp.handleLower) return NextResponse.json({ ok: false, error: "username_taken" }, { status: 409 });
          if (kp.emailLower || kp.email) return NextResponse.json({ ok: false, error: "email_exists" }, { status: 409 });
          return NextResponse.json({ ok: false, error: "conflict" }, { status: 409 });
        }
        throw err;
      }

      return NextResponse.json({ ok: true, lane: "A" }, { status: 201 });
    }

    // Lane B → write to pending_signups ONLY
    const pendingDoc = {
      _id: new ObjectId(),
      email,
      emailLower: email,
      name: profileName,
      displayName: profileName,
      displayNameLower: profileName.trim().toLowerCase(),
      handle,
      handleLower: handle.toLowerCase(),
      passwordHash,
      lane: "B",
      // OTP fields will be set by /email-otp/start
      emailOtpHash: null as string | null,
      emailOtpExp: null as Date | null,
      otpTries: 0,
      otpLastSentAt: null as Date | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await pending.insertOne(pendingDoc);

    return NextResponse.json({ ok: true, lane: "B", pending: true }, { status: 201 });
  } catch (e: any) {
    console.error("register (Option A) error:", e);
    return NextResponse.json({ ok: false, error: "server_error", detail: e?.message }, { status: 500 });
  }
}
