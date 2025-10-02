// src/app/api/connections/threads/[threadId]/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

// IMPORTANT: this points to your *root* auth.ts (not src/)
import { auth } from "../../../../../../auth";

import { getThreadById } from "@/lib/connections/threads";
import { getMiniUserCard } from "@/lib/connections/lookup";

type RouteParams = { params: { threadId: string } };

/**
 * GET /api/connections/threads/:threadId
 * Returns minimal metadata for a DM thread (used by middle pane + right profile preview).
 * - Auth required
 * - 404 if the thread doesn't exist or the caller isn't a participant
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const meId = String((session.user as any).id);

  const threadId = params.threadId?.trim();
  if (!threadId) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const thread = await getThreadById(threadId);
  if (!thread || !Array.isArray(thread.participantIds) || !thread.participantIds.includes(meId)) {
    // Either no such thread or caller is not a participant
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Determine the "other" participant for the right-pane preview
  const otherId = thread.participantIds.find((id) => id !== meId) ?? meId;
  const other = await getMiniUserCard(otherId);

  return NextResponse.json({
    threadId: thread.threadId,
    participants: thread.participantIds,
    other, // { userId, handle, displayName, avatarUrl?, planTier? }
    lastMessageAt: thread.lastMessageAt ? new Date(thread.lastMessageAt).toISOString() : null,
    unread: 0, // placeholder; wire real unread counts later
  });
}
