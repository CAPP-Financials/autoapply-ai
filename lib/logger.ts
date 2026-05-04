/**
 * Pino logger. Pretty in dev, JSON in prod.
 * Always log via this, never via console.log in production paths.
 */
import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL ?? "info",
  base: { app: "autoapply-ai" },
  redact: {
    paths: [
      "password",
      "secret",
      "key",
      "encryptedKey",
      "*.password",
      "*.secret",
      "*.apiKey",
      "*.api_key",
      "*.encryptedKey",
      "headers.authorization",
      "headers.cookie",
      "*.headers.authorization",
      "*.headers.cookie",
    ],
    censor: "[redacted]",
  },
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true, ignore: "pid,hostname" } },
});
