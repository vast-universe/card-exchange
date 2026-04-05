import "server-only";

import {
  ensureAccountTypeExists,
} from "@/lib/account-types";
import { formatAccountTypePrefix } from "@/lib/account-type-format";
import { createCardCode, createRandomToken, hashCardCode } from "@/lib/crypto";
import { execute, executeBatch, queryAll, queryFirst } from "@/lib/db";
import type {
  AdminCardListItem,
  CardRecord,
  CardStatus,
  PaginatedResult,
  RecentCardRecord,
} from "@/lib/types";
import {
  AppError,
  chunkArray,
  clampInt,
  escapeSqlLike,
  nowIso,
  toNumber,
} from "@/lib/utils";

export async function createCards(input: {
  poolCode: string;
  count: number;
  accountQuantity?: number;
  aftersaleLimit: number;
  warrantyHours: number;
}) {
  const poolCode = await ensureAccountTypeExists(input.poolCode);

  if (!Number.isInteger(input.count) || input.count < 1 || input.count > 1000) {
    throw new AppError("一次最多生成 1000 张卡密。");
  }

  const accountQuantity = input.accountQuantity ?? 1;
  if (!Number.isInteger(accountQuantity) || accountQuantity < 1 || accountQuantity > 100) {
    throw new AppError("单个卡密最多支持 100 个账号。");
  }

  if (input.aftersaleLimit < 0 || input.aftersaleLimit > 20) {
    throw new AppError("售后次数范围需要在 0 到 20 之间。");
  }

  if (!Number.isInteger(input.warrantyHours) || input.warrantyHours < 0 || input.warrantyHours > 720) {
    throw new AppError("质保小时范围需要在 0 到 720 之间。");
  }

  const prefix = formatAccountTypePrefix(poolCode);

  const codes: string[] = [];

  for (let index = 0; index < input.count; index += 1) {
    codes.push(createCardCode(prefix));
  }

  for (const batch of chunkArray(codes, 100)) {
    const createdAt = nowIso();
    const prepared = await Promise.all(
      batch.map(async (code) => ({
        sql: `
          INSERT INTO cards (
            code_plain,
            code_hash,
            pool_code,
            account_quantity,
            aftersale_limit,
            aftersale_used,
            warranty_hours,
            status,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, 0, ?, 'normal', ?)
        `,
        bindings: [
          code,
          await hashCardCode(code),
          poolCode,
          accountQuantity,
          input.aftersaleLimit,
          input.warrantyHours,
          createdAt,
        ],
      })),
    );

    await executeBatch(prepared);
  }

  return codes;
}

export async function listRecentCards(limit = 50) {
  return queryAll<RecentCardRecord>(
    `
      SELECT
        id,
        code_plain,
        pool_code,
        delivery_ref,
        delivered_at,
        aftersale_limit,
        aftersale_used,
        status,
        created_at,
        warranty_hours,
        warranty_started_at,
        warranty_expires_at,
        account_quantity
      FROM cards
      ORDER BY id DESC
      LIMIT ?
    `,
    [limit],
  );
}

function buildAdminCardsWhere(input: {
  query?: string;
  poolCode?: string;
  status?: CardStatus | "all";
  usage?: "all" | "unused" | "issued" | "bound" | "used";
}) {
  const clauses: string[] = [];
  const bindings: unknown[] = [];
  const query = input.query?.trim() ?? "";
  const poolCode = input.poolCode?.trim() ?? "";

  if (query) {
    const pattern = `%${escapeSqlLike(query)}%`;
    clauses.push(
      "(cards.pool_code LIKE ? ESCAPE '\\' OR cards.code_plain LIKE ? ESCAPE '\\' OR CAST(cards.id AS TEXT) = ?)",
    );
    bindings.push(pattern, pattern, query);
  }

  if (poolCode) {
    clauses.push("cards.pool_code = ?");
    bindings.push(poolCode);
  }

  if (input.status && input.status !== "all") {
    clauses.push("cards.status = ?");
    bindings.push(input.status);
  }

  if (input.usage === "unused") {
    clauses.push(
      "NOT EXISTS (SELECT 1 FROM bindings used_bindings WHERE used_bindings.card_id = cards.id) AND cards.delivered_at IS NULL",
    );
  }

  if (input.usage === "used") {
    clauses.push(
      "EXISTS (SELECT 1 FROM bindings used_bindings WHERE used_bindings.card_id = cards.id)",
    );
  }

  if (input.usage === "issued") {
    clauses.push(
      "NOT EXISTS (SELECT 1 FROM bindings used_bindings WHERE used_bindings.card_id = cards.id) AND cards.delivered_at IS NOT NULL",
    );
  }

  if (input.usage === "bound") {
    clauses.push(
      "EXISTS (SELECT 1 FROM bindings active_bindings WHERE active_bindings.card_id = cards.id AND active_bindings.status = 'active')",
    );
  }

  return {
    where: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    bindings,
  };
}

