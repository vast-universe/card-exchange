import "server-only";

import { execute, executeBatch, queryAll, queryFirst } from "@/lib/db";
import { AppError, nowIso } from "@/lib/utils";

/**
 * Card Account Pool Record
 * Represents the relationship between a card and its accounts
 */
export interface CardAccountPoolRecord {
  id: number;
  card_id: number;
  account_id: number;
  position: number;
  status: "active" | "replaced";
  created_at: string;
  replaced_at: string | null;
  replaced_by_position: number | null;
}

/**
 * Card Account Pool Record with Account Payload
 */
export interface CardAccountPoolWithPayload extends CardAccountPoolRecord {
  payload_raw: string;
  check_status: "ok" | "banned" | "unknown";
}

/**
 * Allocate multiple accounts to a card
 * @param cardId - The card ID
 * @param accountIds - Array of account IDs to allocate
 */
export async function allocateAccountsToCard(input: {
  cardId: number;
  accountIds: number[];
}): Promise<void> {
  if (input.accountIds.length === 0) {
    throw new AppError("账号列表不能为空。", 400);
  }

  console.log(
    `[allocateAccountsToCard] 开始分配: cardId=${input.cardId}, 账号数=${input.accountIds.length}`
  );

  const createdAt = nowIso();
  const statements = input.accountIds.map((accountId, index) => ({
    sql: `
      INSERT INTO card_account_pool (
        card_id,
        account_id,
        position,
        status,
        created_at
      ) VALUES (?, ?, ?, 'active', ?)
    `,
    bindings: [input.cardId, accountId, index + 1, createdAt],
  }));

  try {
    await executeBatch(statements);
    console.log(
      `[allocateAccountsToCard] 分配成功: cardId=${input.cardId}, 账号数=${input.accountIds.length}`
    );
  } catch (error) {
    console.error(
      `[allocateAccountsToCard] 分配失败: cardId=${input.cardId}, 账号数=${input.accountIds.length}`,
      error
    );
    
    // 检查是否是唯一约束冲突
    if (error instanceof Error && error.message?.includes('UNIQUE constraint failed')) {
      throw new AppError(
        "账号分配冲突，可能该账号已被其他卡密使用，请重试。",
        409
      );
    }
    
    throw error;
  }
}

/**
 * Get all active accounts for a card
 * @param cardId - The card ID
 * @returns Array of active account records with payload
 */
export async function getActiveAccountsForCard(
  cardId: number,
): Promise<CardAccountPoolWithPayload[]> {
  return queryAll<CardAccountPoolWithPayload>(
    `
      SELECT
        cap.id,
        cap.card_id,
        cap.account_id,
        cap.position,
        cap.status,
        cap.created_at,
        cap.replaced_at,
        cap.replaced_by_position,
        accounts.payload_raw,
        accounts.check_status
      FROM card_account_pool cap
      INNER JOIN accounts ON accounts.id = cap.account_id
      WHERE cap.card_id = ?
        AND cap.status = 'active'
      ORDER BY cap.position ASC
    `,
    [cardId],
  );
}

/**
 * Get all accounts for a card (including replaced ones)
 * @param cardId - The card ID
 * @returns Array of all account records with payload
 */
export async function getAllAccountsForCard(
  cardId: number,
): Promise<CardAccountPoolWithPayload[]> {
  return queryAll<CardAccountPoolWithPayload>(
    `
      SELECT
        cap.id,
        cap.card_id,
        cap.account_id,
        cap.position,
        cap.status,
        cap.created_at,
        cap.replaced_at,
        cap.replaced_by_position,
        accounts.payload_raw,
        accounts.check_status
      FROM card_account_pool cap
      INNER JOIN accounts ON accounts.id = cap.account_id
      WHERE cap.card_id = ?
      ORDER BY cap.position ASC
    `,
    [cardId],
  );
}

/**
 * Replace an account at a specific position
 * @param cardId - The card ID
 * @param oldPosition - The position of the account to replace
 * @param newAccountId - The new account ID
 * @returns The new position number
 */
export async function replaceAccount(input: {
  cardId: number;
  oldPosition: number;
  newAccountId: number;
}): Promise<number> {
  const now = nowIso();

  // Get next available position
  const nextPosition = await getNextPosition(input.cardId);

  // Mark old account as replaced
  await execute(
    `
      UPDATE card_account_pool
      SET status = 'replaced',
          replaced_at = ?,
          replaced_by_position = ?
      WHERE card_id = ?
        AND position = ?
        AND status = 'active'
    `,
    [now, nextPosition, input.cardId, input.oldPosition],
  );

  // Add new account
  await execute(
    `
      INSERT INTO card_account_pool (
        card_id,
        account_id,
        position,
        status,
        created_at
      ) VALUES (?, ?, ?, 'active', ?)
    `,
    [input.cardId, input.newAccountId, nextPosition, now],
  );

  return nextPosition;
}

/**
 * Get the next available position for a card
 * @param cardId - The card ID
 * @returns The next position number
 */
export async function getNextPosition(cardId: number): Promise<number> {
  const result = await queryFirst<{ max_position: number | null }>(
    `
      SELECT MAX(position) AS max_position
      FROM card_account_pool
      WHERE card_id = ?
    `,
    [cardId],
  );

  return (result?.max_position ?? 0) + 1;
}

/**
 * Check if a card has any accounts allocated
 * @param cardId - The card ID
 * @returns True if the card has accounts, false otherwise
 */
export async function hasAccountsAllocated(cardId: number): Promise<boolean> {
  const result = await queryFirst<{ count: number }>(
    `
      SELECT COUNT(*) AS count
      FROM card_account_pool
      WHERE card_id = ?
    `,
    [cardId],
  );

  return (result?.count ?? 0) > 0;
}
