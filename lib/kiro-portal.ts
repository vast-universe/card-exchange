import "server-only";

import { decode, encode } from "cbor-x";

import type { AccountCheckStatus } from "@/lib/types";

const KIRO_WEB_PORTAL_ENDPOINT =
  "https://app.kiro.dev/service/KiroWebPortalService/operation/GetUserUsageAndLimits";

type KiroProvider = "BuilderId" | "Enterprise" | "Github" | "Google";

type JsonRecord = Record<string, unknown>;

export type KiroQuotaSummary = {
  plan: string | null;
  total: number;
  used: number;
  remaining: number;
  percent: number;
  nextResetAt: string | null;
};

export type KiroLiveCheckResult = {
  supported: boolean;
  runtimeStatus: "banned" | "invalid" | "ok" | "unknown";
  checkStatus: AccountCheckStatus;
  message: string | null;
  quota: KiroQuotaSummary | null;
  payloadRaw: string;
  refreshed: boolean;
};

type KiroPayload = {
  root: JsonRecord;
  accessToken: string | null;
  refreshToken: string | null;
  provider: KiroProvider;
  region: string | null;
  clientId: string | null;
  clientSecret: string | null;
  clientIdHash: string | null;
  profileArn: string | null;
  startUrl: string | null;
  machineId: string | null;
};

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

function findStringByKeys(
  value: unknown,
  keys: Set<string>,
  depth = 0,
): string | null {
  if (depth > 4) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findStringByKeys(item, keys, depth + 1);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const [key, item] of Object.entries(record)) {
    if (keys.has(key.toLowerCase()) && typeof item === "string" && item.trim()) {
      return item.trim();
    }
  }

  for (const item of Object.values(record)) {
    const nested = findStringByKeys(item, keys, depth + 1);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function normalizeKiroProvider(value: string | null): KiroProvider {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (normalized.includes("enterprise")) {
    return "Enterprise";
  }

  if (normalized.includes("builder")) {
    return "BuilderId";
  }

  if (normalized.includes("github")) {
    return "Github";
  }

  return "Google";
}

function findTopLevelString(
  record: JsonRecord,
  keys: string[],
) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function extractKiroPayload(payloadRaw: string): KiroPayload | null {
  try {
    const parsed = JSON.parse(payloadRaw) as unknown;
    const root = asRecord(parsed);

    if (!root) {
      return null;
    }

    const provider = normalizeKiroProvider(
      findTopLevelString(root, ["provider", "idp"]) ??
        findStringByKeys(parsed, new Set(["provider", "idp"])),
    );

    return {
      root,
      accessToken:
        findTopLevelString(root, ["accessToken", "access_token"]) ??
        findStringByKeys(parsed, new Set(["access_token", "accesstoken"])),
      refreshToken:
        findTopLevelString(root, ["refreshToken", "refresh_token"]) ??
        findStringByKeys(parsed, new Set(["refresh_token", "refreshtoken"])),
      provider,
      region:
        findTopLevelString(root, ["region"]) ??
        findStringByKeys(parsed, new Set(["region"])),
      clientId:
        findTopLevelString(root, ["clientId", "client_id"]) ??
        findStringByKeys(parsed, new Set(["client_id", "clientid"])),
      clientSecret:
        findTopLevelString(root, ["clientSecret", "client_secret"]) ??
        findStringByKeys(parsed, new Set(["client_secret", "clientsecret"])),
      clientIdHash:
        findTopLevelString(root, ["clientIdHash", "client_id_hash"]) ??
        findStringByKeys(parsed, new Set(["client_id_hash", "clientidhash"])),
      profileArn:
        findTopLevelString(root, ["profileArn", "profile_arn"]) ??
        findStringByKeys(parsed, new Set(["profile_arn", "profilearn"])),
      startUrl:
        findTopLevelString(root, ["startUrl", "start_url"]) ??
        findStringByKeys(parsed, new Set(["start_url", "starturl"])),
      machineId:
        findTopLevelString(root, ["machineId", "machine_id"]) ??
        findStringByKeys(parsed, new Set(["machine_id", "machineid"])),
    };
  } catch {
    return null;
  }
}

function setTopLevelString(
  record: JsonRecord,
  keys: string[],
  nextValue: string | null | undefined,
) {
  if (!nextValue) {
    return;
  }

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      record[key] = nextValue;
      return;
    }
  }

  record[keys[0] ?? "value"] = nextValue;
}

