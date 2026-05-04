/**
 * Drizzle schema — single source of truth for the AutoApply.ai DB.
 *
 * Layout:
 *   - Better Auth tables (user, session, account, verification) match the
 *     names/columns Better Auth's Drizzle adapter expects.
 *   - Domain tables (resumes, jobs, analyses, ...) follow.
 *   - Every user-scoped table has `userId` references with cascade delete.
 *   - PII contact fields live in dedicated bytea columns encrypted via
 *     pgcrypto outside Drizzle (see lib/crypto.ts). The redacted
 *     `parsedJson` blob never contains contact info.
 */

import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* — Helpers ─────────────────────────────────────────────────────────── */

const bytea = customType<{ data: Uint8Array; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const id = () => uuid("id").primaryKey().defaultRandom();
const userId = () =>
  uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

const createdAt = timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow();

/* — Enums ───────────────────────────────────────────────────────────── */

export const providerEnum = pgEnum("provider", [
  "anthropic",
  "openai",
  "google",
  "groq",
  "openrouter",
  "ollama",
  "council",
]);

export const currencyEnum = pgEnum("currency", ["USD", "INR", "BOTH"]);

export const cardStyleEnum = pgEnum("card_style", ["ledger", "terminal"]);

export const fitVizEnum = pgEnum("fit_viz", ["ring", "radar", "bar"]);

export const batchStatusEnum = pgEnum("batch_status", [
  "queued",
  "running",
  "done",
  "failed",
]);

export const batchJobStatusEnum = pgEnum("batch_job_status", [
  "queued",
  "running",
  "done",
  "failed",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "ready",
  "applied",
  "interviewing",
  "offer",
  "rejected",
]);

export const artifactKindEnum = pgEnum("artifact_kind", [
  "cover_letter",
  "ats_resume",
  "interview_eval",
]);

/* — Better Auth tables ──────────────────────────────────────────────── */

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    /* — domain-specific user prefs — */
    currencyPref: currencyEnum("currency_pref").notNull().default("BOTH"),
    defaultProvider: providerEnum("default_provider"),
    defaultModel: text("default_model"),
    redactPii: boolean("redact_pii").notNull().default(true),
    accentHex: varchar("accent_hex", { length: 16 }),
    cardStyle: cardStyleEnum("card_style").notNull().default("ledger"),
    fitViz: fitVizEnum("fit_viz").notNull().default("ring"),
    /* — timestamps — */
    createdAt,
    updatedAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    emailIdx: uniqueIndex("user_email_idx").on(t.email),
  }),
);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull(),
  createdAt,
  updatedAt,
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt,
  updatedAt,
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt,
  updatedAt,
});

/* — Domain tables ───────────────────────────────────────────────────── */

/**
 * BYO API keys per provider, encrypted at rest with pgcrypto.
 * `encryptedKey` = pgp_sym_encrypt(plaintext, KEY_ENCRYPTION_KEY).
 */
export const userProviderKeys = pgTable(
  "user_provider_keys",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: providerEnum("provider").notNull(),
    encryptedKey: bytea("encrypted_key").notNull(),
    keyHint: varchar("key_hint", { length: 8 }), // last 4 chars for UI
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt,
  },
  (t) => ({
    uniqUserProvider: uniqueIndex("upk_user_provider_idx").on(t.userId, t.provider),
  }),
);

/**
 * Resume version. PII contacts in dedicated bytea cols (encrypted);
 * `parsedJson` is the redacted profile (skills, summary, experience).
 */
export const resumes = pgTable(
  "resumes",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    blobUrl: text("blob_url").notNull(),
    mime: text("mime").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    parsedJson: jsonb("parsed_json"),
    piiName: bytea("pii_name"),
    piiEmail: bytea("pii_email"),
    piiPhone: bytea("pii_phone"),
    piiLinks: bytea("pii_links"),
    confidence: integer("confidence"), // 0-100
    parserLog: text("parser_log"),
    parsedAt: timestamp("parsed_at", { withTimezone: true }),
    createdAt,
  },
  (t) => ({
    userCreatedIdx: index("resumes_user_created_idx").on(t.userId, t.createdAt),
  }),
);

