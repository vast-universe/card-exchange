import "server-only";

import { ensureAccountTypeExists } from "@/lib/account-types";
import { execute, executeBatch, queryAll, queryFirst } from "@/lib/db";
import { buildAccountDedupKey } from "@/lib/payload";
import type {
  AdminAccountListItem,
  AccountCheckStatus,
  AccountRecord,
  PaginatedResult,
  AccountStockStatus,
} from "@/lib/types";
import {
  AppError,
  chunkArray,
  clampInt,
  escapeSqlLike,
  nowIso,
  toNumber,
} from "@/lib/utils";

function parseJsonOrThrow(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError(
      "JSON 格式不正确，请上传 JSON 数组、单个 JSON 对象或 JSONL。",
    );
  }
}

function skipWhitespace(text: string, start: number) {
  let index = start;

  while (index < text.length && /\s/.test(text[index] ?? "")) {
    index += 1;
  }

  return index;
}

function consumeJsonString(text: string, start: number) {
  let index = start + 1;

  while (index < text.length) {
    const current = text[index];

    if (current === "\\") {
      index += 2;
      continue;
    }

    if (current === '"') {
      return index + 1;
    }

    index += 1;
  }

  throw new AppError("JSON 数组格式不正确。");
}

function consumeNestedJson(
  text: string,
  start: number,
  openChar: "{" | "[",
  closeChar: "}" | "]",
) {
  let depth = 0;
  let index = start;

  while (index < text.length) {
    const current = text[index];

    if (current === '"') {
      index = consumeJsonString(text, index);
      continue;
    }

    if (current === openChar) {
      depth += 1;
      index += 1;
      continue;
    }

    if (current === closeChar) {
      depth -= 1;
      index += 1;

      if (depth === 0) {
        return index;
      }

      continue;
    }

    index += 1;
  }

  throw new AppError("JSON 数组格式不正确。");
}

function consumePrimitiveJson(text: string, start: number) {
  let index = start;

  while (index < text.length) {
    const current = text[index];

    if (current === "," || current === "]" || /\s/.test(current ?? "")) {
      break;
    }

    index += 1;
  }

  return index;
}

function consumeJsonValue(text: string, start: number) {
  const current = text[start];

  if (!current) {
    throw new AppError("JSON 数组格式不正确。");
  }

  if (current === '"') {
    return consumeJsonString(text, start);
  }

  if (current === "{") {
    return consumeNestedJson(text, start, "{", "}");
  }

  if (current === "[") {
    return consumeNestedJson(text, start, "[", "]");
  }

  return consumePrimitiveJson(text, start);
}

function extractTopLevelArrayItems(text: string) {
  const payloads: string[] = [];
  let index = skipWhitespace(text, 0);

  if (text[index] !== "[") {
    throw new AppError("JSON 内容必须是数组。");
  }

  index += 1;

  while (index < text.length) {
    index = skipWhitespace(text, index);

    if (text[index] === "]") {
      return payloads;
    }

    const start = index;
    index = consumeJsonValue(text, start);
    const payload = text.slice(start, index);

    parseJsonOrThrow(payload);
    payloads.push(payload);

    index = skipWhitespace(text, index);

    if (text[index] === ",") {
      index += 1;
      continue;
    }

    if (text[index] === "]") {
      return payloads;
    }

    throw new AppError("JSON 数组格式不正确。");
  }

  throw new AppError("JSON 数组格式不正确。");
}

export function parseAccountUpload(text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new AppError("上传内容不能为空。");
  }

  if (trimmed.startsWith("[")) {
    const parsed = parseJsonOrThrow(trimmed);
    if (!Array.isArray(parsed)) {
      throw new AppError("JSON 内容必须是数组。");
    }

    const payloads = extractTopLevelArrayItems(trimmed);

    if (payloads.length === 0) {
      throw new AppError("没有识别到可导入的账号记录。");
    }

    return {
      format: "json" as const,
      payloads,
    };
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed = parseJsonOrThrow(trimmed);

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new AppError("JSON 对象格式不正确。");
      }

      return {
        format: "json" as const,
        payloads: [trimmed],
      };
    } catch (error) {
      if (
        error instanceof AppError &&
        error.message !==
          "JSON 格式不正确，请上传 JSON 数组、单个 JSON 对象或 JSONL。"
      ) {
        throw error;
      }
    }
  }

  const payloads = text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      parseJsonOrThrow(line);
      return line;
    });

  if (payloads.length === 0) {
    throw new AppError("没有识别到可导入的账号记录。");
  }

  return {
    format: "jsonl" as const,
    payloads,
  };
}

