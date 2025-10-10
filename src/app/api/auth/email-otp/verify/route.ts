// src/app/api/auth/email-otp/verify/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
import { verifyHash } from "@/lib/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Option B: verify OTP *only* against pending_signups.
 * body: { email: string, code: string }
 * On success: mark emailVerifiedAt, clear OTP fields. No promotion here.
 */
export async function POST(req: Request) {
  try {
    const { email: rawEmail, code: rawCode } = await req.json().catch(() => ({}));
    const email = String(rawEmail || "").trim().toLowerCase();
    const code = String(rawCode || "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const pending = db.collection("pending_signups");

    // read only what we need
    const p = await pending.findOne(
      { emailLower: email },
      { projection: { emailOtpHash: 1, emailOtpExp: 1, otpTries: 1 } }
    );

    if (!p) {
      // not in pending → generic error (don’t leak)
      return NextResponse.json({ ok: false, error: "expired_or_missing" }, { status: 400 });
    }

    // anti-bruteforce (5 attempts)
    const tries = Number(p.otpTries ?? 0);
    if (tries >= 5) {
      return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
    }

    // must have non-expired code
    const exp = p.emailOtpExp ? new Date(p.emailOtpExp as any) : null;
    if (!p.emailOtpHash || !exp || Date.now() > exp.getTime()) {
      return NextResponse.json({ ok: false, error: "expired_or_missing" }, { status: 400 });
    }

    const ok = verifyHash(code, String(p.emailOtpHash));
    if (!ok) {
      await pending.updateOne(
        { emailLower: email },
        { $inc: { otpTries: 1 }, $set: { updatedAt: new Date() } }
      );
      return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
    }

    // success → clear OTP fields, mark emailVerifiedAt
    await pending.updateOne(
      { emailLower: email },
      {
        $unset: { emailOtpHash: "", emailOtpExp: "", otpTries: "" },
        $set: { emailVerifiedAt: new Date(), updatedAt: new Date() },
      }
    );

    return NextResponse.json({ ok: true, emailVerified: true });
  } catch (e: any) {
    console.error("[email-otp/verify] error:", e?.message || e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
