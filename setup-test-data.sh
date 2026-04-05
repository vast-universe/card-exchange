#!/bin/bash

# 设置测试数据
set -e

echo "=========================================="
echo "设置测试数据"
echo "=========================================="
echo ""

# 1. 创建账号类型
echo "1. 创建账号类型 'test'..."
wrangler d1 execute DB --local --command "
INSERT OR IGNORE INTO account_types (code, created_at)
VALUES ('test', datetime('now'));
"

# 2. 创建20个测试账号（test类型不会被实时检查）
echo "2. 创建20个测试账号..."
for i in {1..20}; do
  wrangler d1 execute DB --local --command "
  INSERT INTO accounts (pool_code, payload_raw, check_status, stock_status, created_at)
  VALUES (
    'test',
    '{\"username\":\"test_user_$i\",\"password\":\"test_pass_$i\",\"email\":\"test$i@example.com\"}',
    'ok',
    'available',
    datetime('now')
  );
  " > /dev/null 2>&1
  echo "  创建账号 $i/20"
done

# 3. 验证数据
echo ""
echo "3. 验证数据..."
echo ""
echo "账号类型:"
wrangler d1 execute DB --local --command "SELECT * FROM account_types;"

echo ""
echo "账号统计:"
wrangler d1 execute DB --local --command "
SELECT 
  pool_code,
  stock_status,
  COUNT(*) as count
FROM accounts
GROUP BY pool_code, stock_status;
"

echo ""
echo "=========================================="
echo "测试数据设置完成！"
echo "=========================================="
