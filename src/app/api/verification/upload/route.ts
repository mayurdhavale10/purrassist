// src/app/api/verification/upload/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";        // or "@/auth" if you moved it under src/
import { getUsersCollection } from "@/models/user.model";

export const runtime = "nodejs";        // ensure Node runtime
export const dynamic = "force-dynamic"; // no caching

export async function POST(req: Request) {
  // 1) Require an authenticated session
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  try {
    // 2) Expect multipart/form-data
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ ok: false, reason: "expected_form_data" }, { status: 400 });
    }

    // 3) Parse form data
    const form = await req.formData();
    const file = form.get("file") as File | null;

    // Be flexible: support either "role" (your UI) or legacy orgType/orgName
    const role = (form.get("role") as string | null)?.trim() || null;
    const orgType = (form.get("orgType") as string | null)?.trim() || (role ? role.toLowerCase() : null);
    const orgName = (form.get("orgName") as string | null)?.trim() || null;

    if (!file || !file.size) {
      return NextResponse.json({ ok: false, reason: "missing_file" }, { status: 400 });
    }
    if (!orgType) {
      return NextResponse.json({ ok: false, reason: "missing_org_type" }, { status: 400 });
    }

    // 4) TODO: actually upload to S3/Cloudinary. For now, store metadata + placeholder URL.
    // const arrayBuf = await file.arrayBuffer();
    // const buffer = Buffer.from(arrayBuf);
    // const uploadedUrl = await uploadToCloud(buffer, file.type, file.name);
    const uploadedUrl = null as string | null; // replace when you wire cloud upload

    const fileMeta = {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      url: uploadedUrl,
    };

    // 5) Update the user by emailLower; set verification to "pending"
    const users = await getUsersCollection();
    await users.updateOne(
      { emailLower: email.toLowerCase() },
      {
        $set: {
          role: role ?? undefined,                  // "College" | "School" | "Professional"
          verificationStatus: "pending",
          verificationOrgType: orgType,            // keep both for admin UI
          ...(orgName ? { verificationOrgName: orgName } : {}),
          verificationFile: fileMeta,              // store metadata
          idUploadUrl: uploadedUrl ?? null,        // flat field too if your UI reads it
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date(), email }, // in case doc missing (usually not)
      },
      { upsert: false }
    );

    return NextResponse.json({ ok: true, status: "pending", url: uploadedUrl });
  } catch (err: any) {
    console.error("[verification/upload] error:", err);
    return NextResponse.json({ ok: false, reason: err?.message || "server_error" }, { status: 500 });
  }
}
