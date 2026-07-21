import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createClient, type Client } from "@libsql/client";
import { createApp } from "../src/app";
import { isHostAllowed } from "../src/config";
import { LibsqlStore } from "../src/storage/libsql";
import type { RuntimeBindings } from "../src/types";
import { normalizeHost, normalizePath, parseTarget } from "../src/validation";

const bindings: RuntimeBindings = {
  ADMIN_PASSWORD: "correct-horse-battery-staple",
  ALLOWED_HOSTS: "example.com,*.example.com",
  PUBLIC_API_TOKEN: "read-only-test-token",
  ALLOW_NO_ORIGIN: "false",
};

let client: Client;
let app: ReturnType<typeof createApp>;

before(async () => {
  client = createClient({ url: "file::memory:" });
  const store = new LibsqlStore(client);
  await store.initialize();
  app = createApp({ store });
});

after(() => client.close());

async function json(response: Response) {
  return (await response.json()) as {
    ok: boolean;
    data?: Record<string, unknown>;
    error?: { code: string; message: string };
  };
}

async function login(): Promise<string> {
  const response = await app.request(
    "https://counter.test/admin/api/login",
    {
      method: "POST",
      headers: { Origin: "https://counter.test", "Content-Type": "application/json" },
      body: JSON.stringify({ password: bindings.ADMIN_PASSWORD }),
    },
    bindings,
  );
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie?.includes("HttpOnly"));
  assert.ok(cookie?.includes("SameSite=Strict"));
  return cookie!.split(";")[0]!;
}

test("normalizes and validates counter targets", () => {
  assert.equal(normalizeHost("EXAMPLE.COM."), "example.com");
  assert.equal(normalizePath("posts/hello?utm=x"), "/posts/hello");
  assert.deepEqual(parseTarget({ url: "https://blog.example.com/a?q=1" }), {
    host: "blog.example.com",
    path: "/a",
  });
  assert.equal(isHostAllowed("blog.example.com", bindings.ALLOWED_HOSTS!.split(",")), true);
  assert.equal(isHostAllowed("notexample.com", bindings.ALLOWED_HOSTS!.split(",")), false);
  assert.equal(isHostAllowed("localhost", ["example.com"]), true);
  assert.equal(isHostAllowed("theme.localhost", ["example.com"]), true);
  assert.equal(isHostAllowed("127.24.0.1", ["example.com"]), true);
  assert.equal(isHostAllowed("[::1]", ["example.com"]), true);
  assert.equal(isHostAllowed("192.168.1.1", ["example.com"]), false);
  assert.throws(() => normalizeHost("bad host"));
  assert.throws(() => normalizePath("//evil.example/path"));
});

test("serves the dashboard and embeddable script with security headers", async () => {
  const dashboard = await app.request("https://counter.test/admin", {}, bindings);
  assert.equal(dashboard.status, 200);
  assert.match(await dashboard.text(), /Nanocount/);
  assert.match(dashboard.headers.get("content-security-policy") ?? "", /default-src 'none'/);

  const favicon = await app.request("https://counter.test/favicon.svg", {}, bindings);
  assert.equal(favicon.status, 200);
  assert.match(favicon.headers.get("content-type") ?? "", /image\/svg\+xml/);
  assert.match(await favicon.text(), /<svg[^>]+viewBox="0 0 512 512"/);

  const script = await app.request("https://counter.test/nano.js", {}, bindings);
  assert.equal(script.status, 200);
  assert.equal(script.headers.get("access-control-allow-origin"), "*");
  assert.match(await script.text(), /data-nanocount-page/);
});

test("rejects forged tracking origins and disallowed hosts", async () => {
  const loopback = await app.request(
    "https://counter.test/api/v1/hit",
    { method: "POST", headers: { Origin: "http://127.0.0.1:4000" }, body: JSON.stringify({ host: "127.0.0.1", path: "/theme-preview" }) },
    bindings,
  );
  assert.equal(loopback.status, 201);

  const forged = await app.request(
    "https://counter.test/api/v1/hit",
    { method: "POST", headers: { Origin: "https://evil.test" }, body: JSON.stringify({ host: "example.com", path: "/" }) },
    bindings,
  );
  assert.equal(forged.status, 403);
  assert.equal((await json(forged)).error?.code, "origin_mismatch");

  const disallowed = await app.request(
    "https://counter.test/api/v1/hit",
    { method: "POST", headers: { Origin: "https://evil.test" }, body: JSON.stringify({ host: "evil.test", path: "/" }) },
    bindings,
  );
  assert.equal(disallowed.status, 403);
  assert.equal((await json(disallowed)).error?.code, "host_not_allowed");
});

