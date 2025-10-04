// src/app/api/auth/email/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/clientPromise";
import jwt from "jsonwebtoken";

const SESSION_COOKIE = "pa_token";
const SESSION_TTL_SECS = 60 * 60 * 24 * 7; // 7 days
const JWT_SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const e = String(email ?? "").trim().toLowerCase();
    const p = String(password ?? "");

    if (!e || !p) {
      return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne(
      { $or: [{ email: e }, { emailLower: e }] },
      { projection: { _id: 1, email: 1, emailLower: 1, passwordHash: 1, handle: 1, name: 1, image: 1 } }
    );

    if (!user || !user.passwordHash) {
      return NextResponse.json({ ok: false, reason: "invalid_login" }, { status: 401 });
    }

    const ok = await bcrypt.compare(p, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ ok: false, reason: "invalid_login" }, { status: 401 });
    }

    // Create a lightweight JWT
    const token = jwt.sign(
      {
        sub: String(user._id),
        email: user.email ?? e,
        handle: user.handle ?? null,
      },
      JWT_SECRET,
      { expiresIn: SESSION_TTL_SECS }
    );

    const res = NextResponse.json({
      ok: true,
      user: {
        id: String(user._id),
        email: user.email ?? e,
        handle: user.handle ?? null,
        name: user.name ?? null,
        image: user.image ?? null,
      },
    });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: SESSION_TTL_SECS,
    });

    return res;
  } catch (err) {
    console.error("email/login error", err);
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500 });
  }
}
