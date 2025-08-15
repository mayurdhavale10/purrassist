import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import clientPromise from "@/lib/clientPromise";

const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          gender: null // Initialize as null
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.gender = user.gender ?? null;
      }
      
      // If session is being updated (like when gender is changed), fetch fresh data
      if (trigger === "update" || !token.gender) {
        try {
          const client = await clientPromise;
          const db = client.db();
          const users = db.collection("users");
          
          const dbUser = await users.findOne({ email: token.email });
          if (dbUser) {
            token.gender = dbUser.gender || null;
          }
        } catch (error) {
          console.error("Error fetching user data in JWT callback:", error);
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.gender = token.gender as "male" | "female" | "other" | null;
      }
      return session;
    },
  },
};

export default authConfig;