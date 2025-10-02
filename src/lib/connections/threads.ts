// src/lib/connections/threads.ts
import clientPromise from "@/lib/clientPromise";

export type Thread = {
  _id?: any;
  threadId: string;
  participantIds: [string, string]; // sorted
  lastMessageAt?: Date;
  lastMessagePreview?: { type: "text" | "image"; body: string } | null;
};

function sortPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function getOrCreateOneToOne({
  userAId,
  userBId,
}: {
  userAId: string;
  userBId: string;
}): Promise<Thread> {
  const [u1, u2] = sortPair(userAId, userBId);
  const key = `${u1}:${u2}`;

  const client = await clientPromise;
  const db = client.db();
  const threads = db.collection<Thread>("threads");

  // Upsert by a unique compound “participantsKey” (you should index this)
  const res = await threads.findOneAndUpdate(
    { threadId: key },
    {
      $setOnInsert: {
        threadId: key,
        participantIds: [u1, u2] as [string, string],
        lastMessageAt: new Date(),
        lastMessagePreview: null,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  return res!;
}

export async function getThreadById(threadId: string): Promise<Thread | null> {
  const client = await clientPromise;
  const db = client.db();
  const threads = db.collection<Thread>("threads");
  return threads.findOne({ threadId });
}

export async function touchThreadLastMessage({
  threadId,
  preview,
}: {
  threadId: string;
  preview: { type: "text" | "image"; body: string };
}) {
  const client = await clientPromise;
  const db = client.db();
  const threads = db.collection<Thread>("threads");
  await threads.updateOne(
    { threadId },
    { $set: { lastMessageAt: new Date(), lastMessagePreview: preview } }
  );
}
