export interface PageRecord {
  host: string;
  path: string;
  views: number;
  createdAt: number;
  updatedAt: number;
  lastViewedAt: number | null;
}

export interface HostRecord {
  host: string;
  views: number;
  pages: number;
  updatedAt: number;
}

export interface Summary {
  views: number;
  pages: number;
  hosts: number;
  updatedAt: number | null;
}

export interface PageListOptions {
  host?: string;
  search?: string;
  page: number;
  pageSize: number;
  sort: "views" | "path" | "updated";
  order: "asc" | "desc";
}

export interface PageListResult {
  items: PageRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CounterStore {
  initialize(): Promise<void>;
  increment(host: string, path: string, now: number): Promise<PageRecord>;
  getPage(host: string, path: string): Promise<PageRecord | null>;
  getSiteViews(host: string): Promise<number>;
  getSummary(): Promise<Summary>;
  listHosts(): Promise<HostRecord[]>;
  listPages(options: PageListOptions): Promise<PageListResult>;
  setViews(host: string, path: string, views: number, now: number): Promise<PageRecord>;
}

export interface D1Result<T = Record<string, unknown>> {
  results?: T[];
  success: boolean;
}

export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}

export interface D1DatabaseLike {
  prepare(sql: string): D1Statement;
  batch<T = Record<string, unknown>>(statements: D1Statement[]): Promise<D1Result<T>[]>;
}

export interface RuntimeBindings {
  DB?: D1DatabaseLike;
  ADMIN_PASSWORD?: string;
  ALLOWED_HOSTS?: string;
  PUBLIC_API_TOKEN?: string;
  TURSO_DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
  SESSION_TTL_HOURS?: string;
  ALLOW_NO_ORIGIN?: string;
  TRUST_PROXY?: string;
  NODE_ENV?: string;
}
