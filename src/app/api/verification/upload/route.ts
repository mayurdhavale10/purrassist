// src/app/api/verification/upload/route.ts
import { NextResponse } from "next/server";
import { ObjectId, Collection } from "mongodb";
import clientPromise from "@/lib/clientPromise";
import { getUsersCollection, withDerivedUserFields } from "@/models/user.model";
import {
  resolveOrgFromEmail,
  resolveOrgByNameFuzzy,
  type OrgType,
} from "@/lib/orgs";
import { ocrImageToText, nameLooksPresent } from "@/lib/ocr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Local org shape for this route (keeps TS happy regardless of helper internals) */
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

function normalizeOrgDomains(
  org: OrganizationDoc | null | undefined
): Record<string, boolean> {
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

/**
 * Option B promotion with OCR name-check:
 * multipart/form-data:
 *  - file      : File (required)
 *  - email     : string (required; pending email)
 *  - role      : "College" | "School" | "Professional" (optional)
 *  - orgType   : "college" | "school" | "professional" (optional; defaults "college")
 *  - orgName   : string (optional)
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

    // Block if already a real user
    const inUsers = await users.findOne(
      { $or: [{ emailLower: emailRaw }, { email: emailRaw }] },
      { projection: { _id: 1 } }
    );
    if (inUsers) {
      return NextResponse.json({ ok: false, error: "email_exists" }, { status: 409 });
    }

    // Load pending signup (must have emailVerifiedAt from OTP)
    const p = await pending.findOne(
      { emailLower: emailRaw },
      {
        projection: {
          _id: 1,
          email: 1,
          emailLower: 1,
          displayName: 1,
          name: 1,
          handle: 1,
          handleLower: 1,
          passwordHash: 1,
          lane: 1,
          emailVerifiedAt: 1,
          orgName: 1,
          orgType: 1,
          role: 1,
        },
      }
    );
    if (!p) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    if (!p.emailVerifiedAt) {
      return NextResponse.json({ ok: false, error: "email_not_verified" }, { status: 400 });
    }

    // OCR the upload (cheap preprocessing handled in lib/ocr.ts)
    const buf = Buffer.from(await file.arrayBuffer());
    let ocrText = "";
    try {
      ocrText = await ocrImageToText(buf);
    } catch {
      ocrText = "";
    }

    const displayName = (p.displayName || p.name || "").toString();
    const match = nameLooksPresent(displayName, ocrText); // { ok:boolean, tokens:string[] }
    const willVerifyNow = !!match.ok;

    // Resolve organization
    let chosenOrg: OrganizationDoc | null = null;

    // 1) try inferring from email domain
    const domainGuess = await resolveOrgFromEmail(p.email || emailRaw);
    if (domainGuess?.org) {
      const org = domainGuess.org as OrganizationDoc;
      chosenOrg = await ensureOrganization(orgs, {
        slug: org.slug,
        displayName: normalizeOrgName(org),
        type: (org.type as OrgType) ?? orgType,
        domains: normalizeOrgDomains(org),
      });
    }

    // 2) if user provided org name (or had one saved), fuzzy match or create
    const providedOrgName = orgName || p.orgName || "";
    if (!chosenOrg && providedOrgName) {
      const fuzzy = await resolveOrgByNameFuzzy({ name: providedOrgName, type: orgType });
      if (fuzzy && fuzzy.org) {
        const org = fuzzy.org as OrganizationDoc;
        chosenOrg = await ensureOrganization(orgs, {
          slug: org.slug,
          displayName: normalizeOrgName(org),
          type: (org.type as OrgType) ?? orgType,
          domains: normalizeOrgDomains(org),
        });
      } else {
        const slug = providedOrgName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        chosenOrg = await ensureOrganization(orgs, {
          slug,
          displayName: providedOrgName,
          type: orgType,
        });
      }
    }

    // Store basic file metadata (+ OCR audit info)
    const fileMeta = {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      url: null as string | null, // TODO: upload to S3/Cloudinary and set URL
      ocrNameMatch: match.ok,
      ocrTokens: match.tokens,
      ocrSnippet: ocrText.slice(0, 400),
    };

    const now = new Date();

    if (!willVerifyNow) {
      // ❌ No name match → keep in pending; DO NOT promote
      await pending.updateOne(
        { _id: p._id },
        {
          $set: {
            verificationStatus: "pending",
            verificationFile: fileMeta,
            role: role ?? p.role ?? null,
            orgName: providedOrgName || null,
            orgType: orgType ?? p.orgType ?? null,
            updatedAt: now,
          },
        }
      );
      return NextResponse.json({
        ok: true,
        promoted: false,
        verified: false,
        reason: "name_not_found_in_ocr",
      });
    }

    // ✅ Name matched → promote to real user with verificationStatus: "verified"
    const finalEmail = p.email || emailRaw;
    const finalEmailLower = finalEmail.toLowerCase(); // <-- compute explicitly (TS-safe)

    const userDoc = withDerivedUserFields({
      _id: new ObjectId(),
      email: finalEmail,
      name: p.displayName || p.name || null,
      displayName: p.displayName || p.name || null,
      handle: p.handle || null,
      passwordHash: p.passwordHash || null,

      lane: "B",
      verificationStatus: "verified",
      role,
      idUploadUrl: fileMeta.url,
      verificationOrgType: orgType,
      verificationOrgName: providedOrgName || null,
      verificationFile: fileMeta,

      primaryOrgId: chosenOrg?._id || null,
      primaryOrgSlug: chosenOrg?.slug || null,
      primaryOrgName: normalizeOrgName(chosenOrg) || null,

      planTier: "FREE",
      createdAt: now,
      updatedAt: now,
    });

    // Double-check race using the explicit local emailLower
    const existing = await users.findOne(
      { emailLower: finalEmailLower },
      { projection: { _id: 1 } }
    );
    if (existing) {
      await pending.deleteOne({ _id: p._id }); // cleanup
      return NextResponse.json({
        ok: true,
        promoted: false,
        verified: false,
        reason: "already_exists",
      });
    }

    await users.insertOne(userDoc as any);
    await pending.deleteOne({ _id: p._id });

    return NextResponse.json({
      ok: true,
      promoted: true,
      verified: true, // client should only sign in when this is true
    });
  } catch (e: any) {
    console.error("[verification/upload] error:", e?.message || e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
