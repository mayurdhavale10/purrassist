// auth.ts (project root)
import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/clientPromise";

const AUTH_SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Accept custom domains / proxies (Hostinger, ngrok, etc.)
  trustHost: true,

  // Use one consistent secret (env: AUTH_SECRET or NEXTAUTH_SECRET)
  secret: AUTH_SECRET,

  // Persist users/sessions to Mongo
  adapter: MongoDBAdapter(clientPromise) as any,

  // JWT sessions (what your callbacks expect)
  session: { strategy: "jwt" },

  // Your provider + callbacks live in auth.config.ts
  ...authConfig,

  // debug: true, // ← uncomment temporarily if you need verbose logs server-side
});
