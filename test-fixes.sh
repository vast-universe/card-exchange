#!/bin/bash

# 测试脚本 - 验证修复是否正常工作
# 使用方法: bash test-fixes.sh

set -e

echo "=========================================="
echo "Card Exchange 修复验证测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_case() {
    local name="$1"
    local command="$2"
    
    echo -n "测试: $name ... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 通过${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ 失败${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "1. 检查 TypeScript 编译"
echo "----------------------------------------"
test_case "TypeScript 类型检查" "npx tsc --noEmit"
echo ""

echo "2. 检查构建"
echo "----------------------------------------"
test_case "Next.js 构建" "npm run build"
echo ""

echo "3. 检查数据库迁移"
echo "----------------------------------------"
test_case "数据库连接" "wrangler d1 execute DB --local --command='SELECT 1'"
test_case "迁移文件语法" "wrangler d1 execute DB --local --file=./migrations/0008_delivery_ref_unique.sql"
test_case "唯一索引创建" "wrangler d1 execute DB --local --command=\"SELECT name FROM sqlite_master WHERE type='index' AND name='idx_cards_delivery_ref_unique'\""
echo ""

echo "4. 检查关键文件"
echo "----------------------------------------"
test_case "dashboard.ts 存在" "test -f lib/dashboard.ts"
test_case "cards.ts 存在" "test -f lib/cards.ts"
test_case "env.ts 存在" "test -f lib/env.ts"
test_case "exchange.ts 存在" "test -f lib/exchange.ts"
echo ""

echo "5. 检查文档"
echo "----------------------------------------"
test_case "BUG_REPORT.md 存在" "test -f BUG_REPORT.md"
test_case "FIXES_APPLIED.md 存在" "test -f FIXES_APPLIED.md"
echo ""

echo "=========================================="
echo "测试结果汇总"
echo "=========================================="
echo -e "通过: ${GREEN}${PASSED}${NC}"
echo -e "失败: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    echo ""
    echo "建议下一步操作："
    echo "1. 在生产环境执行数据库迁移："
    echo "   wrangler d1 execute DB --remote --file=./migrations/0008_delivery_ref_unique.sql"
    echo ""
    echo "2. 部署到生产环境："
    echo "   npm run deploy"
    echo ""
    echo "3. 监控日志和错误："
    echo "   wrangler tail"
    exit 0
else
    echo -e "${RED}✗ 有测试失败，请检查错误信息${NC}"
    exit 1
fi
