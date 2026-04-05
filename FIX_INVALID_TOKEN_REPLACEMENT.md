# 修复 Token 失效账号的换号逻辑

## 修复内容

增强了账号换号的判断逻辑，现在可以正确识别以下三种需要换号的情况：

1. **账号被封禁** (`checkStatus === "banned"`)
2. **Token 失效** (`runtimeStatus === "invalid"`) - **新增**
3. **额度为 0** (`quota.remaining === 0`)

## 修改文件

- `card-exchange/lib/exchange.ts`
  - `getSupportSnapshot` 函数
  - `replaceCardAccount` 函数

## 修改详情

### 修改前

```typescript
const needsReplacement =
  checkStatus === "banned" ||
  (liveCheck.quota !== null && liveCheck.quota.remaining === 0);
```

**问题：** 无法识别 Token 失效的情况（`runtimeStatus === "invalid"`）

### 修改后

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

**改进：** 增加了对 `runtimeStatus === "invalid"` 的检查

## 业务逻辑

### 换号条件

```typescript
const canReplace =
  needsReplacement &&        // 账号需要换号
  aftersaleLeft > 0 &&       // 有剩余售后次数
  !warranty.warrantyExpired; // 质保未过期
```

### 各种情况的处理

| 账号状态 | runtimeStatus | checkStatus | quota | needsReplacement | 说明 |
|---------|---------------|-------------|-------|------------------|------|
| 明确封禁 | banned | banned | null | ✅ true | 账号被 AWS/Kiro 封禁 |
| Token失效 | invalid | unknown | null | ✅ true | Token 无法刷新 |
| 额度为0 | ok | ok | {remaining: 0} | ✅ true | 账号正常但无额度 |
| 正常 | ok | ok | {remaining: 100} | ❌ false | 账号正常且有额度 |
| 临时错误 | unknown | unknown | null | ❌ false | 网络问题等临时错误 |

## 错误信息对应关系

| 错误信息 | runtimeStatus | checkStatus | 是否可换号 |
|---------|---------------|-------------|-----------|
| "Authentication required or access denied" | invalid | unknown | ✅ 是（质保内） |
| "账号已被暂停" (423 AccountSuspendedException) | banned | banned | ✅ 是（质保内） |
| "账号已被临时封禁" (403 TEMPORARILY_SUSPENDED) | banned | banned | ✅ 是（质保内） |
| "检测过于频繁" (429) | unknown | unknown | ❌ 否 |
| 网络错误 | unknown | unknown | ❌ 否 |

## 测试场景

### 场景 1：Token 失效，质保内
- 账号状态：Token 失效
- 质保状态：未过期
- 售后次数：有剩余
- **预期结果：可以换号** ✅

### 场景 2：Token 失效，质保外
- 账号状态：Token 失效
- 质保状态：已过期
- 售后次数：有剩余
- **预期结果：不能换号** ❌

### 场景 3：账号被封禁，质保内
- 账号状态：被封禁
- 质保状态：未过期
- 售后次数：有剩余
- **预期结果：可以换号** ✅

### 场景 4：额度为 0，质保内
- 账号状态：正常但额度为 0
- 质保状态：未过期
- 售后次数：有剩余
- **预期结果：可以换号** ✅

### 场景 5：临时错误
- 账号状态：检查失败（429 限流等）
- 质保状态：未过期
- 售后次数：有剩余
- **预期结果：不能换号** ❌（避免误判）

## 部署步骤

1. 提交代码到 git
2. 构建项目：`npm run build`
3. 部署到 Cloudflare Workers
4. 测试售后页面功能

## 验证方法

使用卡密 `KIRO-QSNF-52QY-6JRD-RWMD` 测试：

1. 访问售后页面
2. 查看账号状态显示
3. 检查是否显示"可否换号"
4. 如果质保内，应该显示"可以"
5. 如果质保外，应该显示"不可以"

## 注意事项

1. **质保时间是硬性限制**：即使账号有问题，质保过期后也不能换号
2. **售后次数限制**：即使质保内，售后次数用完也不能换号
3. **临时错误不触发换号**：避免因网络问题等临时错误误判

## 相关文档

- `FIX_ZERO_QUOTA_ISSUE.md` - 详细的问题分析和解决方案
- `FIXES_APPLIED.md` - 所有已修复的 bug 列表
