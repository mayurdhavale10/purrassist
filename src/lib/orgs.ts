// src/lib/orgs.ts
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/clientPromise";

/** Org types we support */
export type OrgType = "college" | "school" | "professional";

/** Organization collection document */
export interface OrganizationDoc {
  _id: ObjectId;
  name: string;                  // canonical display name (e.g., "VIT Bhopal")
  slug: string;                  // unique slug (e.g., "vit-bhopal")
  type: OrgType;
  primaryDomain?: string | null; // main domain like "vitbhopal.ac.in"
  domains?: string[];            // additional domains that map to this org
  createdAt?: Date;
  updatedAt?: Date;
}

/** Mongo accessor */
export async function getOrganizationsCollection() {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<OrganizationDoc>("organizations");
}

/** --------- Small utilities ---------- */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeDomain(d?: string | null): string | null {
  if (!d) return null;
  const dom = d.trim().toLowerCase();
  return dom || null;
}

export function domainFromEmail(email?: string | null): string | null {
  if (!email) return null;
  const parts = String(email).trim().toLowerCase().split("@");
  if (parts.length !== 2) return null;
  return normalizeDomain(parts[1]);
}

const ACADEMIC_TLDS = [".edu", ".ac.in", ".edu.in"]; // extend as you like
export function looksAcademicDomain(domain: string): boolean {
  return ACADEMIC_TLDS.some((tld) => domain.endsWith(tld));
}

/**
 * Create a reasonable org display name from a domain like "vitbhopal.ac.in" → "Vitbhopal".
 * You can evolve this later (lookup tables, better heuristics).
 */
export function nameFromDomain(domain: string): string {
  const core = domain
    .replace(/^www\./, "")
    .replace(/\.(edu|edu\.[a-z]{2,}|ac\.[a-z]{2,}|com|org|net)$/i, "");
  const label = core.split(".")[0] || core;
  const cleaned = label.replace(/([a-z])(\d)/gi, "$1 $2");
  return titleCase(cleaned);
}

function titleCase(s: string): string {
  return s
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Very simple fuzzy score: token overlap + prefix/substring preference */
function fuzzyNameScore(input: string, candidate: string): number {
  const a = input.toLowerCase().split(/\s+/).filter(Boolean);
  const b = candidate.toLowerCase().split(/\s+/).filter(Boolean);
  if (!a.length || !b.length) return 0;

  let hits = 0;
  for (const tok of a) {
    if (b.includes(tok)) hits += 2;
    else if (candidate.toLowerCase().includes(tok)) hits += 1;
    else if (b.some((w) => w.startsWith(tok))) hits += 1;
  }
  return Math.min(1, hits / (a.length * 2));
}

/** --------- Find / Upsert helpers ---------- */

/** Find org by domain (primaryDomain or domains array) */
export async function findOrgByDomain(domainRaw: string) {
  const domain = normalizeDomain(domainRaw);
  if (!domain) return null;

  const orgs = await getOrganizationsCollection();
  return orgs.findOne({
    $or: [{ primaryDomain: domain }, { domains: domain }],
  });
}

/**
 * Upsert organization by name + type (optional domain binding).
 * Uses updateOne(upsert) + findOne to avoid TS issues with findOneAndUpdate types.
 */
export async function upsertOrganization(params: {
  name: string;
  type: OrgType;
  primaryDomain?: string | null;
  extraDomains?: string[];
}) {
  const orgs = await getOrganizationsCollection();
  const slug = slugify(params.name);
  const now = new Date();

  const update: Partial<OrganizationDoc> = {
    name: params.name,
    type: params.type,
    updatedAt: now,
  };

  const primaryDomain = normalizeDomain(params.primaryDomain ?? null);
  if (primaryDomain) update.primaryDomain = primaryDomain;

  const extras =
    (params.extraDomains ?? [])
      .map(normalizeDomain)
      .filter(Boolean) as string[];

  if (extras.length) update.domains = extras;

  await orgs.updateOne(
    { slug },
    {
      $setOnInsert: { _id: new ObjectId(), slug, createdAt: now },
      $set: update,
    },
    { upsert: true }
  );

  const doc = await orgs.findOne({ slug });
  // In practice this will exist right after upsert; add fallback to satisfy TS.
  return (doc ?? {
    _id: new ObjectId(),
    name: params.name,
    slug,
    type: params.type,
    primaryDomain: primaryDomain ?? null,
    domains: extras.length ? extras : undefined,
    createdAt: now,
    updatedAt: now,
  }) as OrganizationDoc;
}

/**
 * Resolve org from email domain. If academic-like domain and not found,
 * auto-create a basic org with a name derived from the domain.
 */
export async function resolveOrgFromEmail(email: string): Promise<{
  org: OrganizationDoc | null;
  inferredFrom: "domain" | "none";
}> {
  const domain = domainFromEmail(email);
  if (!domain) return { org: null, inferredFrom: "none" };

  const existing = await findOrgByDomain(domain);
  if (existing) return { org: existing, inferredFrom: "domain" };

  if (looksAcademicDomain(domain)) {
    const name = nameFromDomain(domain);
    const created = await upsertOrganization({
      name,
      type: "college",
      primaryDomain: domain,
    });
    return { org: created, inferredFrom: "domain" };
  }

  return { org: null, inferredFrom: "none" };
}

/**
 * Resolve org by fuzzy name (user-entered), optionally constrained by type.
 * If nothing close is found, create a new one.
 */
export async function resolveOrgByNameFuzzy(params: {
  name: string;
  type: OrgType;
}): Promise<{ org: OrganizationDoc; created: boolean; score: number }> {
  const name = params.name.trim();
  const type = params.type;

  const orgs = await getOrganizationsCollection();

  // Pull a small candidate set of similar slugs/names
  const slug = slugify(name);
  const candidates = await orgs
    .find(
      {
        type,
        $or: [
          { slug: { $regex: slug.split("-").slice(0, 2).join("-"), $options: "i" } },
          { name: { $regex: name.split(/\s+/)[0], $options: "i" } },
        ],
      },
      { projection: { name: 1, slug: 1, type: 1, primaryDomain: 1, domains: 1 } }
    )
    .limit(25)
    .toArray();

  // Score and pick best
  let best: OrganizationDoc | null = null;
  let bestScore = 0;
  for (const c of candidates) {
    const score = fuzzyNameScore(name, c.name);
    if (score > bestScore) {
      best = c as OrganizationDoc;
      bestScore = score;
    }
  }

  if (best && bestScore >= 0.6) {
    return { org: best, created: false, score: bestScore };
  }

  // Otherwise create a new org
  const created = await upsertOrganization({ name: titleCase(name), type });
  return { org: created, created: true, score: 1 };
}

/**
 * High-level resolver used in your promotion route.
 * Prefers email domain; falls back to user-entered orgName + orgType.
 */
export async function resolvePrimaryOrg(options: {
  email?: string | null;
  orgName?: string | null;
  orgType?: OrgType | null;
}): Promise<{
  org: OrganizationDoc | null;
  source: "domain" | "name" | "none";
  score?: number;
}> {
  // 1) Try domain from email (best signal)
  if (options.email) {
    const byDom = await resolveOrgFromEmail(options.email);
    if (byDom.org) return { org: byDom.org, source: "domain" };
  }

  // 2) Try fuzzy by name
  if (options.orgName && options.orgType) {
    const byName = await resolveOrgByNameFuzzy({
      name: options.orgName,
      type: options.orgType,
    });
    return { org: byName.org, source: "name", score: byName.score };
  }

  // 3) No org
  return { org: null, source: "none" };
}
