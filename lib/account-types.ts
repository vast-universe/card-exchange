import "server-only";

import { execute, queryAll, queryFirst } from "@/lib/db";
import { formatAccountTypePrefix, normalizeAccountTypeCode } from "@/lib/account-type-format";
import type { AdminAccountTypeListItem, AccountTypeOption } from "@/lib/types";
import { AppError, nowIso, toNumber } from "@/lib/utils";

type AccountTypeRow = {
  id: number;
  code: string;
  created_at: string;
};

export async function listAccountTypes(): Promise<AccountTypeOption[]> {
  const rows = await queryAll<AccountTypeRow>(
    `
      SELECT id, code, created_at
      FROM account_types
      ORDER BY code ASC
    `,
  );

  return rows.map((row) => ({
    id: toNumber(row.id),
    code: row.code,
    prefix: formatAccountTypePrefix(row.code),
    created_at: row.created_at,
  }));
}

export async function listAdminAccountTypes(): Promise<AdminAccountTypeListItem[]> {
  const rows = await queryAll<
    AccountTypeRow & {
      account_count: number | string;
      card_count: number | string;
    }
  >(
    `
      SELECT
        account_types.id,
        account_types.code,
        account_types.created_at,
        (
          SELECT COUNT(*)
          FROM accounts
          WHERE accounts.pool_code = account_types.code
        ) AS account_count,
        (
          SELECT COUNT(*)
          FROM cards
          WHERE cards.pool_code = account_types.code
        ) AS card_count
      FROM account_types
      ORDER BY account_types.code ASC
    `,
  );

  return rows.map((row) => ({
    id: toNumber(row.id),
    code: row.code,
    prefix: formatAccountTypePrefix(row.code),
    created_at: row.created_at,
    account_count: toNumber(row.account_count),
    card_count: toNumber(row.card_count),
  }));
}

export async function ensureAccountTypeExists(code: string) {
  const trimmedCode = code.trim();
  const normalizedCode = normalizeAccountTypeCode(code);
  const lookupCodes = Array.from(
    new Set([trimmedCode, normalizedCode].filter((value) => value.length > 0)),
  );

  if (lookupCodes.length === 0) {
    throw new AppError("请先选择账号类型。");
  }

  const placeholders = lookupCodes.map(() => "?").join(", ");
  const row = await queryFirst<{ id: number; code: string }>(
    `
      SELECT id, code
      FROM account_types
      WHERE code IN (${placeholders})
      ORDER BY CASE
        WHEN code = ? THEN 0
        ELSE 1
      END
      LIMIT 1
    `,
    [...lookupCodes, trimmedCode],
  );

  if (!row) {
    throw new AppError("账号类型不存在，请先在账号管理里配置。", 404);
  }

  return row.code;
}

export async function createAccountType(input: { code: string }) {
  const code = normalizeAccountTypeCode(input.code);

  if (!code) {
    throw new AppError("类型不能为空。");
  }

  if (code.length > 32) {
    throw new AppError("类型长度不能超过 32 个字符。");
  }

  const exists = await queryFirst<{ id: number }>(
    `
      SELECT id
      FROM account_types
      WHERE code = ?
      LIMIT 1
    `,
    [code],
  );

  if (exists) {
    throw new AppError("该类型已存在。", 409);
  }

  await execute(
    `
      INSERT INTO account_types (code, created_at)
      VALUES (?, ?)
    `,
    [code, nowIso()],
  );
}

export async function deleteAccountType(typeId: number) {
  const normalizedId = toNumber(typeId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new AppError("类型不存在。", 404);
  }

  const type = await queryFirst<{ id: number; code: string }>(
    `
      SELECT id, code
      FROM account_types
      WHERE id = ?
      LIMIT 1
    `,
    [normalizedId],
  );

  if (!type) {
    throw new AppError("类型不存在。", 404);
  }

  const usage = await queryFirst<{
    account_count: number | string;
    card_count: number | string;
  }>(
    `
      SELECT
        (
          SELECT COUNT(*)
          FROM accounts
          WHERE pool_code = ?
        ) AS account_count,
        (
          SELECT COUNT(*)
          FROM cards
          WHERE pool_code = ?
        ) AS card_count
    `,
    [type.code, type.code],
  );

  if (toNumber(usage?.account_count) > 0 || toNumber(usage?.card_count) > 0) {
    throw new AppError("该类型已被账号或卡密使用，不能删除。", 409);
  }

  await execute(
    `
      DELETE FROM account_types
      WHERE id = ?
    `,
    [normalizedId],
  );
}
