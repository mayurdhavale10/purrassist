// src/models/user.model.ts
import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/clientPromise";

/** Subscription / entitlement tier */
export type PlanTier = "FREE" | "BASIC" | "PREMIUM";

/** Optional gender */
export type Gender = "male" | "female" | "other" | null;

/** Signup lane */
export type Lane = "A" | "B";

/**
 * Verification lifecycle.
 * - "auto": instant trust (Lane A)
 * - "pending": generic pending
 * - "submitted": received an ID (generic)
 * - "submitted_auto": OCR/name-check looks good (auto-lean)
 * - "submitted_review": needs manual eyes
 * - "verified": human approved (or strong auto)
 * - "rejected": failed review
 */
export type VerificationStatus =
  | "auto"
  | "pending"
  | "submitted"
  | "submitted_auto"
  | "submitted_review"
  | "verified"
  | "rejected";

/** Role selected in Lane B */
export type RoleType = "College" | "School" | "Professional";

/** Stored metadata about an uploaded ID file */
export interface VerificationFileMeta {
  fileName: string;
  mimeType: string;
  size: number;
  url: string | null; // cloud URL after upload
}

/**
 * Canonical user document (MongoDB Node driver)
 */
export interface UserDoc {
  _id: ObjectId;

  // Identity
  email: string;
  emailLower?: string;

  name?: string | null;   // raw provider name or chosen name
  image?: string | null;

  // Public @handle
  handle?: string | null;
  handleLower?: string | null;

  // Display name
  displayName?: string | null;
  displayNameLower?: string | null;

  // Local auth
  passwordHash?: string | null;

  // Password reset
  resetTokenHash?: string | null;
  resetTokenExp?: Date | null;

  // --- Signup / verification state ---
  lane?: Lane;                                  // "A" fast-path | "B" verify
  verificationStatus?: VerificationStatus;      // see union above
  role?: RoleType | null;                       // chosen in Lane B
  idUploadUrl?: string | null;                  // flat convenience
  verificationOrgType?: string | null;          // "college" | "school" | "professional"
  verificationOrgName?: string | null;          // user-entered org name (Lane B)
  verificationFile?: VerificationFileMeta | null;

  // Primary org binding (set during promotion / Lane A derivation)
  primaryOrgId?: ObjectId | null;               // organizations._id
  primaryOrgSlug?: string | null;               // stable slug (e.g., "vit-bhopal")
  primaryOrgName?: string | null;               // canonical display name
  primaryOrgType?: "college" | "school" | "professional" | null;
  primaryOrgDomain?: string | null;             // e.g., "vitbhopal.ac.in"

  // --- Email OTP remnants (not used post-promotion, harmless to keep) ---
  emailOtpHash?: string | null;
  emailOtpExp?: Date | null;
  otpTries?: number;
  otpLastSentAt?: Date | null;

  // --- Optional phone (keep optional) ---
  phone?: string | null;
  phoneE164?: string | null;
  phoneVerifiedAt?: Date | null;

  // --- Product / plan ---
  gender?: Gender;
  planTier?: PlanTier;
  planExpiry?: Date | null;

  // Optional payment snapshot
  paymentDetails?: {
    transactionId?: string | null;
    amount?: number | null;
    paymentDate?: Date | null;
    // keep as any to store raw gateway payloads
    paymentMethod?: any;
  } | null;

  // Legacy college fields (only if referenced elsewhere)
  collegeId?: string | null;
  collegeName?: string | null;
  collegeVerified?: boolean;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

/** Mongo collection accessor */
export async function getUsersCollection(): Promise<Collection<UserDoc>> {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<UserDoc>("users");
}

/**
 * Derive normalized fields before writes (emailLower, handleLower, displayNameLower).
 * Also ensures updatedAt is touched if not provided.
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

  if (!out.updatedAt) out.updatedAt = new Date();

  return out as T;
}

/** Helpers */
export async function findUserById(userId: string): Promise<WithId<UserDoc> | null> {
  const users = await getUsersCollection();
  return users.findOne({ _id: new ObjectId(userId) });
}

export async function findUserByEmailLower(email: string): Promise<WithId<UserDoc> | null> {
  const users = await getUsersCollection();
  return users.findOne({ emailLower: email.trim().toLowerCase() });
}
