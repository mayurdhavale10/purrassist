// src/app/api/auth/password/forgot/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
import { makeResetToken } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const emailLower = String(email ?? "").trim().toLowerCase();
    if (!emailLower) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne({ email: emailLower });
    // Always respond 200 to avoid user enumeration
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const { token, hash } = makeResetToken();
    const exp = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await users.updateOne(
      { _id: user._id },
      { $set: { resetTokenHash: hash, resetTokenExp: exp, updatedAt: new Date() } }
    );

    const base =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";
    const resetLink = `${base}/reset-password?token=${encodeURIComponent(token)}`;

    // TODO: send an email here. For now, log link so you can click it in dev.
    console.log("[password reset link]", resetLink);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("forgot password error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
