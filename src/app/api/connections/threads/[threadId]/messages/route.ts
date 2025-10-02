import { NextResponse } from "next/server";
import { auth } from "../../../../../../../auth";       // ← root auth.ts
import { z } from "zod";
import { getThreadById } from "@/lib/connections/threads";
import { listMessages, sendMessage } from "@/lib/connections/messages";
import { canDM } from "@/lib/connections/authorize";
import { getUserById } from "@/lib/connections/lookup";

type Params = { params: { threadId: string } };

export async function GET(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const meId = String((session.user as any).id);

  const thread = await getThreadById(params.threadId);
  if (!thread || !thread.participantIds.includes(meId)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor") || undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") || 30), 100);

  const page = await listMessages({ threadId: params.threadId, after: cursor, limit });
  return NextResponse.json(page);
}

const SendBody = z.object({
  body: z.object({
    type: z.enum(["text", "image"]),
    text: z.string().max(4000).optional(),
    mediaUrl: z.string().url().optional(),
  }),
});

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const meId = String((session.user as any).id);

  const thread = await getThreadById(params.threadId);
  if (!thread || !thread.participantIds.includes(meId)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const otherId = thread.participantIds.find((id) => id !== meId)!;
  const [me, other] = await Promise.all([getUserById(meId), getUserById(otherId)]);
  if (!me || !other) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const gate = canDM({ me, other });
  if (!gate.allowed) {
    return NextResponse.json({ error: "DM_NOT_ALLOWED", reason: gate.reason }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parse = SendBody.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const message = await sendMessage({
    threadId: params.threadId,
    senderId: meId,
    body: parse.data.body,
  });

  return NextResponse.json(message, { status: 201 });
}
