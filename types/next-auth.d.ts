import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      gender?: "male" | "female" | "other" | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    gender?: "male" | "female" | "other" | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    gender?: "male" | "female" | "other" | null;
  }
}