#!/bin/bash

# 更新 Cloudflare Workers 密钥脚本
# 只配置缺少的密钥

set -e

echo "=========================================="
echo "更新 Cloudflare Workers 密钥"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}当前已配置的密钥:${NC}"
wrangler secret list
echo ""

echo -e "${YELLOW}需要新增的密钥:${NC}"
echo "1. SUPPLY_API_TOKEN - 供货 API 认证密钥"
echo "2. RATE_LIMIT_ENABLED - 速率限制开关"
echo ""

read -p "是否继续配置? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

echo ""
echo "=========================================="
echo "1/2 配置 SUPPLY_API_TOKEN"
echo "=========================================="
echo ""
echo -e "${YELLOW}这是外部发货系统（xianyu-auto-reply-fix）调用 API 时使用的认证密钥${NC}"
echo ""
echo "已生成的 Token:"
echo -e "${GREEN}c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512${NC}"
echo ""
echo "按回车键继续配置..."
read
echo "c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512" | wrangler secret put SUPPLY_API_TOKEN
echo -e "${GREEN}✓ SUPPLY_API_TOKEN 配置完成${NC}"
echo ""

echo "=========================================="
echo "2/2 配置 RATE_LIMIT_ENABLED"
echo "=========================================="
echo ""
echo -e "${YELLOW}启用速率限制以防止 API 滥用${NC}"
echo "当前设置: 1 分钟 30 次请求"
echo ""
echo "按回车键继续配置..."
read
echo "true" | wrangler secret put RATE_LIMIT_ENABLED
echo -e "${GREEN}✓ RATE_LIMIT_ENABLED 配置完成${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}✓ 密钥更新完成！${NC}"
echo "=========================================="
echo ""
echo "当前所有密钥:"
wrangler secret list
echo ""
echo -e "${BLUE}重要信息:${NC}"
echo ""
echo "1. SUPPLY_API_TOKEN 已配置为:"
echo "   c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512"
echo ""
echo "2. 在 xianyu-auto-reply-fix 的 global_config.yml 中配置:"
echo ""
echo "   card_system:"
echo "     api_url: \"https://your-domain.com/api/supply/cards\""
echo "     api_token: \"c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512\""
echo "     headers:"
echo "       Authorization: \"Bearer c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512\""
echo "       Content-Type: \"application/json\""
echo "     request_template:"
echo "       poolCode: \"kiro\""
echo "       count: 10  # 每个卡密包含的账号数量"
echo "       order_id: \"{order_id}\""
echo "       warrantyHours: 168"
echo ""
echo "3. 现在可以部署了:"
echo ""
echo "   wrangler deploy"
echo ""
echo "4. 部署后测试 API:"
echo ""
echo "   curl -X POST https://your-domain.com/api/supply/cards \\"
echo "     -H \"Authorization: Bearer c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"poolCode\":\"kiro\",\"count\":1,\"order_id\":\"TEST-001\"}'"
echo ""
