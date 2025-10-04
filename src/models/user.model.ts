// src/models/user.model.ts
import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/clientPromise";

/** Subscription / entitlement tier (expand as needed) */
export type PlanTier = "FREE" | "BASIC" | "PREMIUM";

/** Optional gender field you already pass via callbacks */
export type Gender = "male" | "female" | "other" | null;

/**
 * Canonical user document shape in MongoDB (MongoDB Node driver).
 * NOTE: This is separate from your Mongoose model in src/models/User.ts.
 */
export interface UserDoc {
  _id: ObjectId;

  // Identity from Auth.js adapter
  email: string;             // raw (as stored by adapter)
  emailLower?: string;       // derived normalized

  name?: string | null;      // original Google name or chosen name
  image?: string | null;

  // Public identity (unique handle like Instagram @username)
  handle?: string | null;        // user-chosen (case-preserving)
  handleLower?: string | null;   // UNIQUE (case-insensitive)

  // Profile name (non-unique, free-form for display)
  displayName?: string | null;
  displayNameLower?: string | null;

  // Local auth (for email/password users)
  passwordHash?: string | null;

  // Password reset (token is never stored in plain, only hash & expiry)
  resetTokenHash?: string | null;
  resetTokenExp?: Date | null;

  // Product attributes (optional)
  gender?: Gender;
  planTier?: PlanTier;           // default can be set in code as "FREE"
  collegeId?: string | null;
  collegeName?: string | null;
  collegeVerified?: boolean;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

/** Typed access to the users collection */
export async function getUsersCollection(): Promise<Collection<UserDoc>> {
  const client = await clientPromise;
  const db = client.db(); // default DB from your URI
  return db.collection<UserDoc>("users");
}

/**
 * Compute/refresh derived lowercase fields.
 * Call this helper before writes that modify: email, handle, displayName.
 */
export function withDerivedUserFields<T extends Partial<UserDoc>>(u: T): T {
  const out: any = { ...u };

  if (typeof out.email === "string" && out.email) {
    out.emailLower = out.email.trim().toLowerCase();
  }
  if (typeof out.handle === "string" && out.handle) {
    out.handleLower = out.handle.trim().toLowerCase();
  }
  if (typeof out.displayName === "string" && out.displayName) {
    out.displayNameLower = out.displayName.trim().toLowerCase();
  }

  // prefer to set updatedAt in writes, but keep a default here too
  if (!out.updatedAt) out.updatedAt = new Date();

  return out as T;
}

/** Optional helper: load a user by ObjectId string */
export async function findUserById(userId: string): Promise<WithId<UserDoc> | null> {
  const users = await getUsersCollection();
  return users.findOne({ _id: new ObjectId(userId) });
}

/** Optional helper: load a user by normalized email */
export async function findUserByEmailLower(email: string): Promise<WithId<UserDoc> | null> {
  const users = await getUsersCollection();
  return users.findOne({ emailLower: email.trim().toLowerCase() });
}
