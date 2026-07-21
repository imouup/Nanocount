import type { HostRecord, PageRecord, Summary } from "../types";

export interface DatabaseRow {
  host?: unknown;
  path?: unknown;
  views?: unknown;
  pages?: unknown;
  hosts?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  last_viewed_at?: unknown;
}

function numberValue(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export function toPage(row: DatabaseRow): PageRecord {
  return {
    host: String(row.host ?? ""),
    path: String(row.path ?? "/"),
    views: numberValue(row.views),
    createdAt: numberValue(row.created_at),
    updatedAt: numberValue(row.updated_at),
    lastViewedAt: row.last_viewed_at == null ? null : numberValue(row.last_viewed_at),
  };
}

export function toHost(row: DatabaseRow): HostRecord {
  return {
    host: String(row.host ?? ""),
    views: numberValue(row.views),
    pages: numberValue(row.pages),
    updatedAt: numberValue(row.updated_at),
  };
}

export function toSummary(row: DatabaseRow | undefined): Summary {
  return {
    views: numberValue(row?.views),
    pages: numberValue(row?.pages),
    hosts: numberValue(row?.hosts),
    updatedAt: row?.updated_at == null ? null : numberValue(row.updated_at),
  };
}

export function listQuery(options: {
  host?: string;
  search?: string;
  sort: "views" | "path" | "updated";
  order: "asc" | "desc";
}): { where: string; args: string[]; order: string } {
  const clauses: string[] = [];
  const args: string[] = [];
  if (options.host) {
    clauses.push("host = ?");
    args.push(options.host);
  }
  if (options.search) {
    clauses.push("INSTR(LOWER(path), LOWER(?)) > 0");
    args.push(options.search);
  }
  const columns = { views: "views", path: "path", updated: "updated_at" } as const;
  const direction = options.order === "asc" ? "ASC" : "DESC";
  return {
    where: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "",
    args,
    order: `${columns[options.sort]} ${direction}, host ASC, path ASC`,
  };
}
