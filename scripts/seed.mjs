import { MongoClient } from "mongodb";
import fs from "fs/promises";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "booknest";

if (!uri) {
  console.error("Missing MONGODB_URI. Set it in your environment.");
  process.exit(1);
}

const dataRaw = await fs.readFile(new URL("../data/site-data.json", import.meta.url));
const data = JSON.parse(dataRaw.toString());

const client = new MongoClient(uri);
await client.connect();

const db = client.db(dbName);
await db.collection("site_data").updateOne(
  { _id: "booknest" },
  { $set: { data, updatedAt: new Date() } },
  { upsert: true }
);

await client.close();
console.log("Seeded site_data in MongoDB.");
