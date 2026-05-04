import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  applications,
  analyses,
  jobs,
  type Application,
  type NewApplication,
} from "@/lib/db/schema";
import type { UserId } from "@/lib/auth/guard";

export async function listApplicationsForUser(userId: UserId) {
  return db
    .select({
      app: applications,
      analysis: analyses,
      company: jobs.company,
      role: jobs.role,
    })
    .from(applications)
    .innerJoin(analyses, eq(analyses.id, applications.analysisId))
    .innerJoin(jobs, eq(jobs.id, analyses.jobId))
    .where(eq(jobs.userId, userId))
    .orderBy(desc(applications.updatedAt));
}

export async function upsertApplication(
  userId: UserId,
  analysisId: string,
  patch: Partial<Pick<NewApplication, "status" | "appliedAt" | "notesMd" | "evaluatedMd">>,
): Promise<Application> {
  // Confirm the analysis is owned by the user.
  const [own] = await db
    .select({ id: analyses.id })
    .from(analyses)
    .innerJoin(jobs, eq(jobs.id, analyses.jobId))
    .where(and(eq(analyses.id, analysisId), eq(jobs.userId, userId)))
    .limit(1);
  if (!own) throw new Error("not found");

  const [existing] = await db
    .select()
    .from(applications)
    .where(eq(applications.analysisId, analysisId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(applications)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(applications.id, existing.id))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(applications)
      .values({
        analysisId,
        status: patch.status ?? "ready",
        appliedAt: patch.appliedAt,
        notesMd: patch.notesMd,
        evaluatedMd: patch.evaluatedMd,
      })
      .returning();
    return created;
  }
}
