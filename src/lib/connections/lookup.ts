// src/lib/connections/lookup.ts
import clientPromise from "@/lib/clientPromise";

export type UserCard = {
  userId: string;
  handle?: string;
  displayName?: string;
  avatarUrl?: string | null;
  collegeId?: string | null;
  collegeVerified?: boolean;
  planTier?: "FREE" | "BASIC" | "PREMIUM" | null;
};

export async function getUserById(userId: string): Promise<UserCard | null> {
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection("users");
  const u = await users.findOne({ userId }, { projection: {
    _id: 0, userId: 1, handle: 1, displayName: 1, avatarUrl: 1,
    collegeId: 1, collegeVerified: 1, planTier: 1,
  }});
  return u as any;
}

export async function getMiniUserCard(userId: string): Promise<Partial<UserCard>> {
  const u = await getUserById(userId);
  if (!u) return {};
  return {
    userId: u.userId,
    handle: u.handle,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl ?? null,
    planTier: u.planTier,
  };
}
