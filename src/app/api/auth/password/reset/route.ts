// src/app/api/auth/password/reset/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
import { hashPassword } from "@/lib/auth/password";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });
    }
    const pwd = String(newPassword ?? "");
    if (pwd.length < 8) {
      return NextResponse.json({ ok: false, error: "weak_password" }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    const now = new Date();
    const doc = await users.findOne({
      resetTokenHash: tokenHash,
      resetTokenExp: { $gt: now },
    });

    if (!doc) {
      return NextResponse.json({ ok: false, error: "token_expired_or_invalid" }, { status: 400 });
    }

    const passwordHash = await hashPassword(pwd);

    await users.updateOne(
      { _id: doc._id },
      {
        $set: { passwordHash, updatedAt: new Date() },
        $unset: { resetTokenHash: "", resetTokenExp: "" },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("reset password error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
