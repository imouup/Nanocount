export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS pages (
    host TEXT NOT NULL,
    path TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_viewed_at INTEGER,
    PRIMARY KEY (host, path)
  ) WITHOUT ROWID`,
  "CREATE INDEX IF NOT EXISTS idx_pages_host_views ON pages (host, views DESC)",
  "CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON pages (updated_at DESC)",
] as const;
