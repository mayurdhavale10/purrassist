import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
import { getUsersCollection, withDerivedUserFields } from "@/models/user.model";
import { verifyHash } from "@/lib/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public endpoint for pending signups (no session yet).
 * body: { email: string, code: string }
 * If valid → move doc from pending_signups → users; delete pending.
 */
export async function POST(req: Request) {
  try {
    const { email: emailRaw, code } = await req.json();
    const emailLower = String(emailRaw || "").trim().toLowerCase();
    const codeStr = String(code || "");

    if (!emailLower || !emailLower.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    if (!codeStr) {
      return NextResponse.json({ ok: false, error: "missing_code" }, { status: 400 });
    }

    const users = await getUsersCollection();
    const client = await clientPromise;
    const db = client.db();
    const pending = db.collection("pending_signups");

    // Load pending record
    const p = await pending.findOne(
      { emailLower },
      {
        projection: {
          email: 1,
          emailLower: 1,
          name: 1,
          displayName: 1,
          displayNameLower: 1,
          handle: 1,
          handleLower: 1,
          passwordHash: 1,
          lane: 1,
          emailOtpHash: 1,
          emailOtpExp: 1,
          otpTries: 1,
          createdAt: 1,
        },
      }
    );

    if (!p) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    // Expiry / tries check
    if (!p.emailOtpHash || !p.emailOtpExp || new Date() > new Date(p.emailOtpExp)) {
      return NextResponse.json({ ok: false, error: "expired_or_missing" }, { status: 400 });
    }
    if ((p.otpTries ?? 0) >= 5) {
      return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
    }

    const ok = verifyHash(codeStr, p.emailOtpHash);
    if (!ok) {
      await pending.updateOne({ _id: p._id }, { $inc: { otpTries: 1 } });
      return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
    }

    // Re-check uniqueness against USERS before moving (race guard)
    const emailClash = await users.findOne(
      { $or: [{ emailLower: p.emailLower }, { email: p.email }] },
      { projection: { _id: 1 } }
    );
    if (emailClash) {
      // Someone else registered while pending
      await pending.deleteOne({ _id: p._id });
      return NextResponse.json({ ok: false, error: "email_exists" }, { status: 409 });
    }

    const handleClash = await users.findOne(
      { handleLower: p.handleLower },
      { projection: { _id: 1 } }
    );
    if (handleClash) {
      // Force user to pick a new username; keep pending (clear OTP so they can re-OTP after rename if you want)
      return NextResponse.json({ ok: false, error: "username_taken" }, { status: 409 });
    }

    // Build final user doc
    const userDoc = withDerivedUserFields({
      email: p.email,
      name: p.displayName ?? p.name ?? null,
      displayName: p.displayName ?? p.name ?? null,
      handle: p.handle,
      passwordHash: p.passwordHash,
      lane: "B",
      verificationStatus: "pending",
      planTier: "FREE",
      createdAt: p.createdAt ?? new Date(),
      updatedAt: new Date(),
    });

    // Insert into users
    await users.insertOne(userDoc as any);

    // Delete pending record
    await pending.deleteOne({ _id: p._id });

    return NextResponse.json({ ok: true, moved: true });
  } catch (e: any) {
    console.error("[email-otp/verify] Option A error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
