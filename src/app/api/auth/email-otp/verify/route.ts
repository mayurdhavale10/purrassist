// src/app/api/auth/email-otp/verify/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { getUsersCollection } from "@/models/user.model";
import { verifyHash } from "@/lib/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ ok: false, error: "missing_code" }, { status: 400 });
    }

    const users = await getUsersCollection();
    const emailLower = email.toLowerCase();

    const user = await users.findOne(
      { emailLower },
      { projection: { emailOtpHash: 1, emailOtpExp: 1, otpTries: 1 } }
    );

    if (!user?.emailOtpHash || !user.emailOtpExp || new Date() > new Date(user.emailOtpExp)) {
      return NextResponse.json({ ok: false, error: "expired_or_missing" }, { status: 400 });
    }

    // anti-bruteforce: 5 attempts
    if ((user.otpTries ?? 0) >= 5) {
      return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
    }

    const ok = verifyHash(String(code), user.emailOtpHash);
    if (!ok) {
      await users.updateOne({ emailLower }, { $inc: { otpTries: 1 } });
      return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
    }

    // success → clear OTP fields; if you want, mark an "emailVerifiedAt"
    await users.updateOne(
      { emailLower },
      {
        $unset: { emailOtpHash: "", emailOtpExp: "", otpTries: "" },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json({ ok: true, emailVerified: true });
  } catch (e: any) {
    console.error("[email-otp/verify] error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
