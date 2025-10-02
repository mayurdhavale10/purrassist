// src/lib/connections/inbox.ts
import clientPromise from "@/lib/clientPromise";

export async function listConversations({
  userId,
  cursor,
  limit = 20,
}: {
  userId: string;
  cursor?: string;
  limit?: number;
}) {
  const client = await clientPromise;
  const db = client.db();

  const threads = db.collection("threads");
  const users = db.collection("users");

  const match: any = { participantIds: userId };

  const pipeline: any[] = [
    { $match: match },
    { $sort: { lastMessageAt: -1 } },
    { $limit: limit },
    {
      $addFields: {
        otherId: {
          $cond: [
            { $eq: [{ $arrayElemAt: ["$participantIds", 0] }, userId] },
            { $arrayElemAt: ["$participantIds", 1] },
            { $arrayElemAt: ["$participantIds", 0] },
          ],
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "otherId",
        foreignField: "userId",
        as: "other",
      },
    },
    { $unwind: { path: "$other", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        threadId: 1,
        lastMessageAt: 1,
        lastMessagePreview: 1,
        other: {
          userId: "$other.userId",
          displayName: "$other.displayName",
          handle: "$other.handle",
          avatarUrl: "$other.avatarUrl",
        },
      },
    },
  ];

  const rows = await threads.aggregate(pipeline).toArray();

  const items = rows.map((r: any) => ({
    threadId: r.threadId,
    other: r.other ?? { userId: "unknown" },
    lastMessage: {
      preview: r.lastMessagePreview?.body ?? "",
      at: r.lastMessageAt ? new Date(r.lastMessageAt).toISOString() : null,
      from: undefined,
    },
    unread: 0,
  }));

  // Simple: no cursor for v1
  return { items, nextCursor: null };
}
