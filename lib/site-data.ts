import clientPromise from "@/lib/mongodb";
import localData from "@/data/site-data.json";

export type SiteData = typeof localData;

const COLLECTION = "site_data";
const DOC_ID = "booknest";

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
    return localData;
  }

  throw new Error(
    "No site data found in MongoDB. Seed the database or provide MONGODB_URI."
  );
}
