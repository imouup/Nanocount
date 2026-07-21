import { Hono, type Context, type Next } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { loadConfig, isHostAllowed, type AppConfig } from "./config";
import { COUNTER_SCRIPT } from "./counter-script";
import { MemoryRateLimiter } from "./rate-limit";
import {
  bearerToken,
  clearSessionCookie,
  createSession,
  getCookie,
  isSecureRequest,
  requestIp,
  sameOrigin,
  secureEqual,
  sessionCookie,
  verifySession,
} from "./security";
import { runtimeStore } from "./storage/runtime";
import type { CounterStore, RuntimeBindings } from "./types";
import { ADMIN_CSS } from "./ui/admin-css";
import { ADMIN_HTML } from "./ui/admin-html";
import { ADMIN_JS } from "./ui/admin-js";
import { InputError, normalizeHost, normalizePath, parseNonNegativeInteger, parseTarget } from "./validation";

interface Variables {
  config: AppConfig;
  store: CounterStore | undefined;
}

type AppEnv = { Bindings: RuntimeBindings; Variables: Variables };
type AppContext = Context<AppEnv>;

const hitLimiter = new MemoryRateLimiter();
const loginLimiter = new MemoryRateLimiter();

function ok<T>(c: AppContext, data: T, status: ContentfulStatusCode = 200) {
  return c.json({ ok: true as const, data }, status);
}

function fail(c: AppContext, code: string, message: string, status: ContentfulStatusCode) {
  return c.json({ ok: false as const, error: { code, message } }, status);
}

function storeFor(c: AppContext): CounterStore {
  return c.get("store") ?? runtimeStore(c.env, c.get("config"));
}

async function readJson(c: AppContext, limit = 4096): Promise<Record<string, unknown>> {
  const declared = Number(c.req.header("content-length") || 0);
  if (declared > limit) throw new InputError("request body is too large", "body_too_large");
  const text = await c.req.text();
  if (new TextEncoder().encode(text).byteLength > limit) {
    throw new InputError("request body is too large", "body_too_large");
  }
  try {
    const value: unknown = JSON.parse(text || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("not an object");
    return value as Record<string, unknown>;
  } catch {
    throw new InputError("request body must be a JSON object", "invalid_json");
  }
}

function originHost(c: AppContext): string | null {
  const origin = c.req.header("origin");
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return normalizeHost(url.hostname);
  } catch {
    return null;
  }
}

function validateHitSource(c: AppContext, host: string): void {
  const config = c.get("config");
  if (!isHostAllowed(host, config.allowedHosts)) {
    throw new InputError("host is not allowed", "host_not_allowed", 403);
  }
  const source = originHost(c);
  if (!source) {
    if (config.allowNoOrigin) return;
    throw new InputError("a matching browser Origin is required", "origin_required", 403);
  }
  if (source !== host) throw new InputError("Origin does not match the counted host", "origin_mismatch", 403);
}

async function publicReadAllowed(c: AppContext): Promise<boolean> {
  const required = c.get("config").publicApiToken;
  return !required || secureEqual(bearerToken(c), required);
}

async function adminAuth(c: AppContext): Promise<"bearer" | "session" | null> {
  const secret = c.get("config").adminPassword;
  if (!secret) return null;
  const bearer = bearerToken(c);
  if (bearer && (await secureEqual(bearer, secret))) return "bearer";
  const session = getCookie(c.req.header("cookie"), "nanocount_session");
  if (session && (await verifySession(session, secret))) return "session";
  return null;
}

async function requireAdmin(c: AppContext, mutation = false): Promise<Response | null> {
  const authentication = await adminAuth(c);
  if (!authentication) return fail(c, "unauthorized", "请先登录", 401);
  if (mutation && authentication === "session" && !sameOrigin(c)) {
    return fail(c, "invalid_origin", "请求来源校验失败", 403);
  }
  return null;
}

