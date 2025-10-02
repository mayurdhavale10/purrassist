// src/lib/connections/authorize.ts
export type Plan = "FREE" | "BASIC" | "PREMIUM";
export type MiniUser = {
  userId: string;
  collegeId?: string | null;
  planTier?: Plan | null;
};

export function canDM({ me, other }: { me: MiniUser; other: MiniUser }) {
  const sameCollege =
    !!me.collegeId && !!other.collegeId && me.collegeId === other.collegeId;

  if (sameCollege) return { allowed: true as const };

  const bothPaid =
    (me.planTier && me.planTier !== "FREE") &&
    (other.planTier && other.planTier !== "FREE");

  if (bothPaid) return { allowed: true as const };

  return {
    allowed: false as const,
    reason: "BOTH_USERS_MUST_BE_PAID_FOR_CROSS_COLLEGE",
  };
}
