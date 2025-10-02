// auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import clientPromise from "@/lib/clientPromise";

/** Resolve Google env keys (supports your AUTH_* names, with GOOGLE_* fallback) */
const GOOGLE_ID =
  process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_SECRET =
  process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET!;

/** public/webmail domains to block (Outlook/Live are *not* blocked anymore) */
const PUBLIC_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  // "outlook.com", // ← unblocked
  // "live.com",    // ← unblocked
  "aol.com",
  "proton.me",
  "protonmail.com",
  "icloud.com",
  "mail.com",
  "yandex.com",
  "rediffmail.com",
]);

/** explicitly allowed *public* domains (no extra verification) */
const ALLOWED_PUBLIC_DOMAINS = new Set<string>([
  "outlook.com",
  "live.com",
  // You can add more if you ever need to: "studentmail.com"
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

/** Strict academic-domain checker (unchanged from your logic) */
function isCollegeDomain(domain: string): boolean {
  const d = (domain || "").toLowerCase();
  if (!d) return false;
  if (PUBLIC_DOMAINS.has(d)) return false;
  if (EXTRA_COLLEGE_DOMAINS.includes(d)) return true;
  return ACADEMIC_REGEXES.some((re) => re.test(d));
}

/** Final sign-in eligibility:
 *  - allow academic domains (strict)
 *  - OR allow explicitly whitelisted public domains (Outlook/Live)
 */
function isEligibleSignInDomain(domain: string): boolean {
  const d = (domain || "").toLowerCase();
  if (!d) return false;
  if (ALLOWED_PUBLIC_DOMAINS.has(d)) return true; // Outlook/Live allowed
  return isCollegeDomain(d); // otherwise must be an academic domain
}

const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: GOOGLE_ID,
      clientSecret: GOOGLE_SECRET,
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
    /** hard gate: allow only eligible domains (college OR outlook/live) */
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      const domain = email?.split("@")[1] ?? "";
      return !!email && isEligibleSignInDomain(domain);
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        // carry to token
        (token as any).id = (user as any).id;
        (token as any).email = (user as any).email;
        (token as any).gender = (user as any).gender ?? null;
      }

      // refresh gender from your DB if needed
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

  // Optional: show a friendly page if a non-eligible email tries to log in:
  // pages: { error: "/auth/college-only" }, // receives ?error=AccessDenied
};

export default authConfig;
