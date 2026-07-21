import type { Context } from "hono";

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function secureEqual(left: string, right: string): Promise<boolean> {
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const aa = new Uint8Array(a);
  const bb = new Uint8Array(b);
  let difference = aa.length ^ bb.length;
  for (let index = 0; index < aa.length; index += 1) difference |= aa[index]! ^ bb[index]!;
  return difference === 0;
}

async function signature(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const result = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(result));
}

export async function createSession(secret: string, expiresAt: number): Promise<string> {
  const payload = String(expiresAt);
  return `${payload}.${await signature(payload, secret)}`;
}

export async function verifySession(token: string, secret: string, now = Date.now()): Promise<boolean> {
  const separator = token.indexOf(".");
  if (separator <= 0 || !secret) return false;
  const payload = token.slice(0, separator);
  const supplied = token.slice(separator + 1);
  const expiresAt = Number(payload);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;
  return secureEqual(supplied, await signature(payload, secret));
}

export function getCookie(header: string | undefined, name: string): string {
  if (!header) return "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export function sessionCookie(token: string, maxAge: number, secure: boolean): string {
  return [
    `nanocount_session=${encodeURIComponent(token)}`,
    "Path=/admin",
    "HttpOnly",
    "SameSite=Strict",
    secure ? "Secure" : "",
    `Max-Age=${maxAge}`,
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearSessionCookie(secure: boolean): string {
  return sessionCookie("", 0, secure);
}

export function isSecureRequest(c: Context): boolean {
  if (new URL(c.req.url).protocol === "https:") return true;
  return c.req.header("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
}

export function requestIp(c: Context, trustProxy: boolean): string {
  const platformIp = c.req.header("cf-connecting-ip") || c.req.header("x-vercel-forwarded-for");
  if (platformIp) return platformIp.split(",")[0]!.trim().slice(0, 80);
  if (trustProxy) return (c.req.header("x-forwarded-for") || "unknown").split(",")[0]!.trim().slice(0, 80);
  return "unknown";
}

export function sameOrigin(c: Context): boolean {
  const origin = c.req.header("origin") || c.req.header("referer");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(c.req.url).origin;
  } catch {
    return false;
  }
}

export function bearerToken(c: Context): string {
  const authorization = c.req.header("authorization") || "";
  if (authorization.toLowerCase().startsWith("bearer ")) return authorization.slice(7).trim();
  return c.req.header("x-nanocount-key")?.trim() || "";
}
