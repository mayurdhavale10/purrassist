import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
import { generateCode, hashCode, addMinutes, canSendAgain } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Option B:
 * Public endpoint (no session). Sends OTP for an email that's in pending_signups.
 * Body: { email: string }
 * - Writes OTP fields to pending_signups (NOT users).
 */
export async function POST(req: Request) {
  try {
    const { email: emailRaw } = await req.json().catch(() => ({}));
    const emailLower = String(emailRaw || "").trim().toLowerCase();

    if (!emailLower || !emailLower.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const pending = db.collection("pending_signups");

    const p = await pending.findOne(
      { emailLower },
      { projection: { _id: 1, otpLastSentAt: 1 } }
    );

    if (!p) {
      // Don’t leak existence; use a generic message
      return NextResponse.json({ ok: false, error: "expired_or_missing" }, { status: 400 });
    }

    // e.g. 60s cooldown
    if (!canSendAgain(p.otpLastSentAt, 60)) {
      return NextResponse.json({ ok: false, error: "cooldown" }, { status: 429 });
    }

    const code = generateCode(6);
    const hash = hashCode(code);
    const exp = addMinutes(new Date(), 10);

    await pending.updateOne(
      { _id: p._id },
      {
        $set: {
          emailOtpHash: hash,
          emailOtpExp: exp,
          otpLastSentAt: new Date(),
          otpTries: 0,
          updatedAt: new Date(),
        },
      }
    );

    await sendOtpEmail(emailLower, code);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[email-otp/start] error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
