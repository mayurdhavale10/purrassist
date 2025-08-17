// auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import clientPromise from "@/lib/clientPromise";

/** public/webmail domains to block */
const PUBLIC_DOMAINS = new Set([
  "gmail.com","yahoo.com","hotmail.com","outlook.com",
  "live.com","aol.com","proton.me","protonmail.com",
  "icloud.com","mail.com","yandex.com","rediffmail.com"
]);

/** extra allowed college domains via env (comma separated) */
const EXTRA_COLLEGE_DOMAINS: string[] = (process.env.EXTRA_COLLEGE_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

/** broad academic patterns: .edu, .edu.xx, .ac.xx, .edu.in, .ac.in, etc. */
const ACADEMIC_REGEXES = [
  /\.edu$/i,                 // example.edu
  /\.edu\.[a-z]{2,}$/i,      // example.edu.in, example.edu.au
  /\.ac\.[a-z]{2,}$/i,       // example.ac.in, example.ac.uk
];

function isCollegeDomain(domain: string): boolean {
  const d = (domain || "").toLowerCase();
  if (!d) return false;
  if (PUBLIC_DOMAINS.has(d)) return false;
  if (EXTRA_COLLEGE_DOMAINS.includes(d)) return true;
  return ACADEMIC_REGEXES.some((re) => re.test(d));
}

const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // we support many domains, so we don't set Google "hd"
      async profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          gender: null, // init
        };
      },
    }),
  ],

  callbacks: {
    /** hard gate: allow only college domains (no backend route required) */
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      const domain = email?.split("@")[1] ?? "";
      return !!email && isCollegeDomain(domain);
    },

// In auth.config.ts (jwt callback)
async jwt({ token, user, trigger }) {
  // 1. Carry over user data to token (original logic)
  if (user) {
    (token as any).id = (user as any).id;
    (token as any).email = (user as any).email;
    (token as any).gender = (user as any).gender ?? null;
  }

  // 2. NEW: Auto-create user with free plan on first sign-in
  if (user) {
    try {
      const client = await clientPromise;
      const db = client.db();
      const users = db.collection("users");

      await users.updateOne(
        { email: (user as any).email },
        {
          $setOnInsert: { // Only runs for NEW users
            email: (user as any).email,
            emailDomain: (user as any).email.split("@")[1],
            name: (user as any).name,
            image: (user as any).image,
            gender: null,
            preferredGender: null,
            planType: "free", // Force free plan
            planExpiry: null,
            createdAt: new Date(),
          },
          $set: { // Updates on every login
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (e) {
      console.error("JWT callback DB error (user upsert):", e);
    }
  }

  // 3. ORIGINAL LOGIC: Handle gender updates (unchanged)
  if (trigger === "update" || (token as any).gender == null) {
    try {
      const client = await clientPromise;
      const db = client.db();
      const users = db.collection("users");
      const dbUser = await users.findOne({ email: (token as any).email });
      if (dbUser) (token as any).gender = dbUser.gender ?? null;
    } catch (e) {
      console.error("JWT callback DB error (gender fetch):", e);
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

  // Optional: show a friendly page if a non-college email tries to log in:
  // pages: { error: "/auth/college-only" }, // receives ?error=AccessDenied
};

export default authConfig;
