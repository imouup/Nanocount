import type { RuntimeBindings } from "./types";

export interface AppConfig {
  adminPassword: string;
  allowedHosts: string[];
  publicApiToken: string;
  tursoDatabaseUrl: string;
  tursoAuthToken: string;
  sessionTtlSeconds: number;
  allowNoOrigin: boolean;
  trustProxy: boolean;
  production: boolean;
}

function nodeEnv(): RuntimeBindings {
  if (typeof process === "undefined" || !process.env) return {};
  return process.env as RuntimeBindings;
}

function value(env: RuntimeBindings, key: keyof RuntimeBindings): string {
  return String(env[key] ?? nodeEnv()[key] ?? "").trim();
}

function booleanValue(raw: string, fallback = false): boolean {
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export function loadConfig(env: RuntimeBindings = {}): AppConfig {
  const ttl = Number.parseInt(value(env, "SESSION_TTL_HOURS") || "12", 10);
  const runtime = value(env, "NODE_ENV");
  return {
    adminPassword: value(env, "ADMIN_PASSWORD"),
    allowedHosts: value(env, "ALLOWED_HOSTS")
      .split(",")
      .map((host) => host.trim().toLowerCase().replace(/\.$/, ""))
      .filter(Boolean),
    publicApiToken: value(env, "PUBLIC_API_TOKEN"),
    tursoDatabaseUrl: value(env, "TURSO_DATABASE_URL"),
    tursoAuthToken: value(env, "TURSO_AUTH_TOKEN"),
    sessionTtlSeconds: Number.isFinite(ttl) ? Math.min(Math.max(ttl, 1), 168) * 3600 : 12 * 3600,
    allowNoOrigin: booleanValue(value(env, "ALLOW_NO_ORIGIN")),
    trustProxy: booleanValue(value(env, "TRUST_PROXY")),
    production: runtime === "production" || Boolean(value(env, "TURSO_DATABASE_URL")) || Boolean(env.DB),
  };
}

function isLoopbackHost(host: string): boolean {
  const normalized = host.toLowerCase().replace(/\.$/, "");
  if (normalized === "localhost" || normalized.endsWith(".localhost") || normalized === "[::1]") return true;
  const parts = normalized.split(".");
  return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

export function isHostAllowed(host: string, patterns: string[]): boolean {
  if (patterns.length === 0) return true;
  const normalized = host.toLowerCase().replace(/\.$/, "");
  if (isLoopbackHost(normalized)) return true;
  return patterns.some((pattern) => {
    if (pattern.startsWith("*.")) {
      const suffix = pattern.slice(1);
      return normalized.endsWith(suffix) && normalized.length > suffix.length;
    }
    return normalized === pattern;
  });
}
