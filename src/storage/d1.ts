import type {
  CounterStore,
  D1DatabaseLike,
  HostRecord,
  PageListOptions,
  PageListResult,
  PageRecord,
  Summary,
} from "../types";
import { SCHEMA_STATEMENTS } from "./schema";
import { listQuery, toHost, toPage, toSummary, type DatabaseRow } from "./shared";

const PAGE_COLUMNS = "host, path, views, created_at, updated_at, last_viewed_at";

export class D1Store implements CounterStore {
  private initialized?: Promise<void>;

  constructor(private readonly database: D1DatabaseLike) {}

  initialize(): Promise<void> {
    this.initialized ??= this.database
      .batch(SCHEMA_STATEMENTS.map((sql) => this.database.prepare(sql)))
      .then(() => undefined);
    return this.initialized;
  }

  async increment(host: string, path: string, now: number): Promise<PageRecord> {
    await this.initialize();
    const row = await this.database
      .prepare(
        `INSERT INTO pages (host, path, views, created_at, updated_at, last_viewed_at)
        VALUES (?1, ?2, 1, ?3, ?3, ?3)
        ON CONFLICT(host, path) DO UPDATE SET
          views = pages.views + 1,
          updated_at = excluded.updated_at,
          last_viewed_at = excluded.last_viewed_at
        RETURNING ${PAGE_COLUMNS}`,
      )
      .bind(host, path, now)
      .first<DatabaseRow>();
    if (!row) throw new Error("D1 did not return the incremented page");
    return toPage(row);
  }

  async getPage(host: string, path: string): Promise<PageRecord | null> {
    await this.initialize();
    const row = await this.database
      .prepare(`SELECT ${PAGE_COLUMNS} FROM pages WHERE host = ?1 AND path = ?2`)
      .bind(host, path)
      .first<DatabaseRow>();
    return row ? toPage(row) : null;
  }

  async getSiteViews(host: string): Promise<number> {
    await this.initialize();
    const row = await this.database
      .prepare("SELECT COALESCE(SUM(views), 0) AS views FROM pages WHERE host = ?1")
      .bind(host)
      .first<DatabaseRow>();
    return Number(row?.views ?? 0);
  }

  async getSummary(): Promise<Summary> {
    await this.initialize();
    const row = await this.database
      .prepare(
        `SELECT COALESCE(SUM(views), 0) AS views, COUNT(*) AS pages,
        COUNT(DISTINCT host) AS hosts, MAX(updated_at) AS updated_at FROM pages`,
      )
      .first<DatabaseRow>();
    return toSummary(row ?? undefined);
  }

  async listHosts(): Promise<HostRecord[]> {
    await this.initialize();
    const result = await this.database
      .prepare(
        `SELECT host, COALESCE(SUM(views), 0) AS views, COUNT(*) AS pages,
        MAX(updated_at) AS updated_at FROM pages GROUP BY host ORDER BY views DESC, host ASC`,
      )
      .run<DatabaseRow>();
    return (result.results ?? []).map(toHost);
  }

  async listPages(options: PageListOptions): Promise<PageListResult> {
    await this.initialize();
    const query = listQuery(options);
    const offset = (options.page - 1) * options.pageSize;
    const results = await this.database.batch<DatabaseRow>([
      this.database.prepare(`SELECT COUNT(*) AS pages FROM pages${query.where}`).bind(...query.args),
      this.database
        .prepare(`SELECT ${PAGE_COLUMNS} FROM pages${query.where} ORDER BY ${query.order} LIMIT ? OFFSET ?`)
        .bind(...query.args, options.pageSize, offset),
    ]);
    return {
      items: (results[1]?.results ?? []).map(toPage),
      total: Number(results[0]?.results?.[0]?.pages ?? 0),
      page: options.page,
      pageSize: options.pageSize,
    };
  }

  async setViews(host: string, path: string, views: number, now: number): Promise<PageRecord> {
    await this.initialize();
    const row = await this.database
      .prepare(
        `INSERT INTO pages (host, path, views, created_at, updated_at, last_viewed_at)
        VALUES (?1, ?2, ?3, ?4, ?4, NULL)
        ON CONFLICT(host, path) DO UPDATE SET views = excluded.views, updated_at = excluded.updated_at
        RETURNING ${PAGE_COLUMNS}`,
      )
      .bind(host, path, views, now)
      .first<DatabaseRow>();
    if (!row) throw new Error("D1 did not return the updated page");
    return toPage(row);
  }
}
