import type { Client, InStatement } from "@libsql/client";
import type {
  CounterStore,
  HostRecord,
  PageListOptions,
  PageListResult,
  PageRecord,
  Summary,
} from "../types";
import { SCHEMA_STATEMENTS } from "./schema";
import { listQuery, toHost, toPage, toSummary, type DatabaseRow } from "./shared";

const PAGE_COLUMNS = "host, path, views, created_at, updated_at, last_viewed_at";

export class LibsqlStore implements CounterStore {
  private initialized?: Promise<void>;

  constructor(private readonly client: Client) {}

  initialize(): Promise<void> {
    this.initialized ??= this.client
      .batch(SCHEMA_STATEMENTS.map((sql) => ({ sql, args: [] })), "write")
      .then(() => undefined);
    return this.initialized;
  }

  private async execute(statement: InStatement) {
    await this.initialize();
    return this.client.execute(statement);
  }

  async increment(host: string, path: string, now: number): Promise<PageRecord> {
    const result = await this.execute({
      sql: `INSERT INTO pages (host, path, views, created_at, updated_at, last_viewed_at)
        VALUES (?, ?, 1, ?, ?, ?)
        ON CONFLICT(host, path) DO UPDATE SET
          views = pages.views + 1,
          updated_at = excluded.updated_at,
          last_viewed_at = excluded.last_viewed_at
        RETURNING ${PAGE_COLUMNS}`,
      args: [host, path, now, now, now],
    });
    return toPage(result.rows[0] as DatabaseRow);
  }

  async getPage(host: string, path: string): Promise<PageRecord | null> {
    const result = await this.execute({
      sql: `SELECT ${PAGE_COLUMNS} FROM pages WHERE host = ? AND path = ?`,
      args: [host, path],
    });
    return result.rows[0] ? toPage(result.rows[0] as DatabaseRow) : null;
  }

  async getSiteViews(host: string): Promise<number> {
    const result = await this.execute({
      sql: "SELECT COALESCE(SUM(views), 0) AS views FROM pages WHERE host = ?",
      args: [host],
    });
    return Number(result.rows[0]?.views ?? 0);
  }

  async getSummary(): Promise<Summary> {
    const result = await this.execute({
      sql: `SELECT COALESCE(SUM(views), 0) AS views, COUNT(*) AS pages,
        COUNT(DISTINCT host) AS hosts, MAX(updated_at) AS updated_at FROM pages`,
      args: [],
    });
    return toSummary(result.rows[0] as DatabaseRow | undefined);
  }

  async listHosts(): Promise<HostRecord[]> {
    const result = await this.execute({
      sql: `SELECT host, COALESCE(SUM(views), 0) AS views, COUNT(*) AS pages,
        MAX(updated_at) AS updated_at FROM pages GROUP BY host ORDER BY views DESC, host ASC`,
      args: [],
    });
    return result.rows.map((row) => toHost(row as DatabaseRow));
  }

  async listPages(options: PageListOptions): Promise<PageListResult> {
    await this.initialize();
    const query = listQuery(options);
    const offset = (options.page - 1) * options.pageSize;
    const results = await this.client.batch(
      [
        { sql: `SELECT COUNT(*) AS pages FROM pages${query.where}`, args: query.args },
        {
          sql: `SELECT ${PAGE_COLUMNS} FROM pages${query.where} ORDER BY ${query.order} LIMIT ? OFFSET ?`,
          args: [...query.args, options.pageSize, offset],
        },
      ],
      "read",
    );
    return {
      items: results[1]!.rows.map((row) => toPage(row as DatabaseRow)),
      total: Number(results[0]!.rows[0]?.pages ?? 0),
      page: options.page,
      pageSize: options.pageSize,
    };
  }

  async setViews(host: string, path: string, views: number, now: number): Promise<PageRecord> {
    const result = await this.execute({
      sql: `INSERT INTO pages (host, path, views, created_at, updated_at, last_viewed_at)
        VALUES (?, ?, ?, ?, ?, NULL)
        ON CONFLICT(host, path) DO UPDATE SET views = excluded.views, updated_at = excluded.updated_at
        RETURNING ${PAGE_COLUMNS}`,
      args: [host, path, views, now, now],
    });
    return toPage(result.rows[0] as DatabaseRow);
  }
}
