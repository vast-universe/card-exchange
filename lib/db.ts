import "server-only";

import { getDb } from "@/lib/env";

export async function queryAll<T>(
  sql: string,
  bindings: unknown[] = [],
): Promise<T[]> {
  const db = await getDb();
  const result = await db.prepare(sql).bind(...bindings).all<T>();
  return result.results ?? [];
}

export async function queryFirst<T>(
  sql: string,
  bindings: unknown[] = [],
): Promise<T | null> {
  const db = await getDb();
  return db.prepare(sql).bind(...bindings).first<T>();
}

export async function execute(sql: string, bindings: unknown[] = []) {
  const db = await getDb();
  return db.prepare(sql).bind(...bindings).run();
}

export async function executeBatch(
  statements: Array<{
    sql: string;
    bindings?: unknown[];
  }>,
) {
  const db = await getDb();
  const prepared = statements.map((statement) =>
    db.prepare(statement.sql).bind(...(statement.bindings ?? [])),
  );

  return db.batch(prepared);
}
