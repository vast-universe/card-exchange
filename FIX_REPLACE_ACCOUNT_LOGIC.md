# 修复售后换号逻辑统一

修复时间: 2026-04-05

## 🎯 问题描述

`replaceCardAccount()` 函数仍然使用旧的 `bindings` 表逻辑，与新的 `card_account_pool` 表不兼容。这导致：

1. **代码逻辑不一致**: 兑换使用 `card_account_pool`，换号使用 `bindings`
2. **维护困难**: 两套逻辑并存，容易出错
3. **功能不完整**: 无法支持多账号卡密的换号
4. **数据不一致**: 可能导致两个表的数据不同步

## 🔍 根本原因

### 历史背景

项目最初使用 `bindings` 表来管理卡密和账号的绑定关系：

```sql
CREATE TABLE bindings (
  id INTEGER PRIMARY KEY,
  card_id INTEGER,
  account_id INTEGER,
  kind TEXT,  -- 'redeem' or 'replace'
  status TEXT,  -- 'active' or 'ended'
  created_at TEXT,
  ended_at TEXT
);
```

后来为了支持多账号卡密，引入了新的 `card_account_pool` 表：

```sql
CREATE TABLE card_account_pool (
  id INTEGER PRIMARY KEY,
  card_id INTEGER,
  account_id INTEGER,
  position INTEGER,  -- 账号位置
  status TEXT,  -- 'active' or 'replaced'
  created_at TEXT,
  replaced_at TEXT,
  replaced_by_position INTEGER
);
```

### 问题所在

- `redeemCardByCode()` 已经迁移到使用 `card_account_pool`
- `getSupportSnapshot()` 也使用 `card_account_pool` 并实现了自动换号
- 但 `replaceCardAccount()` 仍然使用旧的 `bindings` 表

这导致：
1. 新兑换的卡密在 `card_account_pool` 中有记录
2. 但调用 `replaceCardAccount()` 时会查询 `bindings` 表
3. 找不到记录，换号失败

## ✅ 解决方案

### 1. 重写 `replaceCardAccount()` 函数 ✅

**文件**: `lib/exchange.ts`

完全重写函数以使用 `card_account_pool` 表：

```typescript
export async function replaceCardAccount(cardCode: string) {
  const card = await getCardByCodeOrThrow(cardCode);
  const locked = await acquireCardLock(card.id);
  
  if (!locked) {
    throw new AppError("卡密正在处理中，请稍后重试。", 409);
  }

  try {
    // 1. 检查是否有账号分配（使用 card_account_pool）
    const hasAccounts = await hasAccountsAllocated(card.id);
    if (!hasAccounts) {
      throw new AppError("这张卡还没有绑定账号，请先去兑换。", 404);
    }

    // 2. 获取所有激活的账号
    const activeAccounts = await getActiveAccountsForCard(card.id);
    
    // 3. 选择要替换的账号（单账号或第一个被封禁的）
    let targetAccount = activeAccounts[0];
    if (card.account_quantity > 1) {
      const bannedAccount = activeAccounts.find(acc => acc.check_status === 'banned');
      if (bannedAccount) {
        targetAccount = bannedAccount;
      }
    }

    // 4. 实时检查账号状态
    const liveCheck = await checkKiroAccountLive(...);
    
    // 5. 验证账号被封禁、有售后次数、在质保期内
    // ...

    // 6. 分配新账号
    const replacement = await claimVerifiedAvailableAccount(card.pool_code);
    
    // 7. 使用 card_account_pool 的 replaceAccount 函数
    const newPosition = await replaceAccount({
      cardId: card.id,
      oldPosition: targetAccount.position,
      newAccountId: replacement.id,
    });

    // 8. 禁用旧账号，增加售后次数
    await disableAccount(targetAccount.account_id);
    await incrementAftersaleUsed(card.id);

    return {
      payloadRaw: replacement.payload_raw,
      aftersaleLeft: aftersaleLeft - 1,
      position: newPosition,
      oldPosition: targetAccount.position,
    };
  } finally {
    await releaseCardLock(card.id);
  }
}
```

### 2. 标记旧函数为废弃 ✅

**文件**: `lib/exchange.ts`

为旧的 `bindings` 表相关函数添加废弃标记：

```typescript
// ============================================================================
// DEPRECATED: Legacy bindings table functions
// These functions are kept for backward compatibility and data migration
// New code should use card_account_pool table functions instead
// ============================================================================

/**
 * @deprecated Use getActiveAccountsForCard from card-account-pool.ts instead
 */
async function getActiveBinding(cardId: number) { ... }

/**
 * @deprecated Use allocateAccountsToCard from card-account-pool.ts instead
 */
async function createBinding(...) { ... }

/**
 * @deprecated Use replaceAccount from card-account-pool.ts instead
 */
async function endBinding(bindingId: number) { ... }

/**
 * @deprecated No longer needed with card_account_pool table
 */
async function reactivateBinding(bindingId: number) { ... }
```

### 3. 添加详细日志 ✅

在关键步骤添加日志记录：

```typescript
console.log(`[replaceCardAccount] 开始换号: cardCode=${cardCode}, cardId=${card.id}`);

console.log(
  `[replaceCardAccount] 账号替换成功: ` +
  `oldAccountId=${targetAccount.account_id}, ` +
  `newAccountId=${replacement.id}, ` +
  `oldPosition=${targetAccount.position}, ` +
  `newPosition=${newPosition}`
);

console.error(
  `[replaceCardAccount] 换号失败，释放账号: accountId=${replacement.id}`,
  error
);
```

