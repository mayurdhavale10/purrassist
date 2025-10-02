// src/lib/connections/messages.ts
import clientPromise from "@/lib/clientPromise";
import { touchThreadLastMessage } from "./threads";

type Body = { type: "text" | "image"; text?: string; mediaUrl?: string };

export type Message = {
  _id?: any;
  messageId: string;
  threadId: string;
  senderId: string;
  body: Body;
  createdAt: Date;
  readBy: string[];
};

function toMessageId(id: any) {
  return typeof id === "string" ? id : String(id);
}

export async function listMessages({
  threadId,
  after,
  limit = 30,
}: {
  threadId: string;
  after?: string;
  limit?: number;
}) {
  const client = await clientPromise;
  const db = client.db();
  const messages = db.collection<Message>("messages");

  const q: any = { threadId };
  if (after) {
    // cursor = ISO date or messageId; we keep it simple: use messageId (_id string)
    q.messageId = { $gt: after };
  }

  const items = await messages
    .find(q)
    .sort({ messageId: 1 })
    .limit(limit)
    .toArray();

  const shaped = items.map((m) => ({
    messageId: m.messageId,
    threadId: m.threadId,
    senderId: m.senderId,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    readBy: m.readBy ?? [],
  }));

  const nextCursor =
    shaped.length === limit ? shaped[shaped.length - 1].messageId : null;

  return { items: shaped, nextCursor };
}

let counter = 1;
export async function sendMessage({
  threadId,
  senderId,
  body,
}: {
  threadId: string;
  senderId: string;
  body: Body;
}) {
  const client = await clientPromise;
  const db = client.db();
  const messages = db.collection<Message>("messages");

  const now = new Date();
  const messageId = `m_${now.getTime()}_${counter++}`;

  const doc: Message = {
    messageId,
    threadId,
    senderId,
    body,
    createdAt: now,
    readBy: [senderId],
  };

  await messages.insertOne(doc);

  await touchThreadLastMessage({
    threadId,
    preview: {
      type: body.type,
      body: body.type === "text" ? (body.text ?? "") : "[media]",
    },
  });

  return {
    messageId: doc.messageId,
    senderId: doc.senderId,
    body: doc.body,
    createdAt: doc.createdAt.toISOString(),
    readBy: doc.readBy,
  };
}
