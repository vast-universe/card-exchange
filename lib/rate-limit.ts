import "server-only";

import { execute, queryFirst } from "@/lib/db";
import { AppError, nowIso } from "@/lib/utils";

const MINUTE_MS = 60 * 1000;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_BLOCK_MS = 30 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

const ACTION_LIMITS = {
  admin_login: {
    windowMs: LOGIN_WINDOW_MS,
    blockMs: LOGIN_BLOCK_MS,
    maxAttempts: LOGIN_MAX_ATTEMPTS,
    blockedMessage: (minutesLeft: number) =>
      `登录失败次数过多，请 ${minutesLeft} 分钟后再试。`,
  },
  public_redeem: {
    windowMs: 1 * MINUTE_MS,
    blockMs: 1 * MINUTE_MS,
    maxAttempts: 30,
    blockedMessage: (minutesLeft: number) =>
      `兑换请求过于频繁，请 ${minutesLeft} 分钟后再试。`,
  },
  public_support_query: {
    windowMs: 1 * MINUTE_MS,
    blockMs: 1 * MINUTE_MS,
    maxAttempts: 30,
    blockedMessage: (minutesLeft: number) =>
      `售后查询过于频繁，请 ${minutesLeft} 分钟后再试。`,
  },
  public_support_replace: {
    windowMs: 1 * MINUTE_MS,
    blockMs: 1 * MINUTE_MS,
    maxAttempts: 30,
    blockedMessage: (minutesLeft: number) =>
      `换号请求过于频繁，请 ${minutesLeft} 分钟后再试。`,
  },
  public_card_submit: {
    windowMs: 1 * MINUTE_MS,
    blockMs: 1 * MINUTE_MS,
    maxAttempts: 30,
    blockedMessage: (minutesLeft: number) =>
      `提交请求过于频繁，请 ${minutesLeft} 分钟后再试。`,
  },
} as const;

type RateLimitAction = keyof typeof ACTION_LIMITS;

type RateLimitRecord = {
  id: number;
  attempts: number;
  window_started_at: string;
  blocked_until: string | null;
};

function normalizeLimiterKey(key: string | null | undefined) {
  const normalized = key?.trim() || "unknown";
  return normalized.slice(0, 120);
}

async function findRateLimitRecord(action: string, limiterKey: string) {
  return queryFirst<RateLimitRecord>(
    `
      SELECT id, attempts, window_started_at, blocked_until
      FROM auth_rate_limits
      WHERE action = ?
        AND limiter_key = ?
      LIMIT 1
    `,
    [action, normalizeLimiterKey(limiterKey)],
  );
}

async function ensureActionAllowed(
  action: RateLimitAction,
  limiterKey: string | null | undefined,
) {
  // 在测试环境中禁用频率限制
  if (process.env.RATE_LIMIT_ENABLED === "false") {
    return;
  }
  
  const config = ACTION_LIMITS[action];
  const normalizedKey = normalizeLimiterKey(limiterKey);
  const record = await findRateLimitRecord(action, normalizedKey);

  if (!record?.blocked_until) {
    return;
  }

  const blockedUntilMs = new Date(record.blocked_until).getTime();

  if (Number.isNaN(blockedUntilMs) || blockedUntilMs <= Date.now()) {
    await clearActionRateLimit(action, normalizedKey);
    return;
  }

  const minutesLeft = Math.max(
    1,
    Math.ceil((blockedUntilMs - Date.now()) / 60_000),
  );

  throw new AppError(config.blockedMessage(minutesLeft), 429);
}

async function recordActionAttempt(
  action: RateLimitAction,
  limiterKey: string | null | undefined,
) {
  const config = ACTION_LIMITS[action];
  const normalizedKey = normalizeLimiterKey(limiterKey);
  const record = await findRateLimitRecord(action, normalizedKey);
  const now = Date.now();
  const updatedAt = nowIso();

  if (!record) {
    await execute(
      `
        INSERT INTO auth_rate_limits (
          action,
          limiter_key,
          attempts,
          window_started_at,
          blocked_until,
          updated_at
        )
        VALUES (?, ?, 1, ?, NULL, ?)
      `,
      [action, normalizedKey, updatedAt, updatedAt],
    );
    return;
  }

  const windowStartedMs = new Date(record.window_started_at).getTime();
  const withinWindow =
    !Number.isNaN(windowStartedMs) && now - windowStartedMs < config.windowMs;

  const attempts = withinWindow ? record.attempts + 1 : 1;
  const windowStartedAt = withinWindow ? record.window_started_at : updatedAt;
  const blockedUntil =
    attempts >= config.maxAttempts
      ? new Date(now + config.blockMs).toISOString()
      : null;

  await execute(
    `
      UPDATE auth_rate_limits
      SET attempts = ?,
          window_started_at = ?,
          blocked_until = ?,
          updated_at = ?
      WHERE id = ?
    `,
    [attempts, windowStartedAt, blockedUntil, updatedAt, record.id],
  );
}

async function clearActionRateLimit(
  action: RateLimitAction,
  limiterKey: string | null | undefined,
) {
  await execute(
    `
      DELETE FROM auth_rate_limits
      WHERE action = ?
        AND limiter_key = ?
    `,
    [action, normalizeLimiterKey(limiterKey)],
  );
}

export async function ensureLoginAllowed(limiterKey: string | null | undefined) {
  await ensureActionAllowed("admin_login", limiterKey);
}

export async function recordLoginFailure(
  limiterKey: string | null | undefined,
) {
  await recordActionAttempt("admin_login", limiterKey);
}

export async function clearLoginRateLimit(
  limiterKey: string | null | undefined,
) {
  await clearActionRateLimit("admin_login", limiterKey);
}

export async function ensurePublicActionAllowed(
  action: "redeem" | "support_query" | "support_replace" | "card_submit",
  limiterKey: string | null | undefined,
) {
  const mappedAction =
    action === "redeem"
      ? "public_redeem"
      : action === "support_query"
        ? "public_support_query"
        : action === "support_replace"
          ? "public_support_replace"
          : "public_card_submit";

  await ensureActionAllowed(mappedAction, limiterKey);
}

export async function recordPublicActionAttempt(
  action: "redeem" | "support_query" | "support_replace" | "card_submit",
  limiterKey: string | null | undefined,
) {
  const mappedAction =
    action === "redeem"
      ? "public_redeem"
      : action === "support_query"
        ? "public_support_query"
        : action === "support_replace"
          ? "public_support_replace"
          : "public_card_submit";

  await recordActionAttempt(mappedAction, limiterKey);
}
