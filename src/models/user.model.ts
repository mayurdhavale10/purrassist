// src/models/user.model.ts
import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/clientPromise";

export type PlanTier = "FREE" | "BASIC" | "PREMIUM";
export type Gender = "male" | "female" | "other" | null;
export type Lane = "A" | "B";
export type VerificationStatus = "auto" | "pending" | "verified" | "rejected";
export type RoleType = "College" | "School" | "Professional";

export interface VerificationFileMeta {
  fileName: string;
  mimeType: string;
  size: number;
  url: string | null;
}

export interface UserDoc {
  _id: ObjectId;

  email: string;
  emailLower?: string;

  name?: string | null;
  image?: string | null;

  handle?: string | null;
  handleLower?: string | null;

  displayName?: string | null;
  displayNameLower?: string | null;

  passwordHash?: string | null;

  resetTokenHash?: string | null;
  resetTokenExp?: Date | null;

  // --- Signup / verification
  lane?: Lane;
  verificationStatus?: VerificationStatus;
  role?: RoleType | null;
  idUploadUrl?: string | null;
  verificationOrgType?: string | null;
  verificationOrgName?: string | null;
  verificationFile?: VerificationFileMeta | null;

  // --- Email OTP (for Lane B hardening)
  emailOtpHash?: string | null;      // hash of 6-digit code
  emailOtpExp?: Date | null;         // code expiry
  otpTries?: number;                 // wrong attempts counter
  otpLastSentAt?: Date | null;       // cooldown timestamp

  // --- Phone remains optional (you asked to keep it optional)
  phone?: string | null;
  phoneE164?: string | null;
  phoneVerifiedAt?: Date | null;

  // --- Product
  gender?: Gender;
  planTier?: PlanTier;
  planExpiry?: Date | null;

  paymentDetails?: {
    transactionId?: string | null;
    amount?: number | null;
    paymentDate?: Date | null;
    paymentMethod?: any;
  } | null;

  collegeId?: string | null;
  collegeName?: string | null;
  collegeVerified?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export async function getUsersCollection(): Promise<Collection<UserDoc>> {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<UserDoc>("users");
}

export function withDerivedUserFields<T extends Partial<UserDoc>>(u: T): T {
  const out: any = { ...u };
  if (typeof out.email === "string" && out.email) out.emailLower = out.email.trim().toLowerCase();
  if (typeof out.handle === "string" && out.handle) out.handleLower = out.handle.trim().toLowerCase();
  if (typeof out.displayName === "string" && out.displayName) out.displayNameLower = out.displayName.trim().toLowerCase();
  if (!out.updatedAt) out.updatedAt = new Date();
  return out as T;
}

export async function findUserById(userId: string): Promise<WithId<UserDoc> | null> {
  const users = await getUsersCollection();
  return users.findOne({ _id: new ObjectId(userId) });
}

export async function findUserByEmailLower(email: string): Promise<WithId<UserDoc> | null> {
  const users = await getUsersCollection();
  return users.findOne({ emailLower: email.trim().toLowerCase() });
}
