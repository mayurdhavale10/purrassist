import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
import { verifyHash } from "@/lib/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Option B:
 * Verify OTP against pending_signups only.
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

    const p = await pending.findOne(
      { emailLower },
      { projection: { emailOtpHash: 1, emailOtpExp: 1, otpTries: 1 } }
    );

    if (!p) {
      return NextResponse.json({ ok: false, error: "expired_or_missing" }, { status: 400 });
    }

    if ((p.otpTries ?? 0) >= 5) {
      return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
    }

    if (!p.emailOtpHash || !p.emailOtpExp || new Date() > new Date(p.emailOtpExp)) {
      return NextResponse.json({ ok: false, error: "expired_or_missing" }, { status: 400 });
    }

    const ok = verifyHash(codeStr, p.emailOtpHash);
    if (!ok) {
      await pending.updateOne(
        { emailLower },
        { $inc: { otpTries: 1 }, $set: { updatedAt: new Date() } }
      );
      return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
    }

    // Success → clear OTP fields, mark verified (still in pending)
    await pending.updateOne(
      { emailLower },
      {
        $unset: { emailOtpHash: "", emailOtpExp: "", otpTries: "" },
        $set: { emailVerifiedAt: new Date(), updatedAt: new Date() },
      }
    );

    return NextResponse.json({ ok: true, emailVerified: true });
  } catch (e: any) {
    console.error("[email-otp/verify] error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