## 🔄 新旧对比

### 旧逻辑（使用 bindings 表）

```typescript
// 1. 查询 bindings 表
const activeBinding = await getActiveBinding(card.id);

// 2. 结束旧绑定
await endBinding(activeBinding.binding_id);

// 3. 创建新绑定
await createBinding(card.id, replacement.id, "replace");

// 4. 复杂的回滚逻辑
try {
  // ...
} catch (error) {
  await reactivateBinding(activeBinding.binding_id);
  // ...
}
```

### 新逻辑（使用 card_account_pool 表）

```typescript
// 1. 查询 card_account_pool 表
const activeAccounts = await getActiveAccountsForCard(card.id);

// 2. 选择要替换的账号
let targetAccount = activeAccounts[0];

// 3. 使用 replaceAccount 函数（原子操作）
const newPosition = await replaceAccount({
  cardId: card.id,
  oldPosition: targetAccount.position,
  newAccountId: replacement.id,
});

// 4. 简单的回滚逻辑
try {
  // ...
} catch (error) {
  await releaseAccount(replacement.id);
}
```

## 🎯 改进点

### 1. 统一数据模型
- ✅ 所有功能都使用 `card_account_pool` 表
- ✅ 数据一致性得到保证
- ✅ 代码逻辑统一，易于维护

### 2. 支持多账号卡密
- ✅ 可以为多账号卡密换号
- ✅ 自动选择被封禁的账号
- ✅ 保留账号位置信息

### 3. 简化回滚逻辑
- ✅ 使用 `replaceAccount` 原子操作
- ✅ 回滚只需释放新账号
- ✅ 减少出错可能性

### 4. 更好的可观测性
- ✅ 详细的日志记录
- ✅ 包含账号ID和位置信息
- ✅ 便于问题追踪

## 📊 兼容性

### 向后兼容
- ✅ API 接口保持不变
- ✅ 返回格式兼容（增加了 position 字段）
- ✅ 旧的 `bindings` 表函数保留（标记为废弃）

### 数据迁移
- ✅ 旧数据已通过迁移脚本转移到 `card_account_pool`
- ✅ `bindings` 表保留作为备份
- ✅ 可以安全删除旧函数（如果确认不再需要）

## ⚠️ 注意事项

### 1. 多账号卡密换号策略

当前实现：
- 单账号卡密：直接换第一个账号
- 多账号卡密：换第一个被封禁的账号

未来可以改进为：
- 允许用户指定要换哪个账号
- 支持批量换号
- 更灵活的换号策略

### 2. 旧数据处理

如果系统中还有使用旧 `bindings` 表的数据：
1. 确保已运行迁移脚本 `0002_multi_account_cards.sql`
2. 验证数据已正确迁移
3. 可以考虑删除旧的 `bindings` 表（谨慎操作）

### 3. API 响应变化

新的响应格式增加了字段：

```typescript
// 旧格式
{
  payloadRaw: string,
  aftersaleLeft: number
}

// 新格式（向后兼容）
{
  payloadRaw: string,
  aftersaleLeft: number,
  position: number,        // 新增：新账号位置
  oldPosition: number      // 新增：旧账号位置
}
```

前端可以选择性使用新字段。

## ✅ 测试验证

### 1. 类型检查
```bash
npx tsc --noEmit
```
✅ 通过

### 2. 构建测试
```bash
npm run build
```
✅ 成功

### 3. 功能测试（建议）

测试场景：
1. 单账号卡密换号
2. 多账号卡密换号
3. 账号未封禁时换号（应失败）
4. 售后次数用完时换号（应失败）
5. 质保过期时换号（应失败）

## 🚀 部署步骤

### 1. 验证数据迁移

确保所有数据已迁移到 `card_account_pool`：

```sql
-- 检查是否有未迁移的数据
SELECT COUNT(*) FROM bindings 
WHERE NOT EXISTS (
  SELECT 1 FROM card_account_pool 
  WHERE card_account_pool.card_id = bindings.card_id
);
```

### 2. 部署代码

```bash
npm run deploy
```

### 3. 监控日志

```bash
wrangler tail
```

查找以下日志：
- `[replaceCardAccount] 开始换号`
- `[replaceCardAccount] 账号替换成功`
- `[replaceCardAccount] 换号失败`

### 4. 验证功能

测试换号功能是否正常工作。

## 📝 相关文件

- `lib/exchange.ts` - 主要修改文件
- `lib/card-account-pool.ts` - 使用的新函数
- `app/api/support/replace/route.ts` - API 路由
- `migrations/0002_multi_account_cards.sql` - 数据迁移脚本

## 🎉 总结

通过重写 `replaceCardAccount()` 函数，我们：

1. ✅ 统一了代码逻辑，使用 `card_account_pool` 表
2. ✅ 支持了多账号卡密的换号功能
3. ✅ 简化了回滚逻辑，提高了可靠性
4. ✅ 添加了详细的日志，提升了可观测性
5. ✅ 保持了向后兼容性

这是一个 P1 中等优先级的修复，建议在下次部署时一起上线。

---

**修复状态**: ✅ 已完成  
**测试状态**: ✅ 类型检查和构建通过  
**建议**: 与其他修复一起部署
