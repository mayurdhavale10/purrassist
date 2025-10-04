// src/app/api/auth/email/start/route.ts
import { NextResponse } from "next/server";

/** Keep in sync with your auth.config rules (simplified here) */
const PUBLIC_BLOCK = new Set([
  "gmail.com","yahoo.com","aol.com","proton.me","protonmail.com",
  "icloud.com","mail.com","yandex.com","rediffmail.com","hotmail.com"
]);
const PUBLIC_ALLOWED = new Set(["outlook.com","live.com"]);
const EXTRA = (process.env.EXTRA_COLLEGE_DOMAINS ?? "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

const ACADEMIC_PATTERNS = [
  /\.edu$/i, /\.edu\.[a-z]{2,}$/i, /\.ac\.[a-z]{2,}$/i
];

function classifyDomain(email: string) {
  const domain = (email.split("@")[1] ?? "").toLowerCase();
  if (!domain) return { kind: "invalid" as const };

  const isAcademic =
    EXTRA.includes(domain) ||
    ACADEMIC_PATTERNS.some((re) => re.test(domain));
  if (isAcademic) return { kind: "college" as const, domain };

  if (PUBLIC_ALLOWED.has(domain)) return { kind: "work" as const, domain }; // allow Outlook/Live as “work”

  if (PUBLIC_BLOCK.has(domain)) return { kind: "public" as const, domain };

  // Everything else treated as “work/corporate-like”
  return { kind: "work" as const, domain };
}

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const e = String(email ?? "").trim().toLowerCase();
    if (!e || !e.includes("@")) {
      return NextResponse.json({ ok: false, reason: "invalid_email" }, { status: 400 });
    }

    const { kind, domain } = classifyDomain(e) as any;

    // UI lanes:
    // A = Fast path (college domains)
    // B = ID verification required (public/work)
    const lane = kind === "college" ? "A" : "B";

    return NextResponse.json({ ok: true, email: e, domain, kind, lane }, { status: 200 });
  } catch (err) {
    console.error("email/start error", err);
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500 });
  }
}
