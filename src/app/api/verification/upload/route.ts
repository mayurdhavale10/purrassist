// src/app/api/verification/upload/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
import { auth } from "../../../../../auth";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1) Must be logged in
    const session = await auth();
    const userId = (session as any)?.user?.id ?? null;
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // 2) Must be multipart/form-data with a file
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ ok: false, error: "expected_form_data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const role = (form.get("role") ?? "") as string; // optional, e.g. "College" | "School" | "Professional"

    if (!file || !file.size) {
      return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
    }

    // Optional: basic validation (accept images/pdf up to ~10MB)
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 400 });
    }
    if (file.type && !allowed.includes(file.type)) {
      return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 400 });
    }

    // TODO: Upload to Cloudinary/S3 here and set real URL.
    // const arrayBuf = await file.arrayBuffer(); // if you need the bytes for upload
    const fileMeta = {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      url: null as string | null, // placeholder; set your cloud URL after real upload
    };

    // 3) Persist pending verification on the user
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          verificationStatus: "pending",
          // keep your previous fields for admin visibility
          role: role || null,
          verificationFile: fileMeta,
          idUploadUrl: fileMeta.url, // convenient flat field
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      }
    );

    // Respond with a shape your client already handles
    return NextResponse.json({ ok: true, status: "pending", url: fileMeta.url ?? null }, { status: 200 });
  } catch (err: any) {
    console.error("verification/upload error", err);
    return NextResponse.json({ ok: false, error: "server_error", message: err?.message }, { status: 500 });
  }
}
