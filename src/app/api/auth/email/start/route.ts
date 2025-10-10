// src/app/api/auth/email/start/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lane rules:
 * - A (auto): academic domains (.edu, .edu.xx, .ac.xx, .edu.in, .ac.in) OR in EXTRA_TRUSTED_DOMAINS
 * - B (verify): everything else (including gmail/outlook/live/etc.)
 *
 * This only *classifies*; it does NOT create any DB docs.
 */

const PUBLIC_DOMAINS = new Set<string>([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "icloud.com",
  "mail.com",
  "yandex.com",
  "rediffmail.com",
  "outlook.com", // public mailbox → stays Lane B here
  "live.com",    // public mailbox → stays Lane B here
]);

// Extra domains you trust like work/company domains (comma-separated)
const EXTRA_TRUSTED_DOMAINS: string[] = (process.env.EXTRA_TRUSTED_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

// Broad academic patterns: .edu, .edu.xx, .ac.xx, .edu.in, .ac.in…
const ACADEMIC_REGEXES = [/\.edu$/i, /\.edu\.[a-z]{2,}$/i, /\.ac\.[a-z]{2,}$/i];

function extractDomain(email: string): string {
  const idx = email.indexOf("@");
  return idx === -1 ? "" : email.slice(idx + 1).toLowerCase();
}

function isAcademicDomain(domain: string): boolean {
  if (!domain) return false;
  // Block obvious public mail providers from being treated as academic
  if (PUBLIC_DOMAINS.has(domain)) return false;
  // Allow configured trusted domains (company/college extras)
  if (EXTRA_TRUSTED_DOMAINS.includes(domain)) return true;
  // Regex match for academic
  return ACADEMIC_REGEXES.some((re) => re.test(domain));
}

export async function POST(req: Request) {
  try {
    const { email: rawEmail } = await req.json().catch(() => ({}));
    const email = String(rawEmail || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const domain = extractDomain(email);
    const lane: "A" | "B" = isAcademicDomain(domain) ? "A" : "B";

    // Return minimal hints (no DB writes here)
    return NextResponse.json({
      ok: true,
      lane,
      domain,
    });
  } catch (err: any) {
    console.error("[email/start] error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
