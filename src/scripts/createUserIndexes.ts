import clientPromise from "@/lib/clientPromise";

async function main() {
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection("users");

  // 1) make lookups fast and handle unique
  await users.createIndex({ emailLower: 1 }, { unique: true, sparse: true });
  await users.createIndex({ handleLower: 1 }, { unique: true, sparse: true });

  // optional quality-of-life
  await users.createIndex({ displayNameLower: 1 }, { sparse: true });
  await users.createIndex({ collegeId: 1 }, { sparse: true });
  await users.createIndex({ planTier: 1 }, { sparse: true });

  console.log("✅ users indexes ensured");
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
