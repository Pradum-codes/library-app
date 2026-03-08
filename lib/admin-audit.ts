import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import clientPromise from "@/lib/mongodb";
import type { AdminAuditEntry } from "@/lib/site-types";

const COLLECTION = "admin_activity";
const LOCAL_ACTIVITY_PATH = path.join(
  process.cwd(),
  "data",
  "admin-activity.json"
);
const LOCAL_LIMIT = 200;

async function readLocalActivity(): Promise<AdminAuditEntry[]> {
  try {
    const raw = await fs.readFile(LOCAL_ACTIVITY_PATH, "utf8");
    const parsed = JSON.parse(raw) as AdminAuditEntry[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Ignore and return empty.
  }
  return [];
}

async function writeLocalActivity(entries: AdminAuditEntry[]) {
  const serialized = JSON.stringify(entries, null, 2);
  await fs.writeFile(LOCAL_ACTIVITY_PATH, `${serialized}\n`, "utf8");
}

export async function getAdminActivity(
  limit = 80
): Promise<AdminAuditEntry[]> {
  if (clientPromise) {
    const dbName = process.env.MONGODB_DB || "booknest";
    const client = await clientPromise;
    const db = client.db(dbName);
    const docs = await db
      .collection(COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return docs.map((doc) => ({
      id: doc._id?.toString?.() ?? randomUUID(),
      action: doc.action,
      entity: doc.entity,
      entityId: doc.entityId,
      summary: doc.summary,
      actor: doc.actor,
      createdAt: new Date(doc.createdAt ?? Date.now()).toISOString(),
      meta: doc.meta ?? undefined,
    })) as AdminAuditEntry[];
  }

  if (process.env.NODE_ENV !== "production") {
    const entries = await readLocalActivity();
    return entries.slice(0, limit);
  }

  return [];
}

export async function addAdminActivity(
  entry: Omit<AdminAuditEntry, "id" | "createdAt"> & {
    createdAt?: string;
  }
): Promise<AdminAuditEntry | null> {
  const createdAt = entry.createdAt ?? new Date().toISOString();
  const fullEntry: AdminAuditEntry = {
    ...entry,
    id: randomUUID(),
    createdAt,
  };

  if (clientPromise) {
    const dbName = process.env.MONGODB_DB || "booknest";
    const client = await clientPromise;
    const db = client.db(dbName);
    await db.collection(COLLECTION).insertOne({
      action: fullEntry.action,
      entity: fullEntry.entity,
      entityId: fullEntry.entityId,
      summary: fullEntry.summary,
      actor: fullEntry.actor,
      createdAt: new Date(createdAt),
      meta: fullEntry.meta ?? null,
    });
    return fullEntry;
  }

  if (process.env.NODE_ENV !== "production") {
    const entries = await readLocalActivity();
    const next = [fullEntry, ...entries].slice(0, LOCAL_LIMIT);
    await writeLocalActivity(next);
    return fullEntry;
  }

  return null;
}