export const jobs = pgTable(
  "jobs",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    role: text("role").notNull(),
    location: text("location"),
    salaryLowUsd: integer("salary_low_usd"),
    salaryHighUsd: integer("salary_high_usd"),
    salaryLowInr: integer("salary_low_inr"),
    salaryHighInr: integer("salary_high_inr"),
    jdText: text("jd_text").notNull(),
    sourceUrl: text("source_url"),
    tags: text("tags").array(),
    createdAt,
  },
  (t) => ({
    userCreatedIdx: index("jobs_user_created_idx").on(t.userId, t.createdAt),
  }),
);

export const analyses = pgTable(
  "analyses",
  {
    id: id(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    resumeId: uuid("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    provider: providerEnum("provider").notNull(),
    model: text("model").notNull(),
    fitScore: integer("fit_score").notNull(), // 0-100
    fitDelta: integer("fit_delta").notNull().default(0),
    percentile: integer("percentile"),
    matchReasoning: text("match_reasoning"),
    gaps: jsonb("gaps").$type<{ label: string; weeksToClose: number }[]>(),
    skills: jsonb("skills").$type<{ skill: string; cand: number; req: number }[]>(),
    signals: jsonb("signals").$type<{ label: string; value: number }[]>(),
    costCents: integer("cost_cents").notNull().default(0),
    latencyMs: integer("latency_ms"),
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    trace: jsonb("trace"),
    createdAt,
  },
  (t) => ({
    fitScoreIdx: index("analyses_fit_score_idx").on(sql`${t.fitScore} DESC`),
    jobIdx: index("analyses_job_idx").on(t.jobId),
  }),
);

export const artifacts = pgTable("artifacts", {
  id: id(),
  analysisId: uuid("analysis_id")
    .notNull()
    .references(() => analyses.id, { onDelete: "cascade" }),
  kind: artifactKindEnum("kind").notNull(),
  contentMd: text("content_md").notNull(),
  generatedByProvider: providerEnum("generated_by_provider"),
  generatedByModel: text("generated_by_model"),
  createdAt,
});

export const applications = pgTable(
  "applications",
  {
    id: id(),
    analysisId: uuid("analysis_id")
      .notNull()
      .references(() => analyses.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").notNull().default("ready"),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    notesMd: text("notes_md"),
    evaluatedMd: text("evaluated_md"),
    updatedAt,
    createdAt,
  },
  (t) => ({
    statusIdx: index("applications_status_idx").on(t.status),
  }),
);

export const batches = pgTable("batches", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: batchStatusEnum("status").notNull().default("queued"),
  total: integer("total").notNull(),
  completed: integer("completed").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  createdAt,
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const batchJobs = pgTable(
  "batch_jobs",
  {
    id: id(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    status: batchJobStatusEnum("status").notNull().default("queued"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    updatedAt,
    error: text("error"),
  },
  (t) => ({
    batchIdx: index("batch_jobs_batch_idx").on(t.batchId, t.status),
  }),
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    ip: text("ip"),
    ua: text("ua"),
    createdAt,
  },
  (t) => ({
    userCreatedIdx: index("audit_user_created_idx").on(t.userId, t.createdAt),
  }),
);

/* — Relations (used by Drizzle's relational queries) ───────────────── */

export const userRelations = relations(user, ({ many }) => ({
  resumes: many(resumes),
  jobs: many(jobs),
  batches: many(batches),
  providerKeys: many(userProviderKeys),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(user, { fields: [resumes.userId], references: [user.id] }),
  analyses: many(analyses),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(user, { fields: [jobs.userId], references: [user.id] }),
  analyses: many(analyses),
}));

export const analysesRelations = relations(analyses, ({ one, many }) => ({
  job: one(jobs, { fields: [analyses.jobId], references: [jobs.id] }),
  resume: one(resumes, { fields: [analyses.resumeId], references: [resumes.id] }),
  artifacts: many(artifacts),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  analysis: one(analyses, {
    fields: [applications.analysisId],
    references: [analyses.id],
  }),
}));

/* — Type exports ────────────────────────────────────────────────────── */

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type BatchJob = typeof batchJobs.$inferSelect;
export type Artifact = typeof artifacts.$inferSelect;
export type UserProviderKey = typeof userProviderKeys.$inferSelect;
