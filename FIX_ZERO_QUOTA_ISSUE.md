# 修复额度为 0 但 check_status 不是 banned 的问题

## 问题描述

卡密：`KIRO-QSNF-52QY-6JRD-RWMD`
账号 ID：77

### 用户报告的问题
- 用户在售后页面看到账号显示"可用"
- 但额度显示为 0/0
- 用户无法置换账号
- 错误信息：**"Authentication required or access denied"**

### 实际情况
从生产数据库查询结果：
- `check_status`: `unknown`
- `stock_status`: `bound`
- 质保状态：已过期（24小时质保，已过期约4小时）
- 售后次数：剩余 1 次

从 Kiro Manager 查看：
- 账号状态：正常（绿色）
- 额度显示：0 / 0
- Token 时间：2026/04/05 22:32:16

### 根本原因

1. **Token 失效**：账号的 access token 和 refresh token 都已失效
2. **认证失败**：实时检查时返回 "Authentication required or access denied"
3. **状态判断不完整**：
   - `checkKiroAccountLive` 返回 `runtimeStatus: "invalid"`
   - 但 `checkStatus` 被设置为 `"unknown"`（不是 "banned"）
   - 原有逻辑只检查 `banned` 和 `quota.remaining === 0`
   - **没有检查 `runtimeStatus === "invalid"`**

4. **质保已过期**：即使修复了判断逻辑，由于质保已过期，用户仍然无法换号

## 问题分析

### 当前逻辑的缺陷

**原有的 `needsReplacement` 判断：**
```typescript
const needsReplacement =
  checkStatus === "banned" ||
  (liveCheck.quota !== null && liveCheck.quota.remaining === 0);
```

**问题：**
- ✅ 能识别 `banned`（明确封禁）
- ✅ 能识别 `quota.remaining === 0`（额度为0）
- ❌ **不能识别 `invalid`（Token失效）**

**当遇到 "Authentication required or access denied" 时：**
- `runtimeStatus: "invalid"`
- `checkStatus: "unknown"`
- `quota: null`（因为认证失败，无法获取额度）
- **不满足 `needsReplacement` 的条件**
- 用户无法换号

### checkKiroAccountLive 的返回值

```typescript
// 401/403 错误且刷新失败
return liveCheckResult(
  "invalid",  // runtimeStatus
  "账号 Token 已失效且刷新失败。",
  nextPayloadRaw,
  null,  // quota 为 null
  refreshed,
);

// liveCheckResult 函数
function liveCheckResult(runtimeStatus, message, payloadRaw, quota, refreshed) {
  return {
    supported: true,
    runtimeStatus,  // "invalid"
    checkStatus: runtimeStatus === "banned" ? "banned" 
               : runtimeStatus === "ok" ? "ok" 
               : "unknown",  // "invalid" 被映射为 "unknown"
    message,
    quota,
    payloadRaw,
    refreshed,
  };
}
```

## 解决方案

### 修复内容

修改 `getSupportSnapshot` 和 `replaceCardAccount` 中的 `needsReplacement` 判断逻辑：

**修改后的逻辑：**
```typescript
// 判断账号是否需要换号：
// 1. 被封禁 (banned)
// 2. Token 失效 (invalid)
// 3. 额度为 0
const needsReplacement =
  checkStatus === "banned" ||
  liveCheck.runtimeStatus === "invalid" ||
  (liveCheck.quota !== null && liveCheck.quota.remaining === 0);
```

**修复效果：**
- ✅ 能识别 `banned`（明确封禁）
- ✅ 能识别 `invalid`（Token失效）- **新增**
- ✅ 能识别 `quota.remaining === 0`（额度为0）

### 业务规则

**换号条件：**
```typescript
const canReplace =
  needsReplacement &&        // 账号需要换号
  aftersaleLeft > 0 &&       // 有剩余售后次数
  !warranty.warrantyExpired; // 质保未过期
```

**对于本案例：**
- ✅ `needsReplacement`: true（Token失效）
- ✅ `aftersaleLeft > 0`: true（剩余1次）
- ❌ `!warranty.warrantyExpired`: false（质保已过期）
- **结果：仍然无法换号（因为质保已过期）**

## 测试计划

1. 测试 Token 失效的账号在质保内是否可以换号
2. 测试 Token 失效的账号在质保外是否不能换号
3. 测试其他状态（banned、额度为0）是否仍然正常工作

## 部署说明

修改文件：
- `card-exchange/lib/exchange.ts`

修改内容：
- `getSupportSnapshot` 函数中的 `needsReplacement` 判断
- `replaceCardAccount` 函数中的 `needsReplacement` 判断

## 后续建议

对于本案例（卡密 KIRO-QSNF-52QY-6JRD-RWMD），由于质保已过期，有以下选择：

1. **严格执行质保政策**：告诉用户质保已过期，无法换号
2. **手动延长质保**：如果认为这是特殊情况，可以手动延长质保时间
3. **特殊处理**：对于 Token 失效的情况，考虑放宽质保限制
