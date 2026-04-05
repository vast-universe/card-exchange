import "server-only";

import {
  claimAvailableAccount,
  disableAccount,
  markAccountBanned,
  markAccountBound,
  replaceAccountPayloadRaw,
  setAccountCheckStatus,
  releaseAccount,
} from "@/lib/accounts";
import {
  acquireCardLock,
  backfillCardWarrantyFromBindings,
  findCardByCode,
  initializeCardWarranty,
  incrementAftersaleUsed,
  releaseCardLock,
} from "@/lib/cards";
import {
  allocateAccountsToCard,
  getActiveAccountsForCard,
  hasAccountsAllocated,
  replaceAccount,
  getAllAccountsForCard,
} from "@/lib/card-account-pool";
import { execute, queryFirst } from "@/lib/db";
import { checkKiroAccountLive } from "@/lib/kiro-portal";
import type { ActiveBindingRecord, BindingKind, CardRecord } from "@/lib/types";
import { AppError, nowIso } from "@/lib/utils";

async function getActiveBinding(cardId: number) {
  return queryFirst<ActiveBindingRecord>(
    `
      SELECT
        bindings.id AS binding_id,
        bindings.card_id AS card_id,
        cards.pool_code AS card_pool_code,
        cards.aftersale_limit AS aftersale_limit,
        cards.aftersale_used AS aftersale_used,
        cards.warranty_hours AS warranty_hours,
        cards.warranty_started_at AS warranty_started_at,
        cards.warranty_expires_at AS warranty_expires_at,
        accounts.id AS account_id,
        accounts.payload_raw AS payload_raw,
        accounts.check_status AS check_status,
        accounts.stock_status AS stock_status
      FROM bindings
      INNER JOIN cards ON cards.id = bindings.card_id
      INNER JOIN accounts ON accounts.id = bindings.account_id
      WHERE bindings.card_id = ?
        AND bindings.status = 'active'
      LIMIT 1
    `,
    [cardId],
  );
}

async function createBinding(
  cardId: number,
  accountId: number,
  kind: BindingKind,
) {
  const binding = await queryFirst<{ id: number }>(
    `
      INSERT INTO bindings (card_id, account_id, kind, status, created_at)
      VALUES (?, ?, ?, 'active', ?)
      RETURNING id
    `,
    [cardId, accountId, kind, nowIso()],
  );

  if (!binding) {
    throw new AppError("绑定关系创建失败。", 500);
  }

  return binding.id;
}

async function endBinding(bindingId: number) {
  await execute(
    `
      UPDATE bindings
      SET status = 'ended', ended_at = ?
      WHERE id = ?
    `,
    [nowIso(), bindingId],
  );
}

async function reactivateBinding(bindingId: number) {
  await execute(
    `
      UPDATE bindings
      SET status = 'active', ended_at = NULL
      WHERE id = ?
    `,
    [bindingId],
  );
}

async function getCardByCodeOrThrow(cardCode: string) {
  const normalizedCode = cardCode.trim();

  if (!normalizedCode) {
    throw new AppError("请输入卡密。");
  }

  const card = await findCardByCode(normalizedCode);
  if (!card) {
    throw new AppError("卡密无效。", 404);
  }

  if (card.status === "disabled") {
    throw new AppError("卡密已被禁用。", 403);
  }

  return card;
}

function shouldDisableUnknownCandidate(message: string | null) {
  const detail = message?.trim() ?? "";

  return (
    detail.startsWith("账号原文") ||
    detail.includes("缺少 refresh_token") ||
    detail.includes("缺少 clientId") ||
    detail.includes("缺少 clientSecret")
  );
}

async function claimVerifiedAvailableAccount(poolCode: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = await claimAvailableAccount(poolCode);
    if (!candidate) {
      return null;
    }

    const liveCheck = await checkKiroAccountLive(
      poolCode,
      candidate.payload_raw,
    );

    if (liveCheck.payloadRaw !== candidate.payload_raw) {
      await replaceAccountPayloadRaw(candidate.id, liveCheck.payloadRaw);
      candidate.payload_raw = liveCheck.payloadRaw;
    }

    if (!liveCheck.supported) {
      return candidate;
    }

    if (liveCheck.runtimeStatus === "ok") {
      if (candidate.check_status !== "ok") {
        await setAccountCheckStatus(candidate.id, "ok");
      }

      return candidate;
    }

    if (liveCheck.runtimeStatus === "banned") {
      await markAccountBanned(candidate.id);
      continue;
    }

    if (liveCheck.runtimeStatus === "invalid") {
      await disableAccount(candidate.id);
      await setAccountCheckStatus(candidate.id, "unknown");
      continue;
    }

    if (shouldDisableUnknownCandidate(liveCheck.message)) {
      await disableAccount(candidate.id);
      await setAccountCheckStatus(candidate.id, "unknown");
      continue;
    }

    await releaseAccount(candidate.id);
    throw new AppError(
      liveCheck.message ?? "当前账号状态暂时无法确认，请稍后再试。",
      409,
    );
  }

  return null;
}

