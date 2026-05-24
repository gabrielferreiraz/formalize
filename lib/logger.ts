/**
 * Structured logger — Pino with PII redaction.
 *
 * Usage:
 *   import { logger, requestLogger } from "@/lib/logger";
 *
 *   // Module-level (no request context):
 *   logger.warn({ artistId }, "artist not found");
 *
 *   // Inside an API route (preferred — binds requestId + context):
 *   const log = requestLogger({ requestId, artistId, action: "pdf.generate" });
 *   log.info({ type }, "started");
 *   log.error({ err }, "failed");
 *
 * Log levels: trace < debug < info < warn < error < fatal
 * Set LOG_LEVEL env var to override (default: "debug" in dev, "info" in prod).
 *
 * Dev output: pino-pretty (colorized, readable).
 * Prod output: JSON to stdout (captured by Docker / Vercel / Railway).
 */

import pino, { type Logger } from "pino";

// ── PII / sensitive field redaction ─────────────────────────────────────────
// These paths are stripped from ALL log entries and replaced with "[REDACTED]".
// Covers top-level and one level of nesting; extend if deeper nesting appears.
const REDACT_PATHS: string[] = [
  // Passwords (all common naming conventions in this codebase)
  "password",
  "senha",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "hashedPassword",
  "*.password",
  "*.senha",
  "*.currentPassword",
  "*.newPassword",
  "[*].password",

  // Auth tokens — JWT, reset, OAuth
  "token",
  "accessToken",
  "refreshToken",
  "idToken",
  "resetToken",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "[*].token",

  // HTTP auth headers
  "authorization",
  "cookie",
  "headers.authorization",
  "headers.cookie",
  "req.headers.authorization",
  "req.headers.cookie",

  // Financial PII
  "pixKey",
  "bankInfo",
  "*.pixKey",
  "*.bankInfo",
  "[*].pixKey",

  // Env secrets (defensive — should never be logged, but guard anyway)
  "secret",
  "*.secret",
  "NEXTAUTH_SECRET",
  "DATABASE_URL",
];

// ── Logger factory ────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== "production";

function buildLogger(): Logger {
  return pino({
    level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),

    redact: {
      paths: REDACT_PATHS,
      censor: "[REDACTED]",
    },

    // Serialize Error objects properly (includes message, stack, type)
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },

    // Use "level" as a string label in JSON (not pino's numeric default)
    formatters: {
      level: (label) => ({ level: label }),
    },

    timestamp: pino.stdTimeFunctions.isoTime,

    // Static fields on every log line
    base: { service: "formalize" },

    // Dev: human-readable output via pino-pretty
    // Prod: pure JSON to stdout — let the platform aggregate
    ...(isDev && {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname,service",
          messageFormat: "[{action}] {msg}",
        },
      },
    }),
  });
}

export const logger = buildLogger();

// ── Context type ──────────────────────────────────────────────────────────────
export interface LogContext {
  requestId?: string;
  userId?: string;
  artistId?: string;
  /** Dot-separated action name, e.g. "pdf.generate", "auth.login", "upload.logo" */
  action?: string;
  [key: string]: unknown;
}

/**
 * Returns a child logger with the given context bound to every log line.
 * Call once per request and pass the result through the call stack.
 */
export function requestLogger(context: LogContext): Logger {
  return logger.child(context);
}

/**
 * Extracts x-request-id from a Next.js Request header, or generates a new UUID.
 * Use at the top of every API route handler.
 */
export function getRequestId(req: { headers: { get(name: string): string | null } }): string {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}
