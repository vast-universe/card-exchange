# Card Exchange 项目 Bug 报告

生成时间: 2026-04-05

## 🔴 严重问题 (Critical)

### 1. 仪表盘统计数据不准确 ✅ 已修复
**位置**: `lib/dashboard.ts`

**问题描述**:
- "已使用卡密"统计使用了 `LEFT JOIN` 后的 `COUNT(DISTINCT bindings.card_id)`，会导致计数错误
- "今日外发"统计在没有数据时返回 NULL 而不是 0

**影响**: 仪表盘显示错误的统计数据，影响运营决策

**修复状态**: ✅ 已修复
- 将"已使用卡密"改为子查询直接统计
- 使用 `COALESCE()` 确保"今日外发"返回 0 而不是 NULL

---

### 2. 账号分配存在竞态条件风险
**位置**: `lib/accounts.ts` - `claimAvailableAccount()`

**问题描述**:
```typescript
export async function claimAvailableAccount(poolCode: string) {
  return queryFirst<AccountRecord>(
    `
      UPDATE accounts
      SET stock_status = 'bound'
      WHERE id = (
        SELECT id
        FROM accounts
        WHERE pool_code = ?
          AND stock_status = 'available'
          AND check_status = 'ok'
        ORDER BY id ASC
        LIMIT 1
      )
      RETURNING id, pool_code, payload_raw, stock_status, check_status, created_at
    `,
    [poolCode],
  );
}
```

在高并发场景下，多个请求可能同时选中同一个账号。虽然 SQLite 的 UPDATE 是原子性的，但在 D1 分布式环境下可能存在问题。

**影响**: 
- 高并发时可能导致同一账号被分配给多个卡密
- 数据一致性问题

**建议修复**:
- 在 `redeemCardByCode` 中使用卡密锁（已有）
- 考虑添加数据库级别的唯一约束检查
- 在分配失败时进行重试

---

### 3. 多账号卡密兑换时的部分失败处理不完整
**位置**: `lib/exchange.ts` - `redeemCardByCode()`

**问题描述**:
```typescript
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
```

**问题**:
1. 批量分配时，如果某个批次失败，已分配的账号会被释放，但错误信息不够详细
2. 并发分配可能导致账号池快速耗尽，影响其他请求
3. 没有记录部分成功的情况，难以排查问题

**影响**: 
- 用户体验差（失败后需要重试）
- 难以追踪和调试分配失败的原因
- 可能导致账号资源浪费

**建议修复**:
- 添加详细的日志记录
- 考虑使用事务或补偿机制
- 优化错误信息，包含失败原因

---

## 🟡 中等问题 (Medium)

### 4. 卡密锁定时间过短可能导致问题
**位置**: `lib/cards.ts` - `acquireCardLock()`

**问题描述**:
```typescript
const lockUntil = new Date(Date.now() + 15_000).toISOString(); // 15秒锁定
```

15秒的锁定时间在以下场景可能不够：
- 多账号卡密分配（需要分配多个账号并验证）
- 网络延迟较高时
- 账号验证服务响应慢时

**影响**: 
- 可能导致锁过期，多个请求同时处理同一卡密
- 数据不一致

**建议修复**:
- 增加锁定时间到 30-60 秒
- 或者实现锁续期机制
- 添加锁超时监控和告警

---

### 5. 售后换号逻辑与多账号卡密不兼容
**位置**: `lib/exchange.ts` - `replaceCardAccount()`

**问题描述**:
`replaceCardAccount()` 函数仍然使用旧的 `bindings` 表逻辑，与新的 `card_account_pool` 表不兼容。

```typescript
export async function replaceCardAccount(cardCode: string) {
  // ...
  const activeBinding = await getActiveBinding(card.id);
  if (!activeBinding) {
    throw new AppError("当前没有可售后的绑定账号。", 404);
  }
  // ... 使用 bindings 表的逻辑
}
```

但在 `getSupportSnapshot()` 中已经实现了多账号的自动换号逻辑。

**影响**: 
- 单账号卡密的手动换号功能可能失效
- 代码逻辑不一致，难以维护

**建议修复**:
- 统一使用 `card_account_pool` 表
- 或者明确标记 `replaceCardAccount()` 为废弃函数
- 更新相关 API 路由

---

### 6. 外部供货API缺少幂等性保护
**位置**: `app/api/supply/cards/route.ts` - `issueCardsForExternal()`

**问题描述**:
虽然有 `deliveryRef` 去重逻辑，但在以下场景可能失败：
1. 两个请求同时到达，都没有找到已存在的卡密
2. 数据库查询和插入之间存在时间窗口

