const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;

export class InputError extends Error {
  constructor(
    message: string,
    public readonly code = "invalid_input",
    public readonly status: 400 | 403 = 400,
  ) {
    super(message);
  }
}

export function normalizeHost(input: unknown): string {
  if (typeof input !== "string") throw new InputError("host must be a string");
  let host = input.trim().toLowerCase().replace(/\.$/, "");
  if (!host || host.length > 253 || /[\s/@?#\\]/.test(host)) {
    throw new InputError("host is invalid");
  }

  try {
    host = new URL(`https://${host}`).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    throw new InputError("host is invalid");
  }

  if (host === "localhost" || host.startsWith("[") || IPV4.test(host)) return host;
  if (!host.split(".").every((label) => HOST_LABEL.test(label))) {
    throw new InputError("host is invalid");
  }
  return host;
}

export function normalizePath(input: unknown, includeQuery = false): string {
  if (typeof input !== "string") throw new InputError("path must be a string");
  let path = input.trim();
  if (!path) path = "/";
  if (/[\u0000-\u001f\u007f]/.test(path) || path.length > 2048 || path.startsWith("//")) {
    throw new InputError("path is invalid");
  }
  if (!path.startsWith("/")) path = `/${path}`;
  const hashIndex = path.indexOf("#");
  if (hashIndex >= 0) path = path.slice(0, hashIndex);
  if (!includeQuery) {
    const queryIndex = path.indexOf("?");
    if (queryIndex >= 0) path = path.slice(0, queryIndex);
  }
  if (!path) path = "/";
  if (path.length > 1024) throw new InputError("normalized path is too long");
  return path;
}

export function parseTarget(input: {
  url?: unknown;
  host?: unknown;
  path?: unknown;
  includeQuery?: unknown;
}): { host: string; path: string } {
  const includeQuery = input.includeQuery === true;
  if (typeof input.url === "string" && input.url.trim()) {
    let url: URL;
    try {
      url = new URL(input.url);
    } catch {
      throw new InputError("url must be an absolute HTTP(S) URL");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new InputError("url must use HTTP or HTTPS");
    }
    return {
      host: normalizeHost(url.hostname),
      path: normalizePath(`${url.pathname}${includeQuery ? url.search : ""}`, includeQuery),
    };
  }
  return {
    host: normalizeHost(input.host),
    path: normalizePath(input.path ?? "/", includeQuery),
  };
}

export function parseNonNegativeInteger(input: unknown, name: string): number {
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 0) {
    throw new InputError(`${name} must be a non-negative safe integer`);
  }
  return input;
}
