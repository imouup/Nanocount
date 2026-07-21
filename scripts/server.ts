import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { serve } from "@hono/node-server";
import { createClient } from "@libsql/client";
import { createApp } from "../src/app";
import { LibsqlStore } from "../src/storage/libsql";

function loadDotEnv(path = ".env"): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    const key = match?.[1];
    if (!match || !key || key in process.env) continue;
    let value = match[2] ?? "";
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadDotEnv();
const databaseUrl = process.env.DATABASE_URL || "file:data/nanocount.db";
if (databaseUrl.startsWith("file:") && databaseUrl !== "file::memory:") {
  mkdirSync(dirname(resolve(databaseUrl.slice(5))), { recursive: true });
}

async function main(): Promise<void> {
  const store = new LibsqlStore(
    createClient({
      url: process.env.TURSO_DATABASE_URL || databaseUrl,
      ...(process.env.TURSO_AUTH_TOKEN ? { authToken: process.env.TURSO_AUTH_TOKEN } : {}),
    }),
  );
  await store.initialize();

  const port = Math.min(65_535, Math.max(1, Number.parseInt(process.env.PORT || "3000", 10) || 3000));
  const hostname = process.env.HOST || "0.0.0.0";
  serve({ fetch: createApp({ store }).fetch, port, hostname });
  console.log(`Nanocount is listening on http://${hostname}:${port}`);
}

void main();
