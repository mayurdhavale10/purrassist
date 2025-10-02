import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";            // ← root auth.ts
import { z } from "zod";
import { canDM } from "@/lib/connections/authorize";
import { getOrCreateOneToOne } from "@/lib/connections/threads";
import { getUserById } from "@/lib/connections/lookup";

const BodySchema = z.object({ targetUserId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const meId = String((session.user as any).id);

  const json = await req.json().catch(() => null);
  const parse = BodySchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  const { targetUserId } = parse.data;
  if (targetUserId === meId) {
    return NextResponse.json({ error: "CANNOT_DM_SELF" }, { status: 400 });
  }

  const [me, other] = await Promise.all([getUserById(meId), getUserById(targetUserId)]);
  if (!me || !other) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const gate = canDM({ me, other });
  if (!gate.allowed) {
    return NextResponse.json({ error: "DM_NOT_ALLOWED", reason: gate.reason }, { status: 403 });
  }

  const thread = await getOrCreateOneToOne({ userAId: meId, userBId: targetUserId });

  return NextResponse.json({
    threadId: thread.threadId,
    participants: thread.participantIds,
    other: {
      userId: other.userId,
      handle: other.handle,
      displayName: other.displayName,
      avatarUrl: (other as any).avatarUrl ?? null,
      college: { id: other.collegeId, verified: other.collegeVerified },
      planTier: other.planTier,
    },
  });
}