async function getAdminCardRow(cardId: number) {
  return queryFirst<AdminCardListItem>(
    `
      SELECT
        cards.id,
        cards.code_plain,
        cards.pool_code,
        cards.delivery_ref,
        cards.delivered_at,
        cards.aftersale_limit,
        cards.aftersale_used,
        cards.warranty_hours,
        cards.warranty_started_at,
        cards.warranty_expires_at,
        cards.status,
        cards.created_at,
        active_bindings.account_id AS active_account_id,
        active_accounts.payload_raw AS active_account_payload_raw,
        active_accounts.check_status AS active_account_check_status,
        CASE
          WHEN EXISTS(
            SELECT 1
            FROM bindings all_bindings
            WHERE all_bindings.card_id = cards.id
          ) THEN 1
          ELSE 0
        END AS has_bindings,
        CASE
          WHEN active_bindings.id IS NULL THEN 0
          ELSE 1
        END AS has_active_binding,
        CASE
          WHEN cards.aftersale_limit - cards.aftersale_used > 0
            THEN cards.aftersale_limit - cards.aftersale_used
          ELSE 0
        END AS aftersale_left
      FROM cards
      LEFT JOIN bindings active_bindings
        ON active_bindings.card_id = cards.id
       AND active_bindings.status = 'active'
      LEFT JOIN accounts active_accounts
        ON active_accounts.id = active_bindings.account_id
      WHERE cards.id = ?
      LIMIT 1
    `,
    [cardId],
  );
}