```typescript
if (providedDeliveryRef) {
  const existingCards = await listDeliveredCardsByRef(providedDeliveryRef);
  
  if (existingCards.length > 0) {
    // 返回已有卡密
  }
}

// 时间窗口：另一个请求可能在这里插入相同的 deliveryRef
const deliveryRef = providedDeliveryRef || `API-${poolCode.toUpperCase()}-${createRandomToken(10)}`;
```

**影响**: 
- 可能生成重复的卡密
- 外部平台可能收到不一致的响应

**建议修复**:
- 在 `cards` 表的 `delivery_ref` 字段添加唯一索引
- 使用数据库级别的冲突检测
- 或者使用分布式锁

---

### 7. 环境变量验证不足
**位置**: `lib/env.ts`

**问题描述**:
开发环境使用硬编码的默认值，可能导致安全问题：

```typescript
const DEV_DEFAULTS = {
  ADMIN_PASSWORD: "change-me-admin",
  SESSION_SECRET: "dev-session-secret",
  CARD_HASH_SECRET: "dev-card-hash-secret",
  SUPPLY_API_TOKEN: "change-me-supply-token",
  TURNSTILE_SECRET_KEY: "",
} as const;
```

**影响**: 
- 开发环境可能被误部署到生产
- 默认密码容易被猜测

**建议修复**:
- 添加环境检测，禁止在生产环境使用默认值
- 启动时验证所有必需的环境变量
- 添加配置文档

---

## 🟢 轻微问题 (Minor)

### 8. 错误处理不一致
**位置**: 多个 API 路由

**问题描述**:
不同的 API 路由使用不同的错误响应格式：
- 有的返回 `{ error: string }`
- 有的返回 `{ success: false, message: string }`
- 供货 API 返回多种格式兼容

**影响**: 
- 前端需要处理多种错误格式
- API 文档复杂

**建议修复**:
- 统一错误响应格式
- 创建统一的错误处理中间件

---

### 9. 缺少请求日志和审计
**位置**: 所有 API 路由

**问题描述**:
- 没有记录关键操作的日志（如卡密生成、账号分配、换号等）
- 难以追踪问题和审计操作

**影响**: 
- 问题排查困难
- 无法追溯操作历史

**建议修复**:
- 添加结构化日志
- 记录关键操作到数据库
- 实现审计日志表

---

### 10. 前端表单验证不足
**位置**: 前端组件（未详细检查）

**问题描述**:
API 层有完善的验证，但前端可能缺少即时反馈。

**建议修复**:
- 添加前端表单验证
- 提供即时错误提示
- 改善用户体验

---

### 11. 数据库索引可能不够优化
**位置**: 数据库 schema

**问题描述**:
虽然有基本索引，但在以下场景可能需要优化：
- `card_account_pool` 表的复合查询
- `accounts` 表的 `pool_code + stock_status + check_status` 组合查询

**建议修复**:
- 分析慢查询日志
- 添加必要的复合索引
- 定期优化数据库性能

---

### 12. 缺少数据备份和恢复机制
**位置**: 整体架构

**问题描述**:
- 没有自动备份机制
- 没有灾难恢复计划

**建议修复**:
- 实现定期自动备份
- 测试恢复流程
- 文档化备份策略

---

## 📊 代码质量建议

### 13. 类型定义可以更严格
- 使用更多的 TypeScript 严格模式特性
- 减少 `any` 类型的使用
- 添加更多的类型守卫

### 14. 测试覆盖率不足
- 缺少单元测试
- 缺少集成测试
- 缺少端到端测试

**建议**:
- 为关键业务逻辑添加单元测试
- 为 API 路由添加集成测试
- 使用 Vitest 或 Jest

### 15. 代码重复
- `exchange.ts` 中有重复的账号检查逻辑
- 多个地方重复验证输入

**建议**:
- 提取公共函数
- 使用装饰器或中间件

---

## 🎯 优先级建议

### 立即修复 (P0)
1. ✅ 仪表盘统计数据不准确（已修复）
2. 账号分配竞态条件
3. 外部供货API幂等性

### 近期修复 (P1)
4. 卡密锁定时间优化
5. 售后换号逻辑统一
6. 环境变量验证

### 长期优化 (P2)
7. 错误处理统一
8. 日志和审计系统
9. 测试覆盖率
10. 性能优化

---

## 📝 总结

项目整体架构合理，代码质量良好，但在以下方面需要改进：

1. **并发安全性**: 需要加强高并发场景下的数据一致性保护
2. **错误处理**: 需要统一错误格式和改善错误信息
3. **可观测性**: 需要添加日志、监控和审计
4. **测试**: 需要补充测试用例
5. **文档**: 需要完善 API 文档和部署文档

建议按优先级逐步修复，同时建立代码审查和测试流程，确保新代码质量。
