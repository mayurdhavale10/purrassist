// auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import clientPromise from "@/lib/clientPromise";
import { compare } from "bcrypt";

/** Resolve Google env keys (supports AUTH_* or GOOGLE_* names) */
const GOOGLE_ID = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_SECRET =
  process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET!;

/** webmail domains you don't want to allow via Google (credentials is separate) */
const PUBLIC_DOMAINS = new Set([
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
]);

/** explicitly allowed public domains for Google sign-in (if you want) */
const ALLOWED_PUBLIC_DOMAINS = new Set<string>(["outlook.com", "live.com"]);

/** optionally allow extra college domains via env (comma-separated) */
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

/** Google-only eligibility (Credentials is always allowed if password matches) */
function isEligibleSignInDomain(domain: string): boolean {
  const d = (domain || "").toLowerCase();
  if (!d) return false;
  if (ALLOWED_PUBLIC_DOMAINS.has(d)) return true;
  return isCollegeDomain(d);
}

const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: GOOGLE_ID,
      clientSecret: GOOGLE_SECRET,
      async profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          gender: null, // keep as-is; we refresh from DB in callbacks
        };
      },
    }),

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

        // find by derived or raw email
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
    /** Gate Google by domain; credentials bypass the gate */
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email?.toLowerCase();
        const domain = email?.split("@")[1] ?? "";
        return !!email && isEligibleSignInDomain(domain);
      }
      return true; // credentials or other providers
    },

    /** Put DB-backed fields on the token so they flow to the session */
    async jwt({ token, user, trigger }) {
      // carry basics on first sign-in
      if (user) {
        (token as any).id = (user as any).id;
        (token as any).email = (user as any).email;
        (token as any).gender = (user as any).gender ?? null;
      }

      // refresh extra fields from DB when missing or on update
      const needsRefresh =
        trigger === "update" ||
        (token as any).lane === undefined ||
        (token as any).verificationStatus === undefined ||
        (token as any).primaryOrgName === undefined;

      if (needsRefresh) {
        try {
          const client = await clientPromise;
          const db = client.db();
          const users = db.collection("users");

          const emailLower =
            (token as any).email?.toLowerCase?.() ?? (token as any).email ?? "";
          const dbUser = await users.findOne(
            { $or: [{ emailLower }, { email: emailLower }] },
            {
              projection: {
                gender: 1,
                lane: 1,
                verificationStatus: 1,
                primaryOrgId: 1,
                primaryOrgName: 1,
                primaryOrgSlug: 1,
                primaryOrgType: 1,
              },
            }
          );

          if (dbUser) {
            (token as any).gender = dbUser.gender ?? null;
            (token as any).lane = dbUser.lane ?? null;
            (token as any).verificationStatus = dbUser.verificationStatus ?? null;

            (token as any).primaryOrgId = dbUser.primaryOrgId?.toString?.() || null;
            (token as any).primaryOrgName = dbUser.primaryOrgName ?? null;
            (token as any).primaryOrgSlug = dbUser.primaryOrgSlug ?? null;
            (token as any).primaryOrgType = dbUser.primaryOrgType ?? null;
          }
        } catch (e) {
          console.error("JWT callback DB error:", e);
        }
      }

      return token;
    },

    /** Expose the fields to the client session */
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id as string;
        (session.user as any).gender = (token as any).gender ?? null;

        (session.user as any).lane = (token as any).lane ?? null;
        (session.user as any).verificationStatus =
          (token as any).verificationStatus ?? null;

        (session.user as any).primaryOrgId = (token as any).primaryOrgId ?? null;
        (session.user as any).primaryOrgName =
          (token as any).primaryOrgName ?? null;
        (session.user as any).primaryOrgSlug =
          (token as any).primaryOrgSlug ?? null;
        (session.user as any).primaryOrgType =
          (token as any).primaryOrgType ?? null;
      }
      return session;
    },
  },

  // You can add a custom error page if you like:
  // pages: { error: "/auth/college-only" },
};

export default authConfig;