export async function listAdminCards(input: {
  query?: string;
  poolCode?: string;
  status?: CardStatus | "all";
  usage?: "all" | "unused" | "issued" | "bound" | "used";
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminCardListItem>> {
  const pageSize = clampInt(input.pageSize ?? 20, 1, 100, 20);
  const page = clampInt(input.page ?? 1, 1, 10_000, 1);
  const offset = (page - 1) * pageSize;
  const filter = buildAdminCardsWhere(input);

  const totalRow = await queryFirst<{ count: number | string }>(
    `
      SELECT COUNT(*) AS count
      FROM cards
      ${filter.where}
    `,
    filter.bindings,
  );

  const items = await queryAll<AdminCardListItem>(
    `
      SELECT
        cards.id,
        cards.code_plain,
        cards.pool_code,
        cards.delivery_ref,
        cards.delivered_at,
        cards.aftersale_limit,
        cards.aftersale_used,
        cards.warranty_hours,
        cards.warranty_started_at,
        cards.warranty_expires_at,
        cards.status,
        cards.created_at,
        active_bindings.account_id AS active_account_id,
        active_accounts.payload_raw AS active_account_payload_raw,
        active_accounts.check_status AS active_account_check_status,
        CASE
          WHEN EXISTS(
            SELECT 1
            FROM bindings all_bindings
            WHERE all_bindings.card_id = cards.id
          ) THEN 1
          ELSE 0
        END AS has_bindings,
        CASE
          WHEN active_bindings.id IS NULL THEN 0
          ELSE 1
        END AS has_active_binding,
        CASE
          WHEN cards.aftersale_limit - cards.aftersale_used > 0
            THEN cards.aftersale_limit - cards.aftersale_used
          ELSE 0
        END AS aftersale_left
      FROM cards
      LEFT JOIN bindings active_bindings
        ON active_bindings.card_id = cards.id
       AND active_bindings.status = 'active'
      LEFT JOIN accounts active_accounts
        ON active_accounts.id = active_bindings.account_id
      ${filter.where}
      ORDER BY cards.id DESC
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

export async function findCardByCode(cardCode: string) {
  return queryFirst<CardRecord>(
    `
      SELECT
        id,
        code_plain,
        code_hash,
        pool_code,
        query_token,
        delivery_ref,
        delivered_at,
        aftersale_limit,
        aftersale_used,
        status,
        lock_until,
        created_at,
        warranty_hours,
        warranty_started_at,
        warranty_expires_at,
        account_quantity
      FROM cards
      WHERE code_hash = ?
    `,
    [await hashCardCode(cardCode.trim())],
  );
}

export async function acquireCardLock(cardId: number) {
  const now = nowIso();
  const lockUntil = new Date(Date.now() + 15_000).toISOString();

  const locked = await queryFirst<{ id: number }>(
    `
      UPDATE cards
      SET lock_until = ?
      WHERE id = ?
        AND status = 'normal'
        AND (lock_until IS NULL OR lock_until < ?)
      RETURNING id
    `,
    [lockUntil, cardId, now],
  );

  return Boolean(locked);
}

export async function releaseCardLock(cardId: number) {
  await execute(
    `
      UPDATE cards
      SET lock_until = NULL
      WHERE id = ?
    `,
    [cardId],
  );
}

export async function incrementAftersaleUsed(cardId: number) {
  await execute(
    `
      UPDATE cards
      SET aftersale_used = aftersale_used + 1
      WHERE id = ?
    `,
    [cardId],
  );
}

export async function updateCard(input: {
  cardId: number;
  poolCode: string;
  aftersaleLimit: number;
  warrantyHours: number;
  status: CardStatus;
}) {
  const cardId = toNumber(input.cardId);
  if (!Number.isInteger(cardId) || cardId <= 0) {
    throw new AppError("卡密不存在。", 404);
  }

  const card = await getAdminCardRow(cardId);
  if (!card) {
    throw new AppError("卡密不存在。", 404);
  }

  const poolCode = await ensureAccountTypeExists(input.poolCode);

  const aftersaleLimit = toNumber(input.aftersaleLimit);
  if (!Number.isInteger(aftersaleLimit) || aftersaleLimit < 0 || aftersaleLimit > 20) {
    throw new AppError("售后次数范围需要在 0 到 20 之间。");
  }

  if (aftersaleLimit < card.aftersale_used) {
    throw new AppError("售后上限不能小于已用售后次数。");
  }

  const warrantyHours = toNumber(input.warrantyHours);
  if (!Number.isInteger(warrantyHours) || warrantyHours < 0 || warrantyHours > 720) {
    throw new AppError("质保小时范围需要在 0 到 720 之间。");
  }

  if (card.has_bindings > 0 && poolCode !== card.pool_code) {
    throw new AppError("已有绑定记录的卡密不能修改池子。", 409);
  }

  const warrantyExpiresAt = card.warranty_started_at
    ? warrantyHours <= 0
      ? card.warranty_started_at
      : new Date(
          new Date(card.warranty_started_at).getTime() +
            warrantyHours * 60 * 60 * 1000,
        ).toISOString()
    : null;

  await execute(
    `
      UPDATE cards
      SET pool_code = ?,
          aftersale_limit = ?,
          warranty_hours = ?,
          warranty_expires_at = ?,
          status = ?
      WHERE id = ?
    `,
    [
      poolCode,
      aftersaleLimit,
      warrantyHours,
      warrantyExpiresAt,
      input.status,
      cardId,
    ],
  );
}

export async function initializeCardWarranty(input: {
  cardId: number;
  warrantyHours: number;
  startedAt: string;
}) {
  const expiresAt =
    input.warrantyHours <= 0
      ? input.startedAt
      : new Date(
          new Date(input.startedAt).getTime() + input.warrantyHours * 60 * 60 * 1000,
        ).toISOString();

  await execute(
    `
      UPDATE cards
      SET warranty_started_at = COALESCE(warranty_started_at, ?),
          warranty_expires_at = COALESCE(warranty_expires_at, ?)
      WHERE id = ?
    `,
    [input.startedAt, expiresAt, input.cardId],
  );

  return {
    startedAt: input.startedAt,
    expiresAt,
  };
}

export async function backfillCardWarrantyFromBindings(
  cardId: number,
  warrantyHours: number,
) {
  const firstBinding = await queryFirst<{ created_at: string }>(
    `
      SELECT created_at
      FROM bindings
      WHERE card_id = ?
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [cardId],
  );

  if (!firstBinding) {
    return null;
  }

  return initializeCardWarranty({
    cardId,
    warrantyHours,
    startedAt: firstBinding.created_at,
  });
}

function normalizeDeliveryRef(value: string | null | undefined) {
  return value?.trim().slice(0, 120) ?? "";
}

async function listDeliveredCardsByRef(deliveryRef: string) {
  return queryAll<RecentCardRecord>(
    `
      SELECT
        id,
        code_plain,
        pool_code,
        delivery_ref,
        delivered_at,
        aftersale_limit,
        aftersale_used,
        warranty_hours,
        warranty_started_at,
        warranty_expires_at,
        status,
        created_at,
        account_quantity
      FROM cards
      WHERE delivery_ref = ?
      ORDER BY id ASC
    `,
    [deliveryRef],
  );
}

async function reserveNextCardForDelivery(input: {
  poolCode: string;
  deliveryRef: string;
  deliveredAt: string;
  accountQuantity: number;
}) {
  return queryFirst<RecentCardRecord>(
    `
      UPDATE cards
      SET delivery_ref = ?,
          delivered_at = ?
      WHERE id = (
        SELECT cards.id
        FROM cards
        WHERE cards.pool_code = ?
          AND cards.status = 'normal'
          AND cards.code_plain IS NOT NULL
          AND cards.delivery_ref IS NULL
          AND cards.delivered_at IS NULL
          AND cards.account_quantity = ?
          AND NOT EXISTS(
            SELECT 1
            FROM bindings
            WHERE bindings.card_id = cards.id
          )
          AND NOT EXISTS(
            SELECT 1
            FROM card_account_pool
            WHERE card_account_pool.card_id = cards.id
          )
        ORDER BY cards.id ASC
        LIMIT 1
      )
      RETURNING
        id,
        code_plain,
        pool_code,
        delivery_ref,
        delivered_at,
        aftersale_limit,
        aftersale_used,
        warranty_hours,
        warranty_started_at,
        warranty_expires_at,
        status,
        created_at,
        account_quantity
    `,
    [input.deliveryRef, input.deliveredAt, input.poolCode, input.accountQuantity],
  );
}

async function clearDeliveredCards(input: {
  ids: number[];
  deliveryRef: string;
}) {
  if (input.ids.length === 0) {
    return;
  }

  const placeholders = input.ids.map(() => "?").join(", ");
  await execute(
    `
      UPDATE cards
      SET delivery_ref = NULL,
          delivered_at = NULL
      WHERE delivery_ref = ?
        AND id IN (${placeholders})
    `,
    [input.deliveryRef, ...input.ids],
  );
}

export async function issueCardsForExternal(input: {
  poolCode: string;
  count: number;
  deliveryRef?: string | null;
  warrantyHours?: number;
  orderAmount?: number;
}) {
  const poolCode = await ensureAccountTypeExists(input.poolCode);
  const count = toNumber(input.count);

  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new AppError("单个卡密最多支持 100 个账号。");
  }

  const warrantyHours = input.warrantyHours ?? 168;
  if (!Number.isInteger(warrantyHours) || warrantyHours < 0 || warrantyHours > 720) {
    throw new AppError("质保小时范围需要在 0 到 720 之间。");
  }

  const orderAmount = input.orderAmount ? toNumber(input.orderAmount) : null;

  const providedDeliveryRef = normalizeDeliveryRef(input.deliveryRef);

  if (providedDeliveryRef) {
    const existingCards = await listDeliveredCardsByRef(providedDeliveryRef);

    if (existingCards.length > 0) {
      const allMatchPool = existingCards.every(
        (card) => card.pool_code === poolCode,
      );

      if (!allMatchPool) {
        throw new AppError("该发货单号已绑定到其他账号类型。", 409);
      }

      // For multi-account cards, check if it's exactly 1 card with matching account_quantity
      if (existingCards.length === 1 && existingCards[0].account_quantity === count) {
        return {
          poolCode,
          deliveryRef: providedDeliveryRef,
          reused: true,
          cards: existingCards,
          accountQuantity: count,
        };
      }

      // Legacy: single account cards
      if (existingCards.length === count && existingCards.every(c => c.account_quantity === 1)) {
        return {
          poolCode,
          deliveryRef: providedDeliveryRef,
          reused: true,
          cards: existingCards,
          accountQuantity: 1,
        };
      }

      throw new AppError(
        `该发货单号已返回 ${existingCards.length} 张卡密，本次请求数量不一致。`,
        409,
      );
    }
  }

  const deliveryRef =
    providedDeliveryRef || `API-${poolCode.toUpperCase()}-${createRandomToken(10)}`;
  const deliveredAt = nowIso();
  const issuedCards: RecentCardRecord[] = [];

  // Generate 1 card with N accounts - always create new card for performance
  const accountQuantity = count;
  const aftersaleLimit = count; // Set aftersale limit equal to account quantity

  try {
    // Directly generate a new card for best performance
    const prefix = formatAccountTypePrefix(poolCode);
    const code = createCardCode(prefix);
    const codeHash = await hashCardCode(code);
    const createdAt = nowIso();

    const card = await queryFirst<RecentCardRecord>(
      `
        INSERT INTO cards (
          code_plain,
          code_hash,
          pool_code,
          account_quantity,
          aftersale_limit,
          aftersale_used,
          warranty_hours,
          status,
          created_at,
          delivery_ref,
          delivered_at,
          order_amount
        )
        VALUES (?, ?, ?, ?, ?, 0, ?, 'normal', ?, ?, ?, ?)
        RETURNING
          id,
          code_plain,
          pool_code,
          delivery_ref,
          delivered_at,
          aftersale_limit,
          aftersale_used,
          warranty_hours,
          warranty_started_at,
          warranty_expires_at,
          status,
          created_at,
          account_quantity
      `,
      [
        code,
        codeHash,
        poolCode,
        accountQuantity,
        aftersaleLimit,
        warrantyHours,
        createdAt,
        deliveryRef,
        deliveredAt,
        orderAmount,
      ],
    );

    if (!card) {
      throw new AppError("生成卡密失败。", 500);
    }

    issuedCards.push(card);
  } catch (error) {
    await clearDeliveredCards({
      ids: issuedCards.map((card) => card.id),
      deliveryRef,
    });
    throw error;
  }

  return {
    poolCode,
    deliveryRef,
    reused: false,
    cards: issuedCards,
    accountQuantity,
  };
}

export async function deleteCard(cardId: number) {
  const normalizedId = toNumber(cardId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new AppError("卡密不存在。", 404);
  }

  const card = await getAdminCardRow(normalizedId);
  if (!card) {
    throw new AppError("卡密不存在。", 404);
  }

  if (card.has_bindings > 0) {
    throw new AppError("当前卡密已有兑换记录，不能删除。", 409);
  }

  if (card.delivery_ref) {
    throw new AppError("当前卡密已分配给外部发货单，不能直接删除。", 409);
  }

  await execute(
    `
      DELETE FROM cards
      WHERE id = ?
    `,
    [normalizedId],
  );
}