function applyCors(c: AppContext): void {
  const origin = c.req.header("origin");
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        c.header("Access-Control-Allow-Origin", parsed.origin);
        c.header("Vary", "Origin", { append: true });
      }
    } catch {
      // Invalid origins receive no CORS headers.
    }
  } else if (!c.get("config").publicApiToken && c.req.method === "GET") {
    c.header("Access-Control-Allow-Origin", "*");
  }
}

export function createApp(options: { store?: CounterStore } = {}) {
  const app = new Hono<AppEnv>();

  app.use("*", async (c, next) => {
    c.set("config", loadConfig(c.env));
    c.set("store", options.store);
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    await next();
  });

  const adminSecurity = async (c: AppContext, next: Next) => {
    c.header("Cache-Control", "no-store");
    c.header(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    );
    await next();
  };
  app.use("/admin", adminSecurity);
  app.use("/admin/*", adminSecurity);

  app.use("/api/v1/*", async (c, next) => {
    try {
      await next();
    } finally {
      applyCors(c);
    }
  });

  app.get("/", (c) => c.redirect("/admin", 302));
  app.get("/health", async (c) => {
    await storeFor(c).initialize();
    return ok(c, { status: "ok", service: "nanocount", time: new Date().toISOString() });
  });
  app.get("/nano.js", (c) => {
    c.header("Content-Type", "application/javascript; charset=utf-8");
    c.header("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Cross-Origin-Resource-Policy", "cross-origin");
    return c.body(COUNTER_SCRIPT);
  });

  app.options("/api/v1/*", (c) => {
    applyCors(c);
    c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Nanocount-Key");
    c.header("Access-Control-Max-Age", "86400");
    return c.body(null, 204);
  });

  app.post("/api/v1/hit", async (c) => {
    const config = c.get("config");
    const limited = hitLimiter.take(`${requestIp(c, config.trustProxy)}:${originHost(c) ?? "none"}`, 300, 60_000);
    if (!limited.allowed) {
      c.header("Retry-After", String(limited.retryAfter));
      return fail(c, "rate_limited", "too many tracking requests", 429);
    }
    const body = await readJson(c, 3072);
    const target = parseTarget(body);
    validateHitSource(c, target.host);
    const page = await storeFor(c).increment(target.host, target.path, Date.now());
    const siteViews = await storeFor(c).getSiteViews(target.host);
    c.header("Cache-Control", "no-store");
    return ok(c, { host: target.host, path: target.path, pageViews: page.views, siteViews }, 201);
  });

  app.get("/api/v1/count", async (c) => {
    if (!(await publicReadAllowed(c))) return fail(c, "unauthorized", "a valid API token is required", 401);
    const target = parseTarget({
      url: c.req.query("url"),
      host: c.req.query("host"),
      path: c.req.query("path") ?? "/",
      includeQuery: c.req.query("includeQuery") === "true",
    });
    if (!isHostAllowed(target.host, c.get("config").allowedHosts)) {
      return fail(c, "host_not_allowed", "host is not allowed", 403);
    }
    const [page, siteViews] = await Promise.all([
      storeFor(c).getPage(target.host, target.path),
      storeFor(c).getSiteViews(target.host),
    ]);
    c.header("Cache-Control", "no-store");
    return ok(c, { host: target.host, path: target.path, pageViews: page?.views ?? 0, siteViews });
  });

  app.get("/api/v1/site", async (c) => {
    if (!(await publicReadAllowed(c))) return fail(c, "unauthorized", "a valid API token is required", 401);
    const host = normalizeHost(c.req.query("host"));
    if (!isHostAllowed(host, c.get("config").allowedHosts)) {
      return fail(c, "host_not_allowed", "host is not allowed", 403);
    }
    c.header("Cache-Control", "no-store");
    return ok(c, { host, siteViews: await storeFor(c).getSiteViews(host) });
  });

  app.get("/admin", (c) => c.html(ADMIN_HTML));
  app.get("/admin/", (c) => c.redirect("/admin", 308));
  app.get("/admin/assets/app.css", (c) => {
    c.header("Content-Type", "text/css; charset=utf-8");
    c.header("Cache-Control", "public, max-age=300");
    return c.body(ADMIN_CSS);
  });
  app.get("/admin/assets/app.js", (c) => {
    c.header("Content-Type", "application/javascript; charset=utf-8");
    c.header("Cache-Control", "public, max-age=300");
    return c.body(ADMIN_JS);
  });

  app.get("/admin/api/session", async (c) => ok(c, { authenticated: Boolean(await adminAuth(c)) }));
  app.post("/admin/api/login", async (c) => {
    if (!sameOrigin(c)) return fail(c, "invalid_origin", "请求来源校验失败", 403);
    const config = c.get("config");
    if (config.adminPassword.length < 12) {
      return fail(c, "not_configured", "请先设置至少 12 个字符的 ADMIN_PASSWORD", 503);
    }
    const rate = loginLimiter.take(requestIp(c, config.trustProxy), 8, 15 * 60_000);
    if (!rate.allowed) {
      c.header("Retry-After", String(rate.retryAfter));
      return fail(c, "rate_limited", "登录尝试过多，请稍后再试", 429);
    }
    const body = await readJson(c, 1024);
    if (typeof body.password !== "string" || !(await secureEqual(body.password, config.adminPassword))) {
      return fail(c, "invalid_credentials", "密码不正确", 401);
    }
    const expiresAt = Date.now() + config.sessionTtlSeconds * 1000;
    const token = await createSession(config.adminPassword, expiresAt);
    c.header("Set-Cookie", sessionCookie(token, config.sessionTtlSeconds, isSecureRequest(c)));
    return ok(c, { authenticated: true, expiresAt });
  });
  app.post("/admin/api/logout", async (c) => {
    const denied = await requireAdmin(c, true);
    if (denied) return denied;
    c.header("Set-Cookie", clearSessionCookie(isSecureRequest(c)));
    return ok(c, { authenticated: false });
  });
  app.get("/admin/api/summary", async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    return ok(c, await storeFor(c).getSummary());
  });
  app.get("/admin/api/hosts", async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    return ok(c, await storeFor(c).listHosts());
  });
  app.get("/admin/api/pages", async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    const rawHost = c.req.query("host");
    const search = (c.req.query("search") ?? "").trim();
    if (search.length > 100 || /[\u0000-\u001f\u007f]/.test(search)) throw new InputError("search is invalid");
    const page = Math.max(1, Number.parseInt(c.req.query("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(c.req.query("pageSize") ?? "20", 10) || 20));
    const sortValues = ["views", "path", "updated"] as const;
    const sortInput = c.req.query("sort");
    const sort = sortValues.find((value) => value === sortInput) ?? "views";
    const order = c.req.query("order") === "asc" ? "asc" : "desc";
    const result = await storeFor(c).listPages({
      ...(rawHost ? { host: normalizeHost(rawHost) } : {}),
      ...(search ? { search } : {}),
      page,
      pageSize,
      sort,
      order,
    });
    return ok(c, result);
  });
  app.patch("/admin/api/pages", async (c) => {
    const denied = await requireAdmin(c, true);
    if (denied) return denied;
    const body = await readJson(c, 3072);
    const host = normalizeHost(body.host);
    const path = normalizePath(body.path ?? "/", true);
    const views = parseNonNegativeInteger(body.views, "views");
    return ok(c, await storeFor(c).setViews(host, path, views, Date.now()));
  });

  app.notFound((c) => {
    if (new URL(c.req.url).pathname.startsWith("/api/") || new URL(c.req.url).pathname.startsWith("/admin/api/")) {
      return fail(c, "not_found", "endpoint not found", 404);
    }
    return c.redirect("/admin", 302);
  });

  app.onError((error, c) => {
    if (error instanceof InputError) return fail(c, error.code, error.message, error.status);
    console.error("[nanocount]", error);
    return fail(c, "internal_error", "服务暂时不可用", 500);
  });

  return app;
}

export default createApp();
