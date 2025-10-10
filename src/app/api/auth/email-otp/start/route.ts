// src/app/api/auth/email-otp/start/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
import { generateCode, hashCode, addMinutes, canSendAgain } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public endpoint (no session). Sends OTP for a *pending_signups* email.
 * body: { email: string }
 */
export async function POST(req: Request) {
  try {
    const { email: raw } = await req.json().catch(() => ({}));
    const email = String(raw || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const pending = db.collection("pending_signups");

    // must already exist in pending_signups (created by /auth/email/register with lane "B")
    const doc = await pending.findOne(
      { emailLower: email },
      { projection: { otpLastSentAt: 1 } }
    );
    if (!doc) {
      // do not leak existence; generic reply
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    // rate limit (60s)
    if (!canSendAgain(doc.otpLastSentAt as Date | undefined, 60)) {
      return NextResponse.json({ ok: false, error: "cooldown" }, { status: 429 });
    }

    const code = generateCode(6);
    const hash = hashCode(code);
    const exp = addMinutes(new Date(), 10);

    await pending.updateOne(
      { emailLower: email },
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

    await sendOtpEmail(email, code);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[email-otp/start] error:", e?.message || e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
