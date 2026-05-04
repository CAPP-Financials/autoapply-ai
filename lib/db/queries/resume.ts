import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { resumes, type Resume, type NewResume } from "@/lib/db/schema";
import type { UserId } from "@/lib/auth/guard";

export async function insertResume(input: NewResume): Promise<Resume> {
  const [row] = await db.insert(resumes).values(input).returning();
  return row;
}

export async function latestResume(userId: UserId): Promise<Resume | null> {
  const [row] = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.createdAt))
    .limit(1);
  return row ?? null;
}

export async function getResumeById(userId: UserId, id: string): Promise<Resume | null> {
  const rows = await db
    .select()
    .from(resumes)
    .where(eq(resumes.id, id))
    .limit(1);
  const row = rows[0];
  if (!row || row.userId !== userId) return null;
  return row;
}

export async function updateResume(
  userId: UserId,
  id: string,
  patch: Partial<NewResume>,
): Promise<void> {
  // Re-confirm ownership before mutating.
  const owned = await getResumeById(userId, id);
  if (!owned) throw new Error("not found");
  await db.update(resumes).set(patch).where(eq(resumes.id, id));
}
