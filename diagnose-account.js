// 诊断账号 77 的真实状态
// 使用 wrangler 执行 SQL 查询并测试 API

const accountId = 77;

console.log(`正在诊断账号 ${accountId}...`);
console.log('');
console.log('步骤 1: 从数据库获取账号信息');
console.log('运行命令:');
console.log(`npx wrangler d1 execute card-exchange --remote --command "SELECT id, check_status, stock_status, created_at FROM accounts WHERE id = ${accountId}"`);
console.log('');
console.log('步骤 2: 获取账号的 payload_raw');
console.log('运行命令:');
console.log(`npx wrangler d1 execute card-exchange --remote --command "SELECT payload_raw FROM accounts WHERE id = ${accountId}"`);
console.log('');
console.log('步骤 3: 解析 payload 中的关键信息');
console.log('- accessToken 是否存在');
console.log('- refreshToken 是否存在');
console.log('- provider 类型');
console.log('- expiresAt 过期时间');
console.log('');
console.log('步骤 4: 判断账号状态');
console.log('如果看到以下错误信息：');
console.log('- "Authentication required or access denied" -> Token 失效或账号被封');
console.log('- "AccountSuspendedException" -> 账号被暂停（明确封禁）');
console.log('- "TEMPORARILY_SUSPENDED" -> 账号被临时封禁');
console.log('- Token 刷新失败 -> refreshToken 也失效了');
console.log('');
console.log('建议：');
console.log('1. 如果是 Token 失效，可以尝试手动刷新 token');
console.log('2. 如果是账号被封，应该标记为 banned 并允许用户换号');
console.log('3. 如果无法确认，建议直接允许用户换号');