function serializeKiroPayload(payload: KiroPayload) {
  return JSON.stringify(payload.root);
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function parseQuotaSummary(usageData: unknown): KiroQuotaSummary | null {
  const root = asRecord(usageData);
  const breakdownList = Array.isArray(root?.usageBreakdownList)
    ? root.usageBreakdownList
    : [];
  const breakdown = asRecord(breakdownList[0]);

  if (!breakdown) {
    return null;
  }

  const now = Date.now();
  const mainUsed = numberValue(breakdown.currentUsage);
  const mainLimit = numberValue(breakdown.usageLimit);

  const freeTrialInfo = asRecord(breakdown.freeTrialInfo);
  const freeTrialStatus = String(freeTrialInfo?.freeTrialStatus ?? "");
  const freeTrialExpiry = numberValue(freeTrialInfo?.freeTrialExpiry) * 1000;
  const trialActive =
    freeTrialStatus === "ACTIVE" ||
    (freeTrialExpiry > 0 && freeTrialExpiry > now);
  const trialUsed = trialActive ? numberValue(freeTrialInfo?.currentUsage) : 0;
  const trialLimit = trialActive ? numberValue(freeTrialInfo?.usageLimit) : 0;

  const bonuses = Array.isArray(breakdown.bonuses) ? breakdown.bonuses : [];
  let bonusUsed = 0;
  let bonusLimit = 0;

  for (const bonusItem of bonuses) {
    const bonus = asRecord(bonusItem);
    if (!bonus) {
      continue;
    }

    const status = String(bonus.status ?? "");
    const expiresAt = numberValue(bonus.expiresAt) * 1000;
    const isActive =
      status === "ACTIVE" || status === "" || expiresAt === 0 || expiresAt > now;

    if (!isActive) {
      continue;
    }

    bonusUsed += numberValue(bonus.currentUsage);
    bonusLimit += numberValue(bonus.usageLimit);
  }

  const total = mainLimit + trialLimit + bonusLimit;
  const used = mainUsed + trialUsed + bonusUsed;
  const remaining = Math.max(total - used, 0);
  const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const subscriptionInfo = asRecord(root?.subscriptionInfo);
  const nextResetAtUnix = numberValue(root?.nextDateReset);

  return {
    plan:
      typeof subscriptionInfo?.subscriptionTitle === "string"
        ? subscriptionInfo.subscriptionTitle
        : null,
    total,
    used,
    remaining,
    percent,
    nextResetAt:
      nextResetAtUnix > 0
        ? new Date(nextResetAtUnix * 1000).toISOString()
        : null,
  };
}

function errorMessageFromDecoded(decoded: unknown) {
  const record = asRecord(decoded);
  if (!record) {
    return typeof decoded === "string" ? decoded : null;
  }

  return (
    (typeof record.message === "string" && record.message) ||
    (typeof record.Message === "string" && record.Message) ||
    null
  );
}

function parseErrorBody(decoded: unknown) {
  const record = asRecord(decoded);
  if (!record) {
    return {
      type: "",
      reason: "",
      message: errorMessageFromDecoded(decoded),
    };
  }

  return {
    type:
      (typeof record.__type === "string" && record.__type) ||
      (typeof record.type === "string" && record.type) ||
      "",
    reason:
      (typeof record.reason === "string" && record.reason) ||
      (typeof record.code === "string" && record.code) ||
      "",
    message: errorMessageFromDecoded(record),
  };
}

function liveCheckResult(
  runtimeStatus: KiroLiveCheckResult["runtimeStatus"],
  message: string | null,
  payloadRaw: string,
  quota: KiroQuotaSummary | null = null,
  refreshed = false,
): KiroLiveCheckResult {
  return {
    supported: true,
    runtimeStatus,
    checkStatus:
      runtimeStatus === "banned"
        ? "banned"
        : runtimeStatus === "ok"
          ? "ok"
          : "unknown",
    message,
    quota,
    payloadRaw,
    refreshed,
  };
}

function buildDesktopUserAgent(machineId: string | null) {
  return `KiroIDE-0.6.18-${machineId || "cf-worker"}`;
}

async function refreshSocialToken(payload: KiroPayload) {
  if (!payload.refreshToken) {
    throw new Error("账号原文里缺少 refresh_token。");
  }

  const response = await fetch(
    "https://prod.us-east-1.auth.desktop.kiro.dev/refreshToken",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": buildDesktopUserAgent(payload.machineId),
      },
      body: JSON.stringify({
        refreshToken: payload.refreshToken,
      }),
    },
  );

  const text = await response.text();
  let parsed: JsonRecord | null = null;

  try {
    parsed = JSON.parse(text) as JsonRecord;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    throw new Error(
      parsed && typeof parsed.message === "string"
        ? parsed.message
        : text || `刷新失败（${response.status}）。`,
    );
  }

  return {
    accessToken:
      (parsed && typeof parsed.accessToken === "string" && parsed.accessToken) ||
      "",
    refreshToken:
      (parsed && typeof parsed.refreshToken === "string" && parsed.refreshToken) ||
      payload.refreshToken,
    profileArn:
      (parsed && typeof parsed.profileArn === "string" && parsed.profileArn) ||
      payload.profileArn,
  };
}

