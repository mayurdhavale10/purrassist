// src/app/api/verification/upload/route.ts
import { NextResponse } from "next/server";
import { ObjectId, Collection } from "mongodb";
import clientPromise from "@/lib/clientPromise";
import { getUsersCollection, withDerivedUserFields } from "@/models/user.model";
import { resolveOrgFromEmail, resolveOrgByNameFuzzy, OrgType } from "@/lib/orgs";
import { ocrImageToText, nameMatchScore } from "@/lib/ocr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Give OCR enough time
export const maxDuration = 60;

/** Minimal org shape for this route */
type OrganizationDoc = {
  _id: ObjectId;
  slug: string;
  displayName?: string;
  name?: string;
  type?: OrgType | string | null;
  org_domains?: Record<string, boolean>;
  domains?: Record<string, boolean>;
  createdAt?: Date;
  updatedAt?: Date;
};

type OrgSeed = {
  slug: string;
  displayName: string;
  type: OrgType | null;
  domains?: Record<string, boolean>;
};

function normalizeOrgName(org: OrganizationDoc | null | undefined): string {
  if (!org) return "";
  return (org.displayName ?? org.name ?? "").toString();
}
function normalizeOrgDomains(org: OrganizationDoc | null | undefined): Record<string, boolean> {
  if (!org) return {};
  return org.org_domains ?? org.domains ?? {};
}

/** Upsert org by slug and return the full doc */
async function ensureOrganization(
  orgs: Collection<OrganizationDoc>,
  seed: OrgSeed
): Promise<OrganizationDoc> {
  const now = new Date();
  await orgs.updateOne(
    { slug: seed.slug },
    {
      $setOnInsert: {
        slug: seed.slug,
        displayName: seed.displayName,
        type: seed.type,
        org_domains: seed.domains ?? {},
        createdAt: now,
      },
      $set: {
        updatedAt: now,
        displayName: seed.displayName,
        type: seed.type,
        ...(seed.domains ? { org_domains: seed.domains } : {}),
      },
    },
    { upsert: true }
  );
  const doc = await orgs.findOne({ slug: seed.slug });
  if (!doc) throw new Error("Failed to upsert organization");
  return doc;
}

/** Small helper to keep OCR from hanging forever */
async function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("ocr_timeout")), ms)),
  ]);
}

/**
 * multipart/form-data:
 *  - file    : File (required)
 *  - email   : string (required; pending email)
 *  - role    : "College" | "School" | "Professional" (optional)
 *  - orgType : "college" | "school" | "professional" (optional; defaults "college")
 *  - orgName : string (optional)
 */
export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ ok: false, error: "expected_form_data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const emailRaw = String(form.get("email") ?? "").trim().toLowerCase();
    const role = (String(form.get("role") ?? "").trim() || null) as
      | "College"
      | "School"
      | "Professional"
      | null;

    // default org type so it's never undefined
    const orgTypeInput = (String(form.get("orgType") ?? "").trim().toLowerCase() || "college") as
      | "college"
      | "school"
      | "professional";
    const orgType: OrgType = orgTypeInput;
    const orgName = (String(form.get("orgName") ?? "").trim() || null) as string | null;

    if (!emailRaw || !emailRaw.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    if (!file || !file.size) {
      return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = await getUsersCollection();
    const pending = db.collection("pending_signups");
    const orgs = db.collection<OrganizationDoc>("organizations");

    // Already promoted?
    const inUsers = await users.findOne(
      { $or: [{ emailLower: emailRaw }, { email: emailRaw }] },
      { projection: { _id: 1 } }
    );
    if (inUsers) {
      return NextResponse.json({ ok: false, error: "email_exists" }, { status: 409 });
    }

    // Must exist in pending + have verified email
    const p = await pending.findOne(
      { emailLower: emailRaw },
      {
        projection: {
          _id: 1,
          email: 1,
          emailLower: 1,
          displayName: 1,
          displayNameLower: 1,
          handle: 1,
          handleLower: 1,
          passwordHash: 1,
          lane: 1,
          emailVerifiedAt: 1,
        },
      }
    );
    if (!p) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    if (!p.emailVerifiedAt) {
      return NextResponse.json({ ok: false, error: "email_not_verified" }, { status: 400 });
    }

    // ---------- OCR (safe + bounded) ----------
    let isVerified = false;
    let matchDebug: { tokens: string[]; matched: number; total: number; ratio: number } | null = null;

    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const text = await withTimeout(ocrImageToText(buf), 8000);
      const match = nameMatchScore(p.displayName || "", text);
      isVerified = !!match.ok;
      matchDebug = { tokens: match.tokens, matched: match.matched, total: match.total, ratio: match.ratio };
    } catch (e) {
      // OCR failed or timed out -> keep isVerified = false (manual review)
      matchDebug = { tokens: [], matched: 0, total: 0, ratio: 0 };
    }

    // ---------- Organization ----------
    let chosenOrg: OrganizationDoc | null = null;

    // try email domain first
    const domainGuess = await resolveOrgFromEmail(emailRaw);
    if (domainGuess?.org) {
      const org = domainGuess.org as OrganizationDoc;
      chosenOrg = await ensureOrganization(orgs, {
        slug: org.slug,
        displayName: normalizeOrgName(org),
        type: (org.type as OrgType) ?? orgType,
        domains: normalizeOrgDomains(org),
      });
    }

    // fallback to fuzzy name if provided
    if (!chosenOrg && orgName) {
      const fuzzy = await resolveOrgByNameFuzzy({ name: orgName, type: orgType });
      const org = fuzzy.org as OrganizationDoc;
      chosenOrg = await ensureOrganization(orgs, {
        slug: org.slug,
        displayName: normalizeOrgName(org),
        type: (org.type as OrgType) ?? orgType,
        domains: normalizeOrgDomains(org),
      });
    }

    // ---------- File metadata (stub, replace with S3/Cloudinary later) ----------
    const fileMeta = {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      url: null as string | null,
    };

    // ---------- Create real user + remove pending ----------
    const now = new Date();
    const userDoc = withDerivedUserFields({
      _id: new ObjectId(),
      email: p.email || emailRaw,
      displayName: p.displayName || null,
      handle: p.handle || null,
      passwordHash: p.passwordHash || null,

      lane: "B",
      verificationStatus: isVerified ? "verified" : "pending",
      role,
      idUploadUrl: fileMeta.url,
      verificationOrgType: orgType,
      verificationOrgName: orgName,
      verificationFile: fileMeta,

      primaryOrgId: chosenOrg?._id || null,
      primaryOrgSlug: chosenOrg?.slug || null,
      primaryOrgName: normalizeOrgName(chosenOrg) || null,

      planTier: "FREE",
      createdAt: now,
      updatedAt: now,
      verificationNotes: {
        method: "ocr_name_check",
        match: matchDebug,
      },
    });

    await users.insertOne(userDoc as any);
    await pending.deleteOne({ _id: p._id });

    return NextResponse.json({
      ok: true,
      promoted: true,
      verified: isVerified,
      match: matchDebug,
    });
  } catch (e: any) {
    console.error("[verification/upload] error:", e?.message || e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
