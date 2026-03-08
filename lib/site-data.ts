import fs from "fs/promises";
import path from "path";

import clientPromise from "@/lib/mongodb";
import localData from "@/data/site-data.json";
import type { SiteData } from "@/lib/site-types";

const COLLECTION = "site_data";
const DOC_ID = "booknest";
const LOCAL_DATA_PATH = path.join(process.cwd(), "data", "site-data.json");

export async function getSiteData(): Promise<SiteData> {
  if (clientPromise) {
    const dbName = process.env.MONGODB_DB || "booknest";
    const client = await clientPromise;
    const db = client.db(dbName);
    const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID });

    if (doc && doc.data) {
      return doc.data as SiteData;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return localData as SiteData;
  }

  throw new Error(
    "No site data found in MongoDB. Seed the database or provide MONGODB_URI."
  );
}

export async function setSiteData(data: SiteData): Promise<void> {
  if (clientPromise) {
    const dbName = process.env.MONGODB_DB || "booknest";
    const client = await clientPromise;
    const db = client.db(dbName);
    await db.collection(COLLECTION).updateOne(
      { _id: DOC_ID },
      { $set: { data, updatedAt: new Date() } },
      { upsert: true }
    );
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const serialized = JSON.stringify(data, null, 2);
    await fs.writeFile(LOCAL_DATA_PATH, `${serialized}\n`, "utf8");
    return;
  }

  throw new Error(
    "No MongoDB connection available. Provide MONGODB_URI to update site data."
  );
}

export async function updateSiteData(
  updater: (data: SiteData) => SiteData
): Promise<SiteData> {
  const current = await getSiteData();
  const clone = JSON.parse(JSON.stringify(current)) as SiteData;
  const updated = updater(clone);
  await setSiteData(updated);
  return updated;
}
