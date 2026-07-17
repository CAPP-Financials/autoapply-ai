import { desc, eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { analyses, jobs, type Analysis, type NewAnalysis } from "@/lib/db/schema";
import type { UserId } from "@/lib/auth/guard";

export async function insertAnalysis(input: NewAnalysis): Promise<Analysis> {
  const [row] = await db.insert(analyses).values(input).returning();
  return row;
}

export async function listAnalysesForUser(
  userId: UserId,
): Promise<{ analysis: Analysis; company: string; role: string }[]> {
  // Inner join to enforce ownership at the SQL boundary.
  const rows = await db
    .select({
      analysis: analyses,
      company: jobs.company,
      role: jobs.role,
    })
    .from(analyses)
    .innerJoin(jobs, eq(jobs.id, analyses.jobId))
    .where(eq(jobs.userId, userId))
    .orderBy(desc(analyses.createdAt));
  return rows;
}

export async function getAnalysisForJob(
  userId: UserId,
  jobId: string,
): Promise<Analysis | null> {
  const rows = await db
    .select({ analysis: analyses })
    .from(analyses)
    .innerJoin(jobs, eq(jobs.id, analyses.jobId))
    .where(and(eq(analyses.jobId, jobId), eq(jobs.userId, userId)))
    .orderBy(desc(analyses.createdAt))
    .limit(1);
  return rows[0]?.analysis ?? null;
}

export async function getAnalysisById(
  userId: UserId,
  id: string,
): Promise<Analysis | null> {
  const rows = await db
    .select({ analysis: analyses })
    .from(analyses)
    .innerJoin(jobs, eq(jobs.id, analyses.jobId))
    .where(and(eq(analyses.id, id), eq(jobs.userId, userId)))
    .limit(1);
  return rows[0]?.analysis ?? null;
}

export async function listAnalysisIdsForUser(userId: UserId): Promise<string[]> {
  const rows = await db
    .select({ id: analyses.id })
    .from(analyses)
    .innerJoin(jobs, eq(jobs.id, analyses.jobId))
    .where(eq(jobs.userId, userId));
  return rows.map((r) => r.id);
}