function normalizeAccountPayloadRaw(payloadRaw: string) {
  return payloadRaw.trim();
}

function dedupeAccountPayloads(payloads: string[]) {
  const uniquePayloads: string[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (const rawPayload of payloads) {
    const payload = normalizeAccountPayloadRaw(rawPayload);

    if (!payload) {
      continue;
    }

    const dedupKey = buildAccountDedupKey(payload);
    if (seen.has(dedupKey)) {
      skipped += 1;
      continue;
    }

    seen.add(dedupKey);
    uniquePayloads.push(payload);
  }

  return {
    payloads: uniquePayloads,
    skipped,
  };
}

async function listExistingAccountDedupKeys(
  poolCode: string,
) {
  const rows = await queryAll<{ payload_raw: string }>(
    `
      SELECT payload_raw
      FROM accounts
      WHERE pool_code = ?
    `,
    [poolCode],
  );
  const existing = new Set<string>();

  for (const row of rows) {
    const payloadRaw = normalizeAccountPayloadRaw(row.payload_raw);
    if (!payloadRaw) {
      continue;
    }

    existing.add(buildAccountDedupKey(payloadRaw));
  }

  return existing;
}

async function findExistingAccountByPayload(
  poolCode: string,
  payloadRaw: string,
) {
  const accounts = await queryAll<AccountRecord>(
    `
      SELECT id, pool_code, payload_raw, stock_status, check_status, created_at
      FROM accounts
      WHERE pool_code = ?
    `,
    [poolCode],
  );
  const targetKey = buildAccountDedupKey(payloadRaw);

  return (
    accounts.find(
      (account) =>
        buildAccountDedupKey(normalizeAccountPayloadRaw(account.payload_raw)) ===
        targetKey,
    ) ?? null
  );
}

export async function insertAccounts(input: {
  poolCode: string;
  payloads: string[];
  checkStatus: AccountCheckStatus;
}) {
  const poolCode = await ensureAccountTypeExists(input.poolCode);

  if (input.payloads.length === 0) {
    throw new AppError("没有可写入的账号数据。");
  }

  const deduped = dedupeAccountPayloads(input.payloads);
  if (deduped.payloads.length === 0) {
    return {
      imported: 0,
      skipped: deduped.skipped,
    };
  }

  const existingDedupKeys = await listExistingAccountDedupKeys(poolCode);
  const pendingPayloads = deduped.payloads.filter(
    (payload) => !existingDedupKeys.has(buildAccountDedupKey(payload)),
  );

  let imported = 0;
  const skipped = deduped.skipped + deduped.payloads.length - pendingPayloads.length;

  for (const batch of chunkArray(pendingPayloads, 100)) {
    const createdAt = nowIso();
    await executeBatch(
      batch.map((payload) => ({
        sql: `
          INSERT INTO accounts (pool_code, payload_raw, stock_status, check_status, created_at)
          VALUES (?, ?, 'available', ?, ?)
        `,
        bindings: [poolCode, payload, input.checkStatus, createdAt],
      })),
    );
    imported += batch.length;
  }

  return {
    imported,
    skipped,
  };
}

export async function createAccount(input: {
  poolCode: string;
  payloadRaw: string;
  checkStatus: AccountCheckStatus;
  stockStatus: AccountStockStatus;
}) {
  const poolCode = await ensureAccountTypeExists(input.poolCode);
  const payloadRaw = normalizeAccountPayloadRaw(input.payloadRaw);

  if (!payloadRaw) {
    throw new AppError("账号原文不能为空。");
  }

  const existingAccount = await findExistingAccountByPayload(poolCode, payloadRaw);
  if (existingAccount) {
    throw new AppError("该账号已存在，无需重复添加。", 409);
  }

  const createdAt = nowIso();
  const account = await queryFirst<AccountRecord>(
    `
      INSERT INTO accounts (
        pool_code,
        payload_raw,
        stock_status,
        check_status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
      RETURNING id, pool_code, payload_raw, stock_status, check_status, created_at
    `,
    [
      poolCode,
      payloadRaw,
      input.stockStatus,
      input.checkStatus,
      createdAt,
    ],
  );

  if (!account) {
    throw new AppError("创建账号失败。", 500);
  }

  return account;
}

export async function listRecentAccounts(limit = 80) {
  return queryAll<AccountRecord>(
    `
      SELECT id, pool_code, payload_raw, stock_status, check_status, created_at
      FROM accounts
      ORDER BY id DESC
      LIMIT ?
    `,
    [limit],
  );
}

function buildAdminAccountsWhere(input: {
  query?: string;
  poolCode?: string;
  stockStatus?: AccountStockStatus | "all";
  checkStatus?: AccountCheckStatus | "all";
}) {
  const clauses: string[] = [];
  const bindings: unknown[] = [];
  const query = input.query?.trim() ?? "";
  const poolCode = input.poolCode?.trim() ?? "";

  if (query) {
    const pattern = `%${escapeSqlLike(query)}%`;
    clauses.push(
      "(accounts.pool_code LIKE ? ESCAPE '\\' OR accounts.payload_raw LIKE ? ESCAPE '\\' OR CAST(accounts.id AS TEXT) = ?)",
    );
    bindings.push(pattern, pattern, query);
  }

  if (poolCode) {
    clauses.push("accounts.pool_code = ?");
    bindings.push(poolCode);
  }

  if (input.stockStatus && input.stockStatus !== "all") {
    clauses.push("accounts.stock_status = ?");
    bindings.push(input.stockStatus);
  }

  if (input.checkStatus && input.checkStatus !== "all") {
    clauses.push("accounts.check_status = ?");
    bindings.push(input.checkStatus);
  }

  return {
    where: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    bindings,
  };
}

async function getAdminAccountRow(accountId: number) {
  return queryFirst<AdminAccountListItem>(
    `
      SELECT
        accounts.id,
        accounts.pool_code,
        accounts.payload_raw,
        accounts.stock_status,
        accounts.check_status,
        accounts.created_at,
        active_bindings.card_id AS active_card_id,
        active_bindings.kind AS active_binding_kind,
        CASE
          WHEN EXISTS(
            SELECT 1
            FROM bindings all_bindings
            WHERE all_bindings.account_id = accounts.id
          ) THEN 1
          ELSE 0
        END AS has_bindings
      FROM accounts
      LEFT JOIN bindings active_bindings
        ON active_bindings.account_id = accounts.id
       AND active_bindings.status = 'active'
      WHERE accounts.id = ?
      LIMIT 1
    `,
    [accountId],
  );
}

export async function getAdminAccountById(accountId: number) {
  const normalizedId = toNumber(accountId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new AppError("账号不存在。", 404);
  }

  const account = await getAdminAccountRow(normalizedId);
  if (!account) {
    throw new AppError("账号不存在。", 404);
  }

  return account;
}

export async function listAdminAccounts(input: {
  query?: string;
  poolCode?: string;
  stockStatus?: AccountStockStatus | "all";
  checkStatus?: AccountCheckStatus | "all";
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminAccountListItem>> {
  const pageSize = clampInt(input.pageSize ?? 20, 1, 100, 20);
  const page = clampInt(input.page ?? 1, 1, 10_000, 1);
  const offset = (page - 1) * pageSize;
  const filter = buildAdminAccountsWhere(input);

  const totalRow = await queryFirst<{ count: number | string }>(
    `
      SELECT COUNT(*) AS count
      FROM accounts
      ${filter.where}
    `,
    filter.bindings,
  );

  const items = await queryAll<AdminAccountListItem>(
    `
      SELECT
        accounts.id,
        accounts.pool_code,
        accounts.payload_raw,
        accounts.stock_status,
        accounts.check_status,
        accounts.created_at,
        active_bindings.card_id AS active_card_id,
        active_bindings.kind AS active_binding_kind,
        CASE
          WHEN EXISTS(
            SELECT 1
            FROM bindings all_bindings
            WHERE all_bindings.account_id = accounts.id
          ) THEN 1
          ELSE 0
        END AS has_bindings
      FROM accounts
      LEFT JOIN bindings active_bindings
        ON active_bindings.account_id = accounts.id
       AND active_bindings.status = 'active'
      ${filter.where}
      ORDER BY accounts.id DESC
      LIMIT ?
      OFFSET ?
    `,
    [...filter.bindings, pageSize, offset],
  );

  return {
    items,
    total: toNumber(totalRow?.count),
    page,
    pageSize,
  };
}

export async function claimAvailableAccount(poolCode: string) {
  // 使用 UPDATE ... RETURNING 确保原子性
  // 在 D1 中，这个操作是原子的，不会有两个请求获取到同一个账号
  const account = await queryFirst<AccountRecord>(
    `
      UPDATE accounts
      SET stock_status = 'bound'
      WHERE id = (
        SELECT id
        FROM accounts
        WHERE pool_code = ?
          AND stock_status = 'available'
          AND check_status = 'ok'
        ORDER BY id ASC
        LIMIT 1
      )
      RETURNING id, pool_code, payload_raw, stock_status, check_status, created_at
    `,
    [poolCode],
  );

  // 如果成功分配，记录日志
  if (account) {
    console.log(
      `[claimAvailableAccount] 成功分配账号: accountId=${account.id}, poolCode=${poolCode}`
    );
  }

  return account;
}

export async function releaseAccount(accountId: number) {
  console.log(`[releaseAccount] 释放账号: accountId=${accountId}`);
  
  await execute(
    `
      UPDATE accounts
      SET stock_status = 'available'
      WHERE id = ?
        AND check_status = 'ok'
    `,
    [accountId],
  );
}

export async function disableAccount(accountId: number) {
  await execute(
    `
      UPDATE accounts
      SET stock_status = 'disabled'
      WHERE id = ?
    `,
    [accountId],
  );
}

export async function setAccountCheckStatus(
  accountId: number,
  checkStatus: AccountCheckStatus,
) {
  await execute(
    `
      UPDATE accounts
      SET check_status = ?
      WHERE id = ?
    `,
    [checkStatus, accountId],
  );
}

export async function markAccountBanned(accountId: number) {
  await execute(
    `
      UPDATE accounts
      SET check_status = 'banned',
          stock_status = 'disabled'
      WHERE id = ?
    `,
    [accountId],
  );
}

export async function replaceAccountPayloadRaw(
  accountId: number,
  payloadRaw: string,
) {
  await execute(
    `
      UPDATE accounts
      SET payload_raw = ?
      WHERE id = ?
    `,
    [payloadRaw, accountId],
  );
}

export async function markAccountBound(accountId: number) {
  await execute(
    `
      UPDATE accounts
      SET stock_status = 'bound'
      WHERE id = ?
    `,
    [accountId],
  );
}

export async function updateAccountStatus(input: {
  accountId: number;
  checkStatus: AccountCheckStatus;
  stockStatus: AccountStockStatus;
}) {
  const account = await queryFirst<AccountRecord>(
    `
      SELECT id, pool_code, payload_raw, stock_status, check_status, created_at
      FROM accounts
      WHERE id = ?
    `,
    [input.accountId],
  );

  if (!account) {
    throw new AppError("账号不存在。", 404);
  }

  await execute(
    `
      UPDATE accounts
      SET check_status = ?, stock_status = ?
      WHERE id = ?
    `,
    [input.checkStatus, input.stockStatus, input.accountId],
  );
}

export async function updateAccount(input: {
  accountId: number;
  poolCode: string;
  payloadRaw: string;
  checkStatus: AccountCheckStatus;
  stockStatus: AccountStockStatus;
}) {
  const accountId = toNumber(input.accountId);
  const account = await getAdminAccountById(accountId);

  const poolCode = await ensureAccountTypeExists(input.poolCode);
  const payloadRaw = input.payloadRaw.trim();

  if (!payloadRaw) {
    throw new AppError("账号原文不能为空。");
  }

  if (account.active_card_id) {
    if (poolCode !== account.pool_code || payloadRaw !== account.payload_raw) {
      throw new AppError("绑定中的账号不能修改池子或原文。", 409);
    }

    if (input.stockStatus !== account.stock_status) {
      throw new AppError("绑定中的账号不能修改库存状态。", 409);
    }
  }

  await execute(
    `
      UPDATE accounts
      SET pool_code = ?,
          payload_raw = ?,
          check_status = ?,
          stock_status = ?
      WHERE id = ?
    `,
    [
      poolCode,
      payloadRaw,
      input.checkStatus,
      input.stockStatus,
      accountId,
    ],
  );
}

export async function deleteAccount(accountId: number) {
  const normalizedId = toNumber(accountId);
  const account = await getAdminAccountById(normalizedId);

  if (account.active_card_id) {
    throw new AppError("当前账号还绑定着卡密，不能删除。", 409);
  }

  if (account.has_bindings > 0) {
    throw new AppError("当前账号已有绑定历史，不能删除。", 409);
  }

  await execute(
    `
      DELETE FROM accounts
      WHERE id = ?
    `,
    [normalizedId],
  );
}
