// src/app/api/auth/email/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/clientPromise";
import { withDerivedUserFields } from "@/models/user.model";

/** very light validation (UI should do stricter checks) */
function isValidEmail(e: string) { return /\S+@\S+\.\S+/.test(e); }
function isValidPassword(p: string) { return typeof p === "string" && p.length >= 8; }
const HANDLE_RE = /^[a-zA-Z][a-zA-Z0-9._]{2,19}$/;

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const profileName = String(body.profileName ?? "").trim();
    const username = String(body.username ?? "").trim(); // desired unique handle

    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, reason: "invalid_email" }, { status: 400 });
    }
    if (!isValidPassword(password)) {
      return NextResponse.json({ ok: false, reason: "weak_password" }, { status: 400 });
    }
    if (!HANDLE_RE.test(username)) {
      return NextResponse.json({ ok: false, reason: "invalid_username" }, { status: 400 });
    }
    if (!profileName) {
      return NextResponse.json({ ok: false, reason: "missing_profile_name" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    // ensure email unique
    const existingByEmail = await users.findOne({ $or: [{ email }, { emailLower: email }] });
    if (existingByEmail) {
      return NextResponse.json({ ok: false, reason: "email_in_use" }, { status: 409 });
    }

    // ensure handle unique
    const usernameLower = username.toLowerCase();
    const existingByHandle = await users.findOne({ handleLower: usernameLower });
    if (existingByHandle) {
      return NextResponse.json({ ok: false, reason: "username_taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // verification lane (reuse logic from /email/start if you want)
    const domain = email.split("@")[1] ?? "";
    const isCollege =
      (process.env.EXTRA_COLLEGE_DOMAINS ?? "").toLowerCase().split(",").map(s => s.trim()).includes(domain) ||
      /\.edu$/i.test(domain) || /\.edu\.[a-z]{2,}$/i.test(domain) || /\.ac\.[a-z]{2,}$/i.test(domain);

    const doc = withDerivedUserFields({
      email,
      name: profileName,
      displayName: profileName,
      handle: username,
      passwordHash,
      planTier: "FREE",
      collegeVerified: isCollege ? true : false,
      createdAt: new Date(),
      updatedAt: new Date(),
      // optional metadata if you want:
      // collegeName: isCollege ? domain : null,
    });

    // write new user
    const res = await users.insertOne(doc as any);
    return NextResponse.json(
      { ok: true, userId: String(res.insertedId), handle: username, collegeVerified: !!isCollege },
      { status: 201 }
    );
  } catch (err: any) {
    // handle duplicate key race (if indexes exist)
    if (err?.code === 11000) {
      if (String(err?.message || "").includes("handleLower")) {
        return NextResponse.json({ ok: false, reason: "username_taken" }, { status: 409 });
      }
      if (String(err?.message || "").includes("emailLower")) {
        return NextResponse.json({ ok: false, reason: "email_in_use" }, { status: 409 });
      }
    }
    console.error("email/register error", err);
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500 });
  }
}
