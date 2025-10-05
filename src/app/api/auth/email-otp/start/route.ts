// src/app/api/auth/email-otp/start/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth"; // or "@/auth" if in src/
import { getUsersCollection } from "@/models/user.model";
import { generateCode, hashCode, addMinutes, canSendAgain } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const users = await getUsersCollection();
    const emailLower = email.toLowerCase();

    const u = await users.findOne({ emailLower }, { projection: { otpLastSentAt: 1 } });
    if (!canSendAgain(u?.otpLastSentAt, 60)) {
      return NextResponse.json({ ok: false, error: "cooldown" }, { status: 429 });
    }

    const code = generateCode(6);
    const hash = hashCode(code);
    const exp = addMinutes(new Date(), 10);

    await users.updateOne(
      { emailLower },
      {
        $set: {
          emailOtpHash: hash,
          emailOtpExp: exp,
          otpLastSentAt: new Date(),
          otpTries: 0,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date(), email },
      },
      { upsert: false }
    );

    await sendOtpEmail(email, code);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[email-otp/start] error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
