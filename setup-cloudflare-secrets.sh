#!/bin/bash

# Cloudflare Workers 密钥配置脚本
# 用于配置生产环境的所有必需密钥

set -e

echo "=========================================="
echo "Cloudflare Workers 密钥配置"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否安装了 wrangler
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}错误: 未找到 wrangler 命令${NC}"
    echo "请先安装 wrangler: npm install -g wrangler"
    exit 1
fi

echo -e "${BLUE}准备配置以下密钥到 Cloudflare Workers:${NC}"
echo ""
echo "1. SUPPLY_API_TOKEN - 供货 API 认证密钥"
echo "2. ADMIN_PASSWORD - 管理员密码"
echo "3. SESSION_SECRET - 会话加密密钥"
echo "4. CARD_HASH_SECRET - 卡密哈希密钥"
echo "5. RATE_LIMIT_ENABLED - 速率限制开关"
echo ""

read -p "是否继续? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

echo ""
echo "=========================================="
echo "1/5 配置 SUPPLY_API_TOKEN"
echo "=========================================="
echo ""
echo -e "${YELLOW}这是外部发货系统调用 API 时使用的认证密钥${NC}"
echo ""
echo "已生成的 Token:"
echo -e "${GREEN}c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512${NC}"
echo ""
echo "请复制上面的 Token，然后按回车键继续..."
read
echo "c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512" | wrangler secret put SUPPLY_API_TOKEN
echo -e "${GREEN}✓ SUPPLY_API_TOKEN 配置完成${NC}"
echo ""

echo "=========================================="
echo "2/5 配置 ADMIN_PASSWORD"
echo "=========================================="
echo ""
echo -e "${YELLOW}这是管理后台的登录密码${NC}"
echo "建议使用强密码（至少 12 位，包含大小写字母、数字、特殊字符）"
echo ""
wrangler secret put ADMIN_PASSWORD
echo -e "${GREEN}✓ ADMIN_PASSWORD 配置完成${NC}"
echo ""

echo "=========================================="
echo "3/5 配置 SESSION_SECRET"
echo "=========================================="
echo ""
echo -e "${YELLOW}这是用于加密管理员会话的密钥${NC}"
echo ""
echo "生成随机密钥..."
SESSION_SECRET=$(openssl rand -hex 32)
echo "已生成: $SESSION_SECRET"
echo ""
echo "$SESSION_SECRET" | wrangler secret put SESSION_SECRET
echo -e "${GREEN}✓ SESSION_SECRET 配置完成${NC}"
echo ""

echo "=========================================="
echo "4/5 配置 CARD_HASH_SECRET"
echo "=========================================="
echo ""
echo -e "${YELLOW}这是用于加密存储卡密的密钥${NC}"
echo -e "${YELLOW}⚠️  重要: 此密钥一旦设置不要更改！${NC}"
echo ""
echo "生成随机密钥..."
CARD_HASH_SECRET=$(openssl rand -hex 32)
echo "已生成: $CARD_HASH_SECRET"
echo ""
echo "$CARD_HASH_SECRET" | wrangler secret put CARD_HASH_SECRET
echo -e "${GREEN}✓ CARD_HASH_SECRET 配置完成${NC}"
echo ""

echo "=========================================="
echo "5/5 配置 RATE_LIMIT_ENABLED"
echo "=========================================="
echo ""
echo -e "${YELLOW}启用速率限制以防止滥用${NC}"
echo ""
echo "true" | wrangler secret put RATE_LIMIT_ENABLED
echo -e "${GREEN}✓ RATE_LIMIT_ENABLED 配置完成${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}✓ 所有密钥配置完成！${NC}"
echo "=========================================="
echo ""
echo "配置摘要:"
echo "  ✓ SUPPLY_API_TOKEN: c59fc5b1...c512"
echo "  ✓ ADMIN_PASSWORD: (已设置)"
echo "  ✓ SESSION_SECRET: $SESSION_SECRET"
echo "  ✓ CARD_HASH_SECRET: $CARD_HASH_SECRET"
echo "  ✓ RATE_LIMIT_ENABLED: true"
echo ""
echo -e "${BLUE}重要提示:${NC}"
echo "1. 请将以下密钥保存到安全的地方（密码管理器）："
echo ""
echo "   SUPPLY_API_TOKEN=c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512"
echo "   SESSION_SECRET=$SESSION_SECRET"
echo "   CARD_HASH_SECRET=$CARD_HASH_SECRET"
echo ""
echo "2. 在 xianyu-auto-reply-fix 中配置 SUPPLY_API_TOKEN："
echo ""
echo "   api_token: c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512"
echo "   Authorization: Bearer c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512"
echo ""
echo "3. 现在可以部署了："
echo ""
echo "   wrangler deploy"
echo ""
