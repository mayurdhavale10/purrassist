// src/app/api/auth/email-otp/verify/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
import { verifyHash } from "@/lib/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Option B: Verify OTP against pending_signups only.
 * Body: { email: string, code: string }
 * - No user creation here.
 * - On success: set emailVerifiedAt, clear OTP fields.
 */
export async function POST(req: Request) {
  try {
    const { email, code } = await req.json().catch(() => ({}));
    const emailLower = String(email || "").trim().toLowerCase();
    const codeStr = String(code || "").trim();

    if (!emailLower || !codeStr) {
      return NextResponse.json({ ok: false, error: "missing_email_or_code" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const pending = db.collection("pending_signups");

    // pull only what we need
    const p = await pending.findOne(
      { emailLower },
      { projection: { emailOtpHash: 1, emailOtpExp: 1, otpTries: 1 } }
    );

    if (!p) {
      // Email not in pending — do NOT leak existence. Return generic.
      return NextResponse.json({ ok: false, error: "expired_or_missing" }, { status: 400 });
    }

    // throttling: max 5 attempts
    if ((p.otpTries ?? 0) >= 5) {
      return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
    }

    // must have non-expired code
    if (!p.emailOtpHash || !p.emailOtpExp || new Date() > new Date(p.emailOtpExp)) {
      return NextResponse.json({ ok: false, error: "expired_or_missing" }, { status: 400 });
    }

    const ok = verifyHash(codeStr, p.emailOtpHash);
    if (!ok) {
      await pending.updateOne({ emailLower }, { $inc: { otpTries: 1 }, $set: { updatedAt: new Date() } });
      return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
    }

    // success → clear OTP fields, mark emailVerifiedAt (Option B)
    await pending.updateOne(
      { emailLower },
      {
        $unset: { emailOtpHash: "", emailOtpExp: "", otpTries: "" },
        $set: { emailVerifiedAt: new Date(), updatedAt: new Date() },
      }
    );

    // Client should now proceed to Role → ID Upload, and promotion happens in /api/verification/upload
    return NextResponse.json({ ok: true, emailVerified: true });
  } catch (e: any) {
    console.error("[email-otp/verify] error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
