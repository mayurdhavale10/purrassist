// src/app/api/user/me/route.ts
import { NextResponse } from "next/server";
// If auth.ts is at project root, use relative path:
import { auth } from "../../../../../auth";
// If you later move it to src/auth.ts, switch to: import { auth } from "@/auth";
import { getUsersCollection } from "@/models/user.model";

/** ===== Domain Types (explicit, verbose for clarity) ===== */
export type PlanTier = "FREE" | "BASIC" | "PREMIUM";
export type PlanLabel = "free" | "gender" | "intercollege";

export type Gender = "male" | "female" | "other" | null;

export interface DbUser {
  email: string;
  name?: string | null;
  image?: string | null;
  gender?: Gender;
  planTier?: PlanTier;
  planExpiry?: Date | string | null;
  // other fields may exist but are not needed here
}

export interface MatchingOption {
  type: string;
  label: string;
  description: string;
  icon: string;
  requiresGender?: "male" | "female";
}

export interface PlanStatus {
  isActive: boolean;
  planName: string;
  expiresAt?: Date | string | null;
  daysRemaining: number | null;
}

export interface ApiResponse {
  user: {
    email: string;
    name?: string | null;
    image?: string | null;
    gender?: Gender;
    college: string;
    planType: PlanLabel;
    hasActivePlan: boolean;
    planExpiry?: Date | string | null;
    daysRemaining: number | null;
  };
  matchingOptions: MatchingOption[];
  planStatus: PlanStatus;
}

/** ===== Helpers (kept explicit to mirror your original style) ===== */

/** Map canonical PlanTier -> UI label used elsewhere in your app */
function planLabelFromTier(tier?: PlanTier): PlanLabel {
  if (tier === "BASIC") return "intercollege";
  if (tier === "PREMIUM") return "gender";
  return "free";
}

/** Extract college token from an email domain */
function extractCollege(email: string): string {
  const domain = email.split("@")[1] || "";
  if (!domain) return "unknown";

  const common = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
  if (common.includes(domain.toLowerCase())) return "general";

  // remove academic/commercial suffixes and take first label
  const stripped = domain.replace(/\.(edu|ac\.in|edu\.in|org|com)$/i, "");
  const first = stripped.split(".")[0] || stripped;
  return first.toLowerCase();
}

/** A paid plan is active if now < expiry; FREE is always active */
function isPlanActive(planLabel: PlanLabel, planExpiry?: Date | string | null): boolean {
  if (planLabel === "free") return true;
  if (!planExpiry) return false;
  return new Date() < new Date(planExpiry);
}

/** Days remaining until expiry, or null if expired/none */
function calcDaysRemaining(exp?: Date | string | null): number | null {
  if (!exp) return null;
  const expiry = new Date(exp);
  const now = new Date();
  if (expiry <= now) return null;
  const ms = expiry.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** Build matching options based on plan and college token */
function buildMatchingOptions(planLabel: PlanLabel, active: boolean, college: string): MatchingOption[] {
  if (!active) {
    return [
      {
        type: "same_college_any",
        label: "Same College Only",
        description: `Match with anyone from ${college} (Free Plan)`,
        icon: "🏫",
      },
    ];
  }

  switch (planLabel) {
    case "gender": // PREMIUM
      return [
        {
          type: "same_college_any",
          label: "Same College - Any Gender",
          description: `Match with anyone from ${college}`,
          icon: "🏫",
        },
        {
          type: "same_college_male",
          label: "Same College - Male Only",
          description: `Match with males from ${college}`,
          icon: "👨‍🎓",
          requiresGender: "male",
        },
        {
          type: "same_college_female",
          label: "Same College - Female Only",
          description: `Match with females from ${college}`,
          icon: "👩‍🎓",
          requiresGender: "female",
        },
      ];

    case "intercollege": // BASIC
      return [
        {
          type: "any_college_any",
          label: "Any College - Any Gender",
          description: "Match with anyone from any college",
          icon: "🌍",
        },
        {
          type: "any_college_male",
          label: "Any College - Male Only",
          description: "Match with males from any college",
          icon: "👨‍🎓",
          requiresGender: "male",
        },
        {
          type: "any_college_female",
          label: "Any College - Female Only",
          description: "Match with females from any college",
          icon: "👩‍🎓",
          requiresGender: "female",
        },
        {
          type: "same_college_any",
          label: "Same College - Any Gender",
          description: `Match with anyone from ${college}`,
          icon: "🏫",
        },
      ];

    default: // "free"
      return [
        {
          type: "same_college_any",
          label: "Same College Only",
          description: `Match with anyone from ${college} (Free Plan)`,
          icon: "🏫",
        },
      ];
  }
}

/** ===== Route ===== */
export async function GET(_req: Request): Promise<NextResponse> {
  // 1) Auth
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2) Read user via Mongo driver (projection hides secrets)
  const users = await getUsersCollection();
  const user = (await users.findOne(
    { emailLower: email.trim().toLowerCase() },
    {
      projection: {
        // never return secrets
        passwordHash: 0,
        resetTokenHash: 0,
        resetTokenExp: 0,
      },
    }
  )) as DbUser | null;

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 3) Derived fields
  const college = extractCollege(user.email);
  const planLabel = planLabelFromTier(user.planTier);
  const active = isPlanActive(planLabel, user.planExpiry);
  const daysRemaining = calcDaysRemaining(user.planExpiry);

  // 4) Matching options
  const matchingOptions = buildMatchingOptions(planLabel, active, college);

  // 5) Response payload (typed)
  const response: ApiResponse = {
    user: {
      email: user.email,
      name: user.name ?? null,
      image: user.image ?? null,
      gender: user.gender ?? null,
      college,
      planType: planLabel,
      hasActivePlan: active,
      planExpiry: user.planExpiry ?? null,
      daysRemaining,
    },
    matchingOptions,
    planStatus: {
      isActive: active,
      planName:
        planLabel === "gender"
          ? "Gender Plan"
          : planLabel === "intercollege"
          ? "Inter-College Plan"
          : "Free Plan",
      expiresAt: user.planExpiry ?? null,
      daysRemaining,
    },
  };

  return NextResponse.json(response);
}
