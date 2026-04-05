import "server-only";

import { queryAll, queryFirst } from "@/lib/db";
import type { DashboardStats } from "@/lib/types";
import { toNumber } from "@/lib/utils";

export async function getDashboardStats(): Promise<DashboardStats> {
  const accounts = await queryFirst<{
    total: number | string;
    available: number | string;
    bound: number | string;
    unknown: number | string;
    disabled: number | string;
    banned: number | string;
  }>(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN stock_status = 'available' AND check_status = 'ok' THEN 1 ELSE 0 END) AS available,
      SUM(CASE WHEN stock_status = 'bound' THEN 1 ELSE 0 END) AS bound,
      SUM(CASE WHEN check_status = 'unknown' THEN 1 ELSE 0 END) AS unknown,
      SUM(CASE WHEN stock_status = 'disabled' THEN 1 ELSE 0 END) AS disabled,
      SUM(CASE WHEN check_status = 'banned' THEN 1 ELSE 0 END) AS banned
    FROM accounts
  `);

  const cards = await queryFirst<{
    total: number | string;
    inventory: number | string;
    issued: number | string;
    used: number | string;
  }>(`
    SELECT
      COUNT(*) AS total,
      SUM(
        CASE
          WHEN cards.delivered_at IS NULL
            AND NOT EXISTS(
              SELECT 1
              FROM bindings
              WHERE bindings.card_id = cards.id
            ) THEN 1
          ELSE 0
        END
      ) AS inventory,
      SUM(
        CASE
          WHEN cards.delivered_at IS NOT NULL
            AND NOT EXISTS(
              SELECT 1
              FROM bindings
              WHERE bindings.card_id = cards.id
            ) THEN 1
          ELSE 0
        END
      ) AS issued,
      (
        SELECT COUNT(DISTINCT card_id)
        FROM bindings
      ) AS used
    FROM cards
  `);

  const today = await queryFirst<{
    redeemCount: number | string;
    replaceCount: number | string;
  }>(`
    SELECT
      SUM(CASE WHEN kind = 'redeem' AND date(created_at, '+8 hours') = date('now', '+8 hours') THEN 1 ELSE 0 END) AS redeemCount,
      SUM(CASE WHEN kind = 'replace' AND date(created_at, '+8 hours') = date('now', '+8 hours') THEN 1 ELSE 0 END) AS replaceCount
    FROM bindings
  `);

  const todayDelivery = await queryFirst<{
    externalDeliveryCount: number | string;
  }>(`
    SELECT
      COALESCE(
        SUM(
          CASE
            WHEN delivered_at IS NOT NULL
              AND date(delivered_at, '+8 hours') = date('now', '+8 hours') THEN 1
            ELSE 0
          END
        ),
        0
      ) AS externalDeliveryCount
    FROM cards
  `);

  const pools = await queryAll<{
    pool_code: string;
    total: number | string;
    available: number | string;
    bound: number | string;
    unknown: number | string;
    disabled: number | string;
    banned: number | string;
  }>(`
    SELECT
      pool_code,
      COUNT(*) AS total,
      SUM(CASE WHEN stock_status = 'available' AND check_status = 'ok' THEN 1 ELSE 0 END) AS available,
      SUM(CASE WHEN stock_status = 'bound' THEN 1 ELSE 0 END) AS bound,
      SUM(CASE WHEN check_status = 'unknown' THEN 1 ELSE 0 END) AS unknown,
      SUM(CASE WHEN stock_status = 'disabled' THEN 1 ELSE 0 END) AS disabled,
      SUM(CASE WHEN check_status = 'banned' THEN 1 ELSE 0 END) AS banned
    FROM accounts
    GROUP BY pool_code
    ORDER BY pool_code ASC
  `);

  return {
    accounts: {
      total: toNumber(accounts?.total),
      available: toNumber(accounts?.available),
      bound: toNumber(accounts?.bound),
      unknown: toNumber(accounts?.unknown),
      disabled: toNumber(accounts?.disabled),
      banned: toNumber(accounts?.banned),
    },
    cards: {
      total: toNumber(cards?.total),
      inventory: toNumber(cards?.inventory),
      issued: toNumber(cards?.issued),
      used: toNumber(cards?.used),
    },
    today: {
      redeemCount: toNumber(today?.redeemCount),
      replaceCount: toNumber(today?.replaceCount),
      externalDeliveryCount: toNumber(todayDelivery?.externalDeliveryCount),
    },
    pools: pools.map((item) => ({
      poolCode: item.pool_code,
      total: toNumber(item.total),
      available: toNumber(item.available),
      bound: toNumber(item.bound),
      unknown: toNumber(item.unknown),
      disabled: toNumber(item.disabled),
      banned: toNumber(item.banned),
    })),
  };
}