function getWarrantySnapshot(input: {
  warrantyHours: number;
  warrantyStartedAt: string | null;
  warrantyExpiresAt: string | null;
}) {
  if (input.warrantyHours <= 0) {
    return {
      warrantyHours: input.warrantyHours,
      warrantyStartedAt: input.warrantyStartedAt,
      warrantyExpiresAt: input.warrantyExpiresAt,
      warrantyExpired: true,
      warrantyStatusText: "无质保",
    };
  }

  if (!input.warrantyStartedAt || !input.warrantyExpiresAt) {
    return {
      warrantyHours: input.warrantyHours,
      warrantyStartedAt: input.warrantyStartedAt,
      warrantyExpiresAt: input.warrantyExpiresAt,
      warrantyExpired: false,
      warrantyStatusText: "待开始",
    };
  }

  const expiresAtMs = new Date(input.warrantyExpiresAt).getTime();

  if (Number.isNaN(expiresAtMs)) {
    return {
      warrantyHours: input.warrantyHours,
      warrantyStartedAt: input.warrantyStartedAt,
      warrantyExpiresAt: input.warrantyExpiresAt,
      warrantyExpired: false,
      warrantyStatusText: "待确认",
    };
  }

  if (expiresAtMs <= Date.now()) {
    return {
      warrantyHours: input.warrantyHours,
      warrantyStartedAt: input.warrantyStartedAt,
      warrantyExpiresAt: input.warrantyExpiresAt,
      warrantyExpired: true,
      warrantyStatusText: "已过保",
    };
  }

  const hoursLeft = Math.max(
    1,
    Math.ceil((expiresAtMs - Date.now()) / (60 * 60 * 1000)),
  );

  return {
    warrantyHours: input.warrantyHours,
    warrantyStartedAt: input.warrantyStartedAt,
    warrantyExpiresAt: input.warrantyExpiresAt,
    warrantyExpired: false,
    warrantyStatusText: `剩余 ${hoursLeft} 小时`,
  };
}

