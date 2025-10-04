// src/app/api/verification/upload/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";
import { auth } from "../../../../../auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Require a signed-in user (either NextAuth session or your pa_token checker, add later)
    const session = await auth();
    const userId = (session as any)?.user?.id ?? null;
    if (!userId) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ ok: false, reason: "expected_form_data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const orgType = String(form.get("orgType") ?? "").trim();  // "college" | "school" | "work"
    const orgName = String(form.get("orgName") ?? "").trim();

    if (!file || !file.size) {
      return NextResponse.json({ ok: false, reason: "missing_file" }, { status: 400 });
    }
    if (!orgType) {
      return NextResponse.json({ ok: false, reason: "missing_org_type" }, { status: 400 });
    }
    if (!orgName) {
      return NextResponse.json({ ok: false, reason: "missing_org_name" }, { status: 400 });
    }

    // TODO: Upload to S3/Cloudinary here.
    // For now, we just persist metadata + a placeholder URL
    const fileMeta = {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      // placeholder link; replace with real cloud URL after upload
      url: null as string | null,
    };

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    await users.updateOne(
      { _id: new (await import("mongodb")).ObjectId(userId) },
      {
        $set: {
          verificationStatus: "pending",
          verificationOrgType: orgType,
          verificationOrgName: orgName,
          verificationFile: fileMeta,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ ok: true, status: "pending" }, { status: 200 });
  } catch (err) {
    console.error("verification/upload error", err);
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500 });
  }
}