test("increments atomically and exposes token-protected read APIs", async () => {
  for (let index = 0; index < 2; index += 1) {
    const response = await app.request(
      "https://counter.test/api/v1/hit",
      {
        method: "POST",
        headers: { Origin: "https://example.com" },
        body: JSON.stringify({ host: "example.com", path: "/guide?source=test" }),
      },
      bindings,
    );
    assert.equal(response.status, 201);
  }

  const anonymous = await app.request("https://counter.test/api/v1/count?host=example.com&path=/guide", {}, bindings);
  assert.equal(anonymous.status, 401);

  const count = await app.request(
    "https://counter.test/api/v1/count?host=example.com&path=/guide",
    { headers: { Authorization: `Bearer ${bindings.PUBLIC_API_TOKEN}` } },
    bindings,
  );
  assert.equal(count.status, 200);
  const payload = await json(count);
  assert.equal(payload.data?.pageViews, 2);
  assert.equal(payload.data?.siteViews, 2);
});

test("uses a signed session and protects count mutations with same-origin checks", async () => {
  const cookie = await login();
  const session = await app.request(
    "https://counter.test/admin/api/session",
    { headers: { Cookie: cookie } },
    bindings,
  );
  assert.equal((await json(session)).data?.authenticated, true);

  const csrf = await app.request(
    "https://counter.test/admin/api/pages",
    {
      method: "PATCH",
      headers: { Cookie: cookie, Origin: "https://evil.test", "Content-Type": "application/json" },
      body: JSON.stringify({ host: "example.com", path: "/guide", views: 42 }),
    },
    bindings,
  );
  assert.equal(csrf.status, 403);

  const update = await app.request(
    "https://counter.test/admin/api/pages",
    {
      method: "PATCH",
      headers: { Cookie: cookie, Origin: "https://counter.test", "Content-Type": "application/json" },
      body: JSON.stringify({ host: "example.com", path: "/guide", views: 42 }),
    },
    bindings,
  );
  assert.equal(update.status, 200);
  assert.equal((await json(update)).data?.views, 42);

  const searchablePath = "/2026/06/23/fall-in-love-with-you-until-the-end-of-life";
  const searchable = await app.request(
    "https://counter.test/admin/api/pages",
    {
      method: "PATCH",
      headers: { Cookie: cookie, Origin: "https://counter.test", "Content-Type": "application/json" },
      body: JSON.stringify({ host: "example.com", path: searchablePath, views: 7 }),
    },
    bindings,
  );
  assert.equal(searchable.status, 200);

  const longSearch = await app.request(
    `https://counter.test/admin/api/pages?page=1&pageSize=10&search=${encodeURIComponent(searchablePath.slice(1))}`,
    { headers: { Cookie: cookie } },
    bindings,
  );
  const longSearchPayload = await json(longSearch);
  assert.equal(longSearch.status, 200);
  assert.equal(longSearchPayload.data?.total, 1);
  assert.equal((longSearchPayload.data?.items as Array<{ path: string }>)[0]?.path, searchablePath);

  const literalPath = "/Special%_Page";
  const literal = await app.request(
    "https://counter.test/admin/api/pages",
    {
      method: "PATCH",
      headers: { Cookie: cookie, Origin: "https://counter.test", "Content-Type": "application/json" },
      body: JSON.stringify({ host: "example.com", path: literalPath, views: 3 }),
    },
    bindings,
  );
  assert.equal(literal.status, 200);

  const literalSearch = await app.request(
    `https://counter.test/admin/api/pages?page=1&pageSize=10&search=${encodeURIComponent("special%_page")}`,
    { headers: { Cookie: cookie } },
    bindings,
  );
  const literalSearchPayload = await json(literalSearch);
  assert.equal(literalSearch.status, 200);
  assert.equal(literalSearchPayload.data?.total, 1);
  assert.equal((literalSearchPayload.data?.items as Array<{ path: string }>)[0]?.path, literalPath);

  const pages = await app.request(
    "https://counter.test/admin/api/pages?host=example.com&page=1&pageSize=10",
    { headers: { Cookie: cookie } },
    bindings,
  );
  const payload = await json(pages);
  assert.equal(pages.status, 200);
  assert.equal(payload.data?.total, 3);
  assert.equal((payload.data?.items as Array<{ views: number }>)[0]?.views, 42);
});
