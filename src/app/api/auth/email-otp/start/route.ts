import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
import { generateCode, hashCode, addMinutes, canSendAgain } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public endpoint for pending signups (no session yet).
 * body: { email: string }
 */
export async function POST(req: Request) {
  try {
    const { email: emailRaw } = await req.json();
    const email = String(emailRaw || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const pending = db.collection("pending_signups");

    const p = await pending.findOne({ emailLower: email }, { projection: { otpLastSentAt: 1 } });
    if (!p) {
      // do NOT leak whether a user exists; generic error
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    if (!canSendAgain(p?.otpLastSentAt, 60)) {
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
    console.error("[email-otp/start] Option A error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
