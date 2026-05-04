import { desc, eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs, type Job, type NewJob } from "@/lib/db/schema";
import type { UserId } from "@/lib/auth/guard";

export async function insertJob(input: NewJob): Promise<Job> {
  const [row] = await db.insert(jobs).values(input).returning();
  return row;
}

export async function listJobs(userId: UserId): Promise<Job[]> {
  return db
    .select()
    .from(jobs)
    .where(eq(jobs.userId, userId))
    .orderBy(desc(jobs.createdAt));
}

export async function getJobById(userId: UserId, id: string): Promise<Job | null> {
  const [row] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
    .limit(1);
  return row ?? null;
}
