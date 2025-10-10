// src/app/api/verification/upload/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normEmail(e: string) {
  return e.trim().toLowerCase();
}
function suggestHandle(base: string) {
  const b = (base || "user").replace(/[^a-z0-9._-]/gi, "").slice(0, 28);
  const suffix = Math.floor(1000 + Math.random() * 9000); // 4 digits
  return `${b}${suffix}`;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ ok: false, error: "expected_form_data" }, { status: 400 });
    }

    const form = await req.formData();

    const emailRaw = String(form.get("email") ?? "");
    const role = String(form.get("role") ?? "").trim() || null;       // optional
    const orgType = String(form.get("orgType") ?? "").trim() || null; // optional: "college"|"school"|"professional"
    const orgName = String(form.get("orgName") ?? "").trim() || null; // optional

    const file = form.get("file") as File | null;

    const email = normEmail(emailRaw);
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    if (!file || !file.size) {
      return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
    }

    // Placeholder file upload step.
    // TODO: Upload `file` to S3/Cloudinary and capture the public URL.
    const fileMeta = {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      url: null as string | null,
    };

    const client = await clientPromise;
    const db = client.db();

    const pending = db.collection("pending_signups");
    const users = db.collection("users");

    // 1) Find pending signup; must be email-verified to proceed
    const p = await pending.findOne(
      { emailLower: email },
      {
        projection: {
          email: 1,
          emailLower: 1,
          displayName: 1,
          displayNameLower: 1,
          desiredHandle: 1,
          desiredHandleLower: 1,
          passwordHash: 1,
          lane: 1,
          emailVerifiedAt: 1,
          createdAt: 1,
        },
      }
    );

    if (!p) {
      // Don't leak existence—generic error is okay here
      return NextResponse.json({ ok: false, error: "not_found_or_expired" }, { status: 404 });
    }

    if (!p.emailVerifiedAt) {
      return NextResponse.json({ ok: false, error: "email_not_verified" }, { status: 400 });
    }

    // 2) Block if user already exists (rare race)
    const existingUser = await users.findOne(
      { $or: [{ emailLower: email }, { email }] },
      { projection: { _id: 1 } }
    );
    if (existingUser) {
      // Already promoted or registered via another flow
      // Safe to delete pending to avoid confusion
      await pending.deleteOne({ _id: p._id });
      return NextResponse.json({ ok: false, error: "email_exists" }, { status: 409 });
    }

    // 3) Enforce handle uniqueness *now* (only at promotion time)
    let handle = (p.desiredHandle as string) || "";
    let handleLower = (p.desiredHandleLower as string) || "";
    if (!handle || !/^[a-zA-Z0-9._-]{3,30}$/.test(handle)) {
      handle = "user";
      handleLower = "user";
    }

    const handleTaken = await users.findOne(
      { handleLower },
      { projection: { _id: 1 } }
    );
    if (handleTaken) {
      // Suggest a new handle and ask client to bounce user to username step again.
      const suggested = suggestHandle(handleLower);
      return NextResponse.json(
        { ok: false, error: "username_taken", suggestedHandle: suggested },
        { status: 409 }
      );
    }

    // 4) Build the real user document (verificationStatus stays "pending")
    const now = new Date();
    const userDoc = {
      email: p.email || email,
      emailLower: email,

      // names
      name: p.displayName ?? null,
      displayName: p.displayName ?? null,
      displayNameLower: (p.displayNameLower as string) ?? (p.displayName || "").toLowerCase(),

      // public handle
      handle,
      handleLower,

      // local auth
      passwordHash: p.passwordHash ?? null,

      // signup / verification
      lane: (p.lane as "A" | "B") ?? "B",
      verificationStatus: "pending" as const,
      role,

      // org + file metadata
      verificationOrgType: orgType,
      verificationOrgName: orgName,
      verificationFile: fileMeta,
      idUploadUrl: fileMeta.url,

      // product defaults
      planTier: "FREE" as const,
      planExpiry: null as Date | null,

      // timestamps
      createdAt: now,
      updatedAt: now,
    };

    // 5) Insert into users
    const insertRes = await users.insertOne(userDoc as any);

    // 6) Cleanup pending
    await pending.deleteOne({ _id: p._id });

    // 7) Respond; client should now call signIn("credentials")
    return NextResponse.json(
      { ok: true, userId: insertRes.insertedId.toString(), url: fileMeta.url },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[verification/upload] error", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
