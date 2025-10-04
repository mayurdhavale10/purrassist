// auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import clientPromise from "@/lib/clientPromise";
import { compare } from "bcrypt";

/** Resolve Google env keys (supports your AUTH_* names, with GOOGLE_* fallback) */
const GOOGLE_ID = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_SECRET =
  process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET!;

/** public/webmail domains to block (Outlook/Live are *not* blocked anymore) */
const PUBLIC_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  // "outlook.com", // unblocked
  // "live.com",    // unblocked
  "aol.com",
  "proton.me",
  "protonmail.com",
  "icloud.com",
  "mail.com",
  "yandex.com",
  "rediffmail.com",
]);

/** explicitly allowed *public* domains (no extra verification) */
const ALLOWED_PUBLIC_DOMAINS = new Set<string>(["outlook.com", "live.com"]);

/** extra allowed college domains via env (comma separated) */
const EXTRA_COLLEGE_DOMAINS: string[] = (process.env.EXTRA_COLLEGE_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

/** broad academic patterns: .edu, .edu.xx, .ac.xx, .edu.in, .ac.in, etc. */
const ACADEMIC_REGEXES = [/\.edu$/i, /\.edu\.[a-z]{2,}$/i, /\.ac\.[a-z]{2,}$/i];

function isCollegeDomain(domain: string): boolean {
  const d = (domain || "").toLowerCase();
  if (!d) return false;
  if (PUBLIC_DOMAINS.has(d)) return false;
  if (EXTRA_COLLEGE_DOMAINS.includes(d)) return true;
  return ACADEMIC_REGEXES.some((re) => re.test(d));
}

/** Final sign-in eligibility for Google only */
function isEligibleSignInDomain(domain: string): boolean {
  const d = (domain || "").toLowerCase();
  if (!d) return false;
  if (ALLOWED_PUBLIC_DOMAINS.has(d)) return true;
  return isCollegeDomain(d);
}

const authConfig: NextAuthConfig = {
  providers: [
    // Google OAuth (kept)
    Google({
      clientId: GOOGLE_ID,
      clientSecret: GOOGLE_SECRET,
      async profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          gender: null,
        };
      },
    }),

    // Credentials (email + password) — NEW
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = (creds?.email || "").toString().trim().toLowerCase();
        const password = (creds?.password || "").toString();
        if (!email || !password) return null;

        const client = await clientPromise;
        const db = client.db();
        const users = db.collection("users");

        // Support both derived and raw email fields
        const user = await users.findOne({
          $or: [{ emailLower: email }, { email }],
        });

        if (!user || !user.passwordHash) return null;

        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.displayName ?? user.name ?? null,
          image: user.image ?? null,
          gender: user.gender ?? null,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * Only apply the domain gate to Google sign-ins.
     * Credentials sign-ins skip this (we already own the email).
     */
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email?.toLowerCase();
        const domain = email?.split("@")[1] ?? "";
        return !!email && isEligibleSignInDomain(domain);
      }
      // credentials or anything else → allowed
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        (token as any).id = (user as any).id;
        (token as any).email = (user as any).email;
        (token as any).gender = (user as any).gender ?? null;
      }

      // refresh gender from DB if missing / on update
      if (trigger === "update" || (token as any).gender == null) {
        try {
          const client = await clientPromise;
          const db = client.db();
          const users = db.collection("users");
          const dbUser = await users.findOne({ email: (token as any).email });
          if (dbUser) (token as any).gender = dbUser.gender ?? null;
        } catch (e) {
          console.error("JWT callback DB error:", e);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id as string;
        (session.user as any).gender = (token as any).gender as
          | "male"
          | "female"
          | "other"
          | null;
      }
      return session;
    },
  },

  // Optional: custom error page for blocked Google domains
  // pages: { error: "/auth/college-only" },
};

export default authConfig;
