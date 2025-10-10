// src/app/api/verification/upload/route.ts
import { NextResponse } from "next/server";
import { ObjectId, Collection } from "mongodb";
import clientPromise from "@/lib/clientPromise";
import { getUsersCollection, withDerivedUserFields } from "@/models/user.model";
import { resolveOrgFromEmail, resolveOrgByNameFuzzy, OrgType } from "@/lib/orgs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Local org shape for this route (keeps TS happy regardless of helper internals) */
type OrganizationDoc = {
  _id: ObjectId;
  slug: string;
  displayName?: string;             // some helpers may use displayName
  name?: string;                    // others may use name — we normalize below
  type?: OrgType | string | null;
  org_domains?: Record<string, boolean>; // some helpers may use org_domains
  domains?: Record<string, boolean>;     // others may use domains — we normalize below
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

/**
 * Option B promotion:
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

    // Default orgType to "college" so it's never undefined (satisfy OrgType)
    const orgTypeInput = (String(form.get("orgType") ?? "").trim().toLowerCase() || "college") as
      | "college"
      | "school"
      | "professional";
    const orgType: OrgType = orgTypeInput; // <- typed
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

    // If already promoted, block
    const inUsers = await users.findOne(
      { $or: [{ emailLower: emailRaw }, { email: emailRaw }] },
      { projection: { _id: 1 } }
    );
    if (inUsers) {
      return NextResponse.json({ ok: false, error: "email_exists" }, { status: 409 });
    }

    // Must have pending + verified email
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
    if (!p) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    if (!p.emailVerifiedAt) {
      return NextResponse.json({ ok: false, error: "email_not_verified" }, { status: 400 });
    }

    // Org via email domain first
    let chosenOrg: OrganizationDoc | null = null;
    const domainGuess = await resolveOrgFromEmail(emailRaw); // { org, inferredFrom }
    if (domainGuess?.org) {
      const org = domainGuess.org as OrganizationDoc;
      chosenOrg = await ensureOrganization(orgs, {
        slug: org.slug,
        displayName: normalizeOrgName(org),
        type: (org.type as OrgType) ?? orgType,
        domains: normalizeOrgDomains(org),
      });
    }

    // If still none and user provided a name → fuzzy by name
    if (!chosenOrg && orgName) {
      // resolveOrgByNameFuzzy requires { name, type: OrgType }
      const fuzzy = await resolveOrgByNameFuzzy({ name: orgName, type: orgType });
      const org = fuzzy.org as OrganizationDoc;
      chosenOrg = await ensureOrganization(orgs, {
        slug: org.slug,
        displayName: normalizeOrgName(org),
        type: (org.type as OrgType) ?? orgType,
        domains: normalizeOrgDomains(org),
      });
    }

    // (Stub) store basic file metadata; plug S3/Cloudinary later
    const fileMeta = {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      url: null as string | null,
    };

    const now = new Date();
    const userDoc = withDerivedUserFields({
      _id: new ObjectId(),
      email: p.email || emailRaw,
      displayName: p.displayName || null,
      handle: p.handle || null,
      passwordHash: p.passwordHash || null,

      lane: "B",
      verificationStatus: "pending",
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
    });

    await users.insertOne(userDoc as any);
    await pending.deleteOne({ _id: p._id });

    return NextResponse.json({ ok: true, promoted: true });
  } catch (e: any) {
    console.error("[verification/upload] error:", e?.message || e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
