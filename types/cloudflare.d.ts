interface D1Result<T = unknown> {
  success: boolean;
  results?: T[];
  meta?: Record<string, unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  raw<T = unknown[]>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1Result>;
}

interface CloudflareEnv {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
  CARD_HASH_SECRET?: string;
  SUPPLY_API_TOKEN?: string;
  TURNSTILE_ENABLED?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
}
