// 测试 parseQuotaSummary 函数解析账号 77 的数据

const usageData = {
  "daysUntilReset": 0,
  "limits": [],
  "nextDateReset": 1777593600,
  "overageConfiguration": {
    "overageEnabled": false
  },
  "subscriptionInfo": {
    "overageCapability": "OVERAGE_INCAPABLE",
    "subscriptionManagementTarget": "PURCHASE",
    "subscriptionTitle": "KIRO FREE",
    "type": "Q_DEVELOPER_STANDALONE_FREE",
    "upgradeCapability": "UPGRADE_CAPABLE"
  },
  "usageBreakdownList": [
    {
      "bonuses": [],
      "currency": "USD",
      "currentOverages": 0,
      "currentOveragesWithPrecision": 0,
      "currentUsage": 0,
      "currentUsageWithPrecision": 0,
      "displayName": "Credit",
      "displayNamePlural": "Credits",
      "freeTrialInfo": {
        "currentUsage": 0,
        "currentUsageWithPrecision": 0,
        "freeTrialExpiry": 1777643586.178,
        "freeTrialStatus": "ACTIVE",
        "usageLimit": 500,
        "usageLimitWithPrecision": 500
      },
      "nextDateReset": 1777593600,
      "overageCap": 10000,
      "overageCapWithPrecision": 10000,
      "overageCharges": 0,
      "overageRate": 0.04,
      "resourceType": "CREDIT",
      "unit": "INVOCATIONS",
      "usageLimit": 50,
      "usageLimitWithPrecision": 50
    }
  ],
  "userInfo": {
    "email": "yangjian244367@outlook.com",
    "userId": "d-9067642ac7.44e864d8-40b1-70e4-c2f1-dd27db4a924f"
  }
};

function numberValue(value) {
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

function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}

function parseQuotaSummary(usageData) {
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

const result = parseQuotaSummary(usageData);
console.log("解析结果：");
console.log(JSON.stringify(result, null, 2));

console.log("\n详细信息：");
console.log(`- 主额度：${usageData.usageBreakdownList[0].currentUsage}/${usageData.usageBreakdownList[0].usageLimit}`);
console.log(`- 试用额度：${usageData.usageBreakdownList[0].freeTrialInfo.currentUsage}/${usageData.usageBreakdownList[0].freeTrialInfo.usageLimit}`);
console.log(`- 试用状态：${usageData.usageBreakdownList[0].freeTrialInfo.freeTrialStatus}`);
console.log(`- 试用过期时间：${new Date(usageData.usageBreakdownList[0].freeTrialInfo.freeTrialExpiry * 1000).toISOString()}`);
console.log(`- 当前时间：${new Date().toISOString()}`);
console.log(`- 试用是否激活：${usageData.usageBreakdownList[0].freeTrialInfo.freeTrialStatus === "ACTIVE"}`);
