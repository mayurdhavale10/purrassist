// src/app/api/auth/email/register/route.ts
import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/clientPromise";
import { getUsersCollection, withDerivedUserFields } from "@/models/user.model";

export const runtime = "nodejs";

type Lane = "A" | "B";

function normEmail(e: string) {
  return e.trim().toLowerCase();
}
function normHandle(u: string) {
  return u.trim();
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
    const handleLower = handle.toLowerCase();

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
    const client = await clientPromise;
    const db = client.db();
    const pending = db.collection("pending_signups");

    // 1) Hard conflict if email already in USERS
    const emailInUsers = await users.findOne(
      { $or: [{ emailLower: email }, { email }] },
      { projection: { _id: 1 } }
    );
    if (emailInUsers) {
      return NextResponse.json({ ok: false, error: "email_exists" }, { status: 409 });
    }

    // 2) Handle must be unique across USERS
    const handleInUsers = await users.findOne({ handleLower }, { projection: { _id: 1 } });
    if (handleInUsers) {
      return NextResponse.json({ ok: false, error: "username_taken" }, { status: 409 });
    }

    // 3) Check PENDING state
    const pendingExisting = await pending.findOne(
      { $or: [{ emailLower: email }, { email }] },
      { projection: { _id: 1, emailLower: 1 } }
    );

    // 3a) Handle already reserved in PENDING for another email → conflict
    const handleInPending = await pending.findOne(
      { handleLower },
      { projection: { _id: 1, emailLower: 1 } }
    );
    if (handleInPending && handleInPending.emailLower !== email) {
      return NextResponse.json({ ok: false, error: "username_taken" }, { status: 409 });
    }

    // Hash password once
    const passwordHash = await hash(password, 10);

    if (pendingExisting) {
      // Update existing pending record with latest profile/handle/password
      await pending.updateOne(
        { _id: pendingExisting._id },
        {
          $set: {
            email,
            emailLower: email,
            displayName: profileName,
            displayNameLower: profileName.trim().toLowerCase(),
            handle,
            handleLower,
            passwordHash,
            lane: "B",
            verificationStatus: "pending",
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        }
      );

      // Tell client to resume OTP flow
      return NextResponse.json(
        { ok: true, lane: "B", pending: true, resume: true },
        { status: 202 }
      );
    }

    // 4) Fresh registration
    if (lane === "A") {
      // Lane A → create REAL user directly
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

    // Lane B → create PENDING record only
    const pendingDoc = {
      _id: new ObjectId(),
      email,
      emailLower: email,
      displayName: profileName,
      displayNameLower: profileName.trim().toLowerCase(),
      handle,
      handleLower,
      passwordHash, // applied to real user upon promotion
      lane: "B",
      verificationStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await pending.insertOne(pendingDoc as any);
    } catch (err: any) {
      if (err?.code === 11000) {
        const kp = err?.keyPattern || {};
        if (kp.handleLower) {
          return NextResponse.json({ ok: false, error: "username_taken" }, { status: 409 });
        }
        if (kp.emailLower || kp.email) {
          // Treat as resume if duplicate by email
          return NextResponse.json(
            { ok: true, lane: "B", pending: true, resume: true },
            { status: 202 }
          );
        }
        return NextResponse.json({ ok: false, error: "conflict" }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({ ok: true, lane: "B", pending: true }, { status: 201 });
  } catch (e: any) {
    console.error("register error:", e);
    return NextResponse.json(
      { ok: false, error: "server_error", detail: e?.message },
      { status: 500 }
    );
  }
}