export async function redeemCardByCode(cardCode: string) {
  const card = await getCardByCodeOrThrow(cardCode);

  const locked = await acquireCardLock(card.id);
  if (!locked) {
    throw new AppError("卡密正在处理中，请稍后重试。", 409);
  }

  try {
    // Check if accounts are already allocated (unified for both single and multi-account)
    const hasAccounts = await hasAccountsAllocated(card.id);

    if (hasAccounts) {
      // Return existing accounts
      const accounts = await getActiveAccountsForCard(card.id);
      
      // For single-account cards (account_quantity = 1), return legacy format
      if (card.account_quantity === 1 && accounts.length === 1) {
        return {
          payloadRaw: accounts[0].payload_raw,
          reused: true,
        };
      }
      
      // For multi-account cards, return new format
      return {
        accountQuantity: card.account_quantity,
        reused: true,
        accounts: accounts.map((acc) => ({
          position: acc.position,
          status: acc.status,
          checkStatus: acc.check_status,
          payload: JSON.parse(acc.payload_raw),
        })),
      };
    }

    // Lazy allocation: allocate accounts on first redeem
    const accountQuantity = card.account_quantity;

    // Check if enough accounts are available
    const availableCount = await queryFirst<{ count: number }>(
      `
        SELECT COUNT(*) AS count
        FROM accounts
        WHERE pool_code = ?
          AND stock_status = 'available'
      `,
      [card.pool_code],
    );

    const available = availableCount?.count ?? 0;

    if (available < accountQuantity) {
      throw new AppError(
        `当前可用账号不足，需要 ${accountQuantity} 个，仅剩 ${available} 个，请联系管理员补充账号。`,
        409,
      );
    }

    // Allocate accounts in parallel for better performance
    const allocatedAccounts: Array<{
      id: number;
      payload_raw: string;
      check_status: string;
    }> = [];

    try {
      // Parallel allocation with concurrency limit
      const BATCH_SIZE = 5; // Process 5 accounts at a time
      
      for (let i = 0; i < accountQuantity; i += BATCH_SIZE) {
        const batchSize = Math.min(BATCH_SIZE, accountQuantity - i);
        const batchPromises = Array.from({ length: batchSize }, () =>
          claimVerifiedAvailableAccount(card.pool_code)
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        for (let j = 0; j < batchResults.length; j += 1) {
          const account = batchResults[j];
          
          if (!account) {
            throw new AppError(
              `账号分配失败，已分配 ${i + j} / ${accountQuantity} 个账号。`,
              409,
            );
          }
          
          allocatedAccounts.push(account);
        }
      }

      // Add all accounts to card_account_pool
      await allocateAccountsToCard({
        cardId: card.id,
        accountIds: allocatedAccounts.map((acc) => acc.id),
      });

      // Initialize warranty
      await initializeCardWarranty({
        cardId: card.id,
        warrantyHours: card.warranty_hours,
        startedAt: nowIso(),
      });

      // For single-account cards, return legacy format
      if (accountQuantity === 1) {
        return {
          payloadRaw: allocatedAccounts[0].payload_raw,
          reused: false,
        };
      }

      // For multi-account cards, return new format
      return {
        accountQuantity: card.account_quantity,
        reused: false,
        accounts: allocatedAccounts.map((acc, index) => ({
          position: index + 1,
          status: "active" as const,
          checkStatus: acc.check_status,
          payload: JSON.parse(acc.payload_raw),
        })),
      };
    } catch (error) {
      // Rollback: release all allocated accounts
      for (const account of allocatedAccounts) {
        await releaseAccount(account.id);
      }
      throw error;
    }
  } finally {
    await releaseCardLock(card.id);
  }
}

export async function resolveCardActionByCode(cardCode: string) {
  const card = await getCardByCodeOrThrow(cardCode);
  
  // Check if card has accounts allocated (unified check for both single and multi-account cards)
  const hasAccounts = await hasAccountsAllocated(card.id);

  if (!hasAccounts) {
    const redeemResult = await redeemCardByCode(cardCode);

    return {
      mode: "redeem" as const,
      ...redeemResult,
    };
  }

  const supportResult = await getSupportSnapshot(cardCode);

  return {
    mode: "support" as const,
    ...supportResult,
  };
}

async function getMultiAccountSupportSnapshot(card: CardRecord) {
  // Check if accounts are allocated
  const hasAccounts = await hasAccountsAllocated(card.id);

  if (!hasAccounts) {
    throw new AppError("这张卡还没有绑定账号，请先去兑换。", 404);
  }

  // Get all accounts (including replaced ones for history)
  const allAccounts = await getAllAccountsForCard(card.id);
  const activeAccounts = allAccounts.filter((acc) => acc.status === "active");

  // Check warranty
  let warrantyStartedAt = card.warranty_started_at;
  let warrantyExpiresAt = card.warranty_expires_at;

  const warranty = getWarrantySnapshot({
    warrantyHours: card.warranty_hours,
    warrantyStartedAt,
    warrantyExpiresAt,
  });

  // Live check all active accounts
  const checkResults = await Promise.all(
    activeAccounts.map(async (acc) => {
      const liveCheck = await checkKiroAccountLive(card.pool_code, acc.payload_raw);

      // Update payload if changed
      if (liveCheck.payloadRaw !== acc.payload_raw) {
        await replaceAccountPayloadRaw(acc.account_id, liveCheck.payloadRaw);
        acc.payload_raw = liveCheck.payloadRaw;
      }

      // Update check status if supported
      let checkStatus = acc.check_status;
      if (liveCheck.supported) {
        checkStatus = liveCheck.checkStatus;
        if (checkStatus !== acc.check_status) {
          await setAccountCheckStatus(acc.account_id, checkStatus);
          acc.check_status = checkStatus;
        }
      }

      return {
        account: acc,
        checkStatus,
        liveCheck,
      };
    }),
  );

  // Count check results
  const checkResult = {
    total: activeAccounts.length,
    ok: checkResults.filter((r) => r.checkStatus === "ok").length,
    banned: checkResults.filter((r) => r.checkStatus === "banned").length,
    unknown: checkResults.filter((r) => r.checkStatus === "unknown").length,
  };

  // Auto-replace banned accounts
  const bannedAccounts = checkResults.filter((r) => r.checkStatus === "banned");
  const aftersaleLeft = Math.max(0, card.aftersale_limit - card.aftersale_used);

  let replaced = false;
  let replacedCount = 0;

  if (bannedAccounts.length > 0 && aftersaleLeft >= bannedAccounts.length && !warranty.warrantyExpired) {
    // Auto-replace all banned accounts
    for (const bannedResult of bannedAccounts) {
      try {
        const replacement = await claimVerifiedAvailableAccount(card.pool_code);
        if (!replacement) {
          break; // No more available accounts
        }

        // Replace the account
        const newPosition = await replaceAccount({
          cardId: card.id,
          oldPosition: bannedResult.account.position,
          newAccountId: replacement.id,
        });

        // Disable old account
        await disableAccount(bannedResult.account.account_id);

        // Increment aftersale used
        await incrementAftersaleUsed(card.id);

        replaced = true;
        replacedCount += 1;

        // Update the account in allAccounts
        bannedResult.account.status = "replaced";
        bannedResult.account.replaced_at = nowIso();
        bannedResult.account.replaced_by_position = newPosition;

        // Add new account to allAccounts
        allAccounts.push({
          id: 0, // Not important for response
          card_id: card.id,
          account_id: replacement.id,
          position: newPosition,
          status: "active",
          created_at: nowIso(),
          replaced_at: null,
          replaced_by_position: null,
          payload_raw: replacement.payload_raw,
          check_status: replacement.check_status,
        });
      } catch (error) {
        console.error("Failed to replace account:", error);
        break; // Stop replacing on error
      }
    }
  }

  // Build response
  const accounts = allAccounts.map((acc) => {
    const result: any = {
      position: acc.position,
      status: acc.status,
      checkStatus: acc.check_status,
    };

    if (acc.status === "active") {
      result.payload = JSON.parse(acc.payload_raw);
    }

    if (acc.status === "replaced") {
      result.replacedAt = acc.replaced_at;
      result.replacedByPosition = acc.replaced_by_position;
    }

    // Check if this is a replacement account
    const replacedAccount = allAccounts.find(
      (a) => a.status === "replaced" && a.replaced_by_position === acc.position,
    );
    if (replacedAccount) {
      result.isReplacement = true;
      result.replacedPosition = replacedAccount.position;
    }

    return result;
  });

  return {
    accountQuantity: card.account_quantity,
    replaced,
    replacedCount,
    checkResult,
    accounts,
    warranty: {
      hours: warranty.warrantyHours,
      startedAt: warranty.warrantyStartedAt,
      expiresAt: warranty.warrantyExpiresAt,
      expired: warranty.warrantyExpired,
      statusText: warranty.warrantyStatusText,
    },
    aftersale: {
      limit: card.aftersale_limit,
      used: card.aftersale_used + replacedCount,
      remaining: Math.max(0, card.aftersale_limit - card.aftersale_used - replacedCount),
    },
  };
}

export async function getSupportSnapshot(cardCode: string) {
  const card = await getCardByCodeOrThrow(cardCode);

  // Check if accounts are allocated (unified check)
  const hasAccounts = await hasAccountsAllocated(card.id);

  if (!hasAccounts) {
    throw new AppError("这张卡还没有绑定账号，请先去兑换。", 404);
  }

  // Get all accounts (including replaced ones for history)
  const allAccounts = await getAllAccountsForCard(card.id);
  const activeAccounts = allAccounts.filter((acc) => acc.status === "active");

  // Check warranty
  let warrantyStartedAt = card.warranty_started_at;
  let warrantyExpiresAt = card.warranty_expires_at;

  // Backfill warranty if needed
  if (!warrantyStartedAt || !warrantyExpiresAt) {
    const initializedWarranty = await backfillCardWarrantyFromBindings(
      card.id,
      card.warranty_hours,
    );

    warrantyStartedAt = initializedWarranty?.startedAt ?? warrantyStartedAt;
    warrantyExpiresAt = initializedWarranty?.expiresAt ?? warrantyExpiresAt;
  }

  const warranty = getWarrantySnapshot({
    warrantyHours: card.warranty_hours,
    warrantyStartedAt,
    warrantyExpiresAt,
  });

  // For single-account cards, return legacy format
  if (card.account_quantity === 1 && activeAccounts.length === 1) {
    const account = activeAccounts[0];
    
    // Live check the account
    const liveCheck = await checkKiroAccountLive(card.pool_code, account.payload_raw);

    let payloadRaw = account.payload_raw;
    if (liveCheck.payloadRaw !== account.payload_raw) {
      await replaceAccountPayloadRaw(account.account_id, liveCheck.payloadRaw);
      payloadRaw = liveCheck.payloadRaw;
    }

    let checkStatus = account.check_status;
    if (liveCheck.supported) {
      checkStatus = liveCheck.checkStatus;

      if (checkStatus !== account.check_status) {
        await setAccountCheckStatus(account.account_id, checkStatus);
      }
    }

    const aftersaleLeft = Math.max(0, card.aftersale_limit - card.aftersale_used);

    return {
      payloadRaw,
      checkStatus,
      aftersaleLeft,
      canReplace:
        checkStatus === "banned" &&
        aftersaleLeft > 0 &&
        !warranty.warrantyExpired,
      checkSource: liveCheck.supported ? "live" : "stored",
      statusDetail: liveCheck.message,
      quota: liveCheck.quota,
      warrantyHours: warranty.warrantyHours,
      warrantyStartedAt: warranty.warrantyStartedAt,
      warrantyExpiresAt: warranty.warrantyExpiresAt,
      warrantyExpired: warranty.warrantyExpired,
      warrantyStatusText: warranty.warrantyStatusText,
    };
  }

  // For multi-account cards, return new format with batch check
  // Live check all active accounts
  const checkResults = await Promise.all(
    activeAccounts.map(async (acc) => {
      const liveCheck = await checkKiroAccountLive(card.pool_code, acc.payload_raw);

      // Update payload if changed
      if (liveCheck.payloadRaw !== acc.payload_raw) {
        await replaceAccountPayloadRaw(acc.account_id, liveCheck.payloadRaw);
        acc.payload_raw = liveCheck.payloadRaw;
      }

      // Update check status if supported
      let checkStatus = acc.check_status;
      if (liveCheck.supported) {
        checkStatus = liveCheck.checkStatus;
        if (checkStatus !== acc.check_status) {
          await setAccountCheckStatus(acc.account_id, checkStatus);
          acc.check_status = checkStatus;
        }
      }

      return {
        account: acc,
        checkStatus,
        liveCheck,
      };
    }),
  );

  // Count check results
  const checkResult = {
    total: activeAccounts.length,
    ok: checkResults.filter((r) => r.checkStatus === "ok").length,
    banned: checkResults.filter((r) => r.checkStatus === "banned").length,
    unknown: checkResults.filter((r) => r.checkStatus === "unknown").length,
  };

  // Auto-replace banned accounts
  const bannedAccounts = checkResults.filter((r) => r.checkStatus === "banned");
  const aftersaleLeft = Math.max(0, card.aftersale_limit - card.aftersale_used);

  let replaced = false;
  let replacedCount = 0;

  if (bannedAccounts.length > 0 && aftersaleLeft >= bannedAccounts.length && !warranty.warrantyExpired) {
    // Auto-replace all banned accounts
    for (const bannedResult of bannedAccounts) {
      try {
        const replacement = await claimVerifiedAvailableAccount(card.pool_code);
        if (!replacement) {
          break; // No more available accounts
        }

        // Replace the account
        const newPosition = await replaceAccount({
          cardId: card.id,
          oldPosition: bannedResult.account.position,
          newAccountId: replacement.id,
        });

        // Disable old account
        await disableAccount(bannedResult.account.account_id);

        // Increment aftersale used
        await incrementAftersaleUsed(card.id);

        replaced = true;
        replacedCount += 1;

        // Update the account in allAccounts
        bannedResult.account.status = "replaced";
        bannedResult.account.replaced_at = nowIso();
        bannedResult.account.replaced_by_position = newPosition;

        // Add new account to allAccounts
        allAccounts.push({
          id: 0, // Not important for response
          card_id: card.id,
          account_id: replacement.id,
          position: newPosition,
          status: "active",
          created_at: nowIso(),
          replaced_at: null,
          replaced_by_position: null,
          payload_raw: replacement.payload_raw,
          check_status: replacement.check_status,
        });
      } catch (error) {
        console.error("Failed to replace account:", error);
        break; // Stop replacing on error
      }
    }
  }

  // Build response
  const accounts = allAccounts.map((acc) => {
    const result: any = {
      position: acc.position,
      status: acc.status,
      checkStatus: acc.check_status,
    };

    if (acc.status === "active") {
      result.payload = JSON.parse(acc.payload_raw);
    }

    if (acc.status === "replaced") {
      result.replacedAt = acc.replaced_at;
      result.replacedByPosition = acc.replaced_by_position;
    }

    // Check if this is a replacement account
    const replacedAccount = allAccounts.find(
      (a) => a.status === "replaced" && a.replaced_by_position === acc.position,
    );
    if (replacedAccount) {
      result.isReplacement = true;
      result.replacedPosition = replacedAccount.position;
    }

    return result;
  });

  return {
    accountQuantity: card.account_quantity,
    replaced,
    replacedCount,
    checkResult,
    accounts,
    warranty: {
      hours: warranty.warrantyHours,
      startedAt: warranty.warrantyStartedAt,
      expiresAt: warranty.warrantyExpiresAt,
      expired: warranty.warrantyExpired,
      statusText: warranty.warrantyStatusText,
    },
    aftersale: {
      limit: card.aftersale_limit,
      used: card.aftersale_used + replacedCount,
      remaining: Math.max(0, card.aftersale_limit - card.aftersale_used - replacedCount),
    },
  };
}

export async function replaceCardAccount(cardCode: string) {
  const card = await getCardByCodeOrThrow(cardCode);

  const locked = await acquireCardLock(card.id);
  if (!locked) {
    throw new AppError("卡密正在处理中，请稍后重试。", 409);
  }

  try {
    const activeBinding = await getActiveBinding(card.id);
    if (!activeBinding) {
      throw new AppError("当前没有可售后的绑定账号。", 404);
    }

    const liveCheck = await checkKiroAccountLive(
      activeBinding.card_pool_code,
      activeBinding.payload_raw,
    );

    if (liveCheck.payloadRaw !== activeBinding.payload_raw) {
      await replaceAccountPayloadRaw(activeBinding.account_id, liveCheck.payloadRaw);
      activeBinding.payload_raw = liveCheck.payloadRaw;
    }

    if (liveCheck.supported && liveCheck.checkStatus !== activeBinding.check_status) {
      await setAccountCheckStatus(activeBinding.account_id, liveCheck.checkStatus);
      activeBinding.check_status = liveCheck.checkStatus;
    }

    if (activeBinding.check_status !== "banned") {
      throw new AppError("当前账号还没有被标记为封禁。", 409);
    }

    const aftersaleLeft = card.aftersale_limit - card.aftersale_used;
    if (aftersaleLeft <= 0) {
      throw new AppError("售后次数已经用完。", 409);
    }

    let warrantyStartedAt = card.warranty_started_at;
    let warrantyExpiresAt = card.warranty_expires_at;

    if (!warrantyStartedAt || !warrantyExpiresAt) {
      const initializedWarranty = await backfillCardWarrantyFromBindings(
        card.id,
        card.warranty_hours,
      );

      warrantyStartedAt = initializedWarranty?.startedAt ?? warrantyStartedAt;
      warrantyExpiresAt = initializedWarranty?.expiresAt ?? warrantyExpiresAt;
    }

    const warranty = getWarrantySnapshot({
      warrantyHours: card.warranty_hours,
      warrantyStartedAt,
      warrantyExpiresAt,
    });

    if (warranty.warrantyExpired) {
      throw new AppError("质保时间已过，不能再换号。", 409);
    }

    const replacement = await claimVerifiedAvailableAccount(card.pool_code);
    if (!replacement) {
      throw new AppError("当前没有可更换的新账号。", 409);
    }

    try {
      await endBinding(activeBinding.binding_id);
      let replacementBindingId: number | null = null;
      let previousAccountDisabled = false;

      try {
        replacementBindingId = await createBinding(
          card.id,
          replacement.id,
          "replace",
        );
      } catch (error) {
        await reactivateBinding(activeBinding.binding_id);
        await releaseAccount(replacement.id);
        throw error;
      }

      try {
        await disableAccount(activeBinding.account_id);
        previousAccountDisabled = true;
        await incrementAftersaleUsed(card.id);
      } catch (error) {
        if (replacementBindingId) {
          await endBinding(replacementBindingId);
        }
        if (previousAccountDisabled) {
          await markAccountBound(activeBinding.account_id);
        }
        await reactivateBinding(activeBinding.binding_id);
        await releaseAccount(replacement.id);
        throw error;
      }
    } catch (error) {
      await releaseAccount(replacement.id);
      throw error;
    }

    return {
      payloadRaw: replacement.payload_raw,
      aftersaleLeft: aftersaleLeft - 1,
    };
  } finally {
    await releaseCardLock(card.id);
  }
}