async function refreshIdcToken(payload: KiroPayload) {
  if (!payload.refreshToken) {
    throw new Error("账号原文里缺少 refresh_token。");
  }

  if (!payload.clientId || !payload.clientSecret) {
    throw new Error("账号原文里缺少 clientId 或 clientSecret。");
  }

  const region = payload.region || "us-east-1";
  const response = await fetch(`https://oidc.${region}.amazonaws.com/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId: payload.clientId,
      clientSecret: payload.clientSecret,
      grantType: "refresh_token",
      refreshToken: payload.refreshToken,
    }),
  });

  const text = await response.text();
  let parsed: JsonRecord | null = null;

  try {
    parsed = JSON.parse(text) as JsonRecord;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    throw new Error(
      parsed && typeof parsed.message === "string"
        ? parsed.message
        : text || `刷新失败（${response.status}）。`,
    );
  }

  return {
    accessToken:
      (parsed && typeof parsed.accessToken === "string" && parsed.accessToken) ||
      "",
    refreshToken:
      (parsed && typeof parsed.refreshToken === "string" && parsed.refreshToken) ||
      payload.refreshToken,
    idToken:
      (parsed && typeof parsed.idToken === "string" && parsed.idToken) || null,
    ssoSessionId:
      (parsed &&
        typeof parsed.aws_sso_app_session_id === "string" &&
        parsed.aws_sso_app_session_id) ||
      null,
  };
}

async function refreshKiroPayload(payload: KiroPayload) {
  const isIdc =
    payload.provider === "BuilderId" || payload.provider === "Enterprise";

  const refreshed = isIdc
    ? await refreshIdcToken(payload)
    : await refreshSocialToken(payload);

  setTopLevelString(payload.root, ["accessToken", "access_token"], refreshed.accessToken);
  setTopLevelString(payload.root, ["refreshToken", "refresh_token"], refreshed.refreshToken);

  if ("profileArn" in refreshed) {
    setTopLevelString(
      payload.root,
      ["profileArn", "profile_arn"],
      refreshed.profileArn,
    );
  }

  if ("idToken" in refreshed) {
    setTopLevelString(payload.root, ["idToken", "id_token"], refreshed.idToken);
  }

  if ("ssoSessionId" in refreshed) {
    setTopLevelString(
      payload.root,
      ["sso_session_id", "ssoSessionId"],
      refreshed.ssoSessionId,
    );
  }

  payload.accessToken = refreshed.accessToken;
  payload.refreshToken = refreshed.refreshToken;

  if ("profileArn" in refreshed) {
    payload.profileArn = refreshed.profileArn;
  }

  return serializeKiroPayload(payload);
}

async function requestKiroUsage(payload: KiroPayload) {
  if (!payload.accessToken) {
    return {
      response: null,
      decoded: null,
      error: "账号原文里缺少可检测的 access_token。",
    };
  }

  const requestBody = new Uint8Array(
    encode({
      isEmailRequired: true,
      origin: "KIRO_IDE",
    }),
  );

  const response = await fetch(KIRO_WEB_PORTAL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/cbor",
      Accept: "application/cbor",
      "smithy-protocol": "rpc-v2-cbor",
      authorization: `Bearer ${payload.accessToken}`,
      Cookie: `Idp=${payload.provider}; AccessToken=${payload.accessToken}`,
    },
    body: requestBody,
  });

  const bytes = new Uint8Array(await response.arrayBuffer());
  let decoded: unknown = null;

  try {
    decoded = decode(bytes);
  } catch {
    decoded = null;
  }

  return {
    response,
    decoded,
    error: null,
  };
}

export function supportsKiroLiveCheck(poolCode: string) {
  return poolCode.trim().toLowerCase().startsWith("kiro");
}

export async function checkKiroAccountLive(
  poolCode: string,
  payloadRaw: string,
): Promise<KiroLiveCheckResult> {
  if (!supportsKiroLiveCheck(poolCode)) {
    return {
      supported: false,
      runtimeStatus: "unknown",
      checkStatus: "unknown",
      message: null,
      quota: null,
      payloadRaw,
      refreshed: false,
    };
  }

  const payload = extractKiroPayload(payloadRaw);
  if (!payload) {
    return liveCheckResult(
      "unknown",
      "账号原文不是可识别的 JSON 对象。",
      payloadRaw,
    );
  }

  let nextPayloadRaw = payloadRaw;
  let refreshed = false;
  let requestResult:
    | {
        response: Response | null;
        decoded: unknown;
        error: string | null;
      }
    | undefined;

  try {
    if (!payload.accessToken && payload.refreshToken) {
      nextPayloadRaw = await refreshKiroPayload(payload);
      refreshed = true;
    }

    requestResult = await requestKiroUsage(payload);
  } catch (error) {
    return liveCheckResult(
      "unknown",
      error instanceof Error ? error.message : "实时检测请求失败。",
      nextPayloadRaw,
      null,
      refreshed,
    );
  }

  if (requestResult.error) {
    return liveCheckResult("unknown", requestResult.error, nextPayloadRaw);
  }

  const response = requestResult.response;
  const decoded = requestResult.decoded;

  if (!response) {
    return liveCheckResult("unknown", "实时检测请求失败。", nextPayloadRaw);
  }

  if (!response.ok) {
    const parsed = parseErrorBody(decoded);

    if (
      response.status === 423 &&
      parsed.type.includes("AccountSuspendedException")
    ) {
      return liveCheckResult(
        "banned",
        parsed.message ?? "账号已被暂停。",
        nextPayloadRaw,
        null,
        refreshed,
      );
    }

    if (
      response.status === 403 &&
      parsed.reason === "TEMPORARILY_SUSPENDED"
    ) {
      return liveCheckResult(
        "banned",
        parsed.message ?? "账号已被临时封禁。",
        nextPayloadRaw,
        null,
        refreshed,
      );
    }

    if (response.status === 401 || response.status === 403) {
      if (payload.refreshToken && !refreshed) {
        try {
          nextPayloadRaw = await refreshKiroPayload(payload);
          refreshed = true;
          const retry = await requestKiroUsage(payload);

          if (!retry.error && retry.response?.ok) {
            return liveCheckResult(
              "ok",
              "账号 Token 已自动刷新。",
              nextPayloadRaw,
              parseQuotaSummary(retry.decoded),
              true,
            );
          }

          if (retry.response && !retry.response.ok) {
            const retryParsed = parseErrorBody(retry.decoded);

            if (
              retry.response.status === 423 &&
              retryParsed.type.includes("AccountSuspendedException")
            ) {
              return liveCheckResult(
                "banned",
                retryParsed.message ?? "账号已被暂停。",
                nextPayloadRaw,
                null,
                true,
              );
            }

            if (
              retry.response.status === 403 &&
              retryParsed.reason === "TEMPORARILY_SUSPENDED"
            ) {
              return liveCheckResult(
                "banned",
                retryParsed.message ?? "账号已被临时封禁。",
                nextPayloadRaw,
                null,
                true,
              );
            }
          }
        } catch (error) {
          return liveCheckResult(
            "invalid",
            error instanceof Error
              ? error.message
              : "账号 Token 已失效且刷新失败。",
            nextPayloadRaw,
            null,
            refreshed,
          );
        }
      }

      return liveCheckResult(
        "invalid",
        parsed.message ?? "账号 Token 已失效或需要刷新。",
        nextPayloadRaw,
        null,
        refreshed,
      );
    }

    if (response.status === 429) {
      return liveCheckResult(
        "unknown",
        "检测过于频繁，请稍后再试。",
        nextPayloadRaw,
        null,
        refreshed,
      );
    }

    return liveCheckResult(
      "unknown",
      parsed.message ?? `实时检测失败（${response.status}）。`,
      nextPayloadRaw,
      null,
      refreshed,
    );
  }

  return liveCheckResult(
    "ok",
    refreshed ? "账号 Token 已自动刷新。" : null,
    nextPayloadRaw,
    parseQuotaSummary(decoded),
    refreshed,
  );
}
