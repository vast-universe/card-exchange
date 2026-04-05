#!/bin/bash

# 生产环境部署脚本
# 此脚本将引导你完成生产环境的部署流程

set -e

echo "=========================================="
echo "生产环境部署脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}错误: wrangler 未安装${NC}"
    echo "请运行: npm install -g wrangler"
    exit 1
fi

# 获取数据库名称
echo -e "${YELLOW}步骤 1: 获取数据库信息${NC}"
echo "正在查询 D1 数据库列表..."
wrangler d1 list

echo ""
read -p "请输入数据库名称（例如：card-exchange-db）: " DB_NAME

if [ -z "$DB_NAME" ]; then
    echo -e "${RED}错误: 数据库名称不能为空${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 数据库名称: $DB_NAME${NC}"
echo ""

# 备份数据库
echo -e "${YELLOW}步骤 2: 备份生产数据库${NC}"
BACKUP_FILE="backup-$(date +%Y%m%d_%H%M%S).sql"
echo "正在导出数据库到: $BACKUP_FILE"

wrangler d1 export "$DB_NAME" --output="$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo -e "${GREEN}✓ 备份成功: $BACKUP_FILE ($BACKUP_SIZE)${NC}"
else
    echo -e "${RED}错误: 备份失败${NC}"
    exit 1
fi

echo ""
read -p "是否继续部署？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "部署已取消"
    exit 0
fi

# 检查当前数据库状态
echo ""
echo -e "${YELLOW}步骤 3: 检查当前数据库状态${NC}"

echo "正在统计数据..."
CARDS_COUNT=$(wrangler d1 execute "$DB_NAME" --command="SELECT COUNT(*) as count FROM cards;" --json | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
BINDINGS_COUNT=$(wrangler d1 execute "$DB_NAME" --command="SELECT COUNT(*) as count FROM bindings WHERE status='active';" --json | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
ACCOUNTS_COUNT=$(wrangler d1 execute "$DB_NAME" --command="SELECT COUNT(*) as count FROM accounts;" --json | grep -o '"count":[0-9]*' | grep -o '[0-9]*')

echo "当前数据统计:"
echo "  - 卡密总数: $CARDS_COUNT"
echo "  - 活跃绑定: $BINDINGS_COUNT"
echo "  - 账号总数: $ACCOUNTS_COUNT"

echo ""
echo "检查 card_account_pool 表是否存在..."
POOL_EXISTS=$(wrangler d1 execute "$DB_NAME" --command="SELECT name FROM sqlite_master WHERE type='table' AND name='card_account_pool';" --json | grep -c "card_account_pool" || echo "0")

if [ "$POOL_EXISTS" -eq "0" ]; then
    echo -e "${YELLOW}⚠ card_account_pool 表不存在，需要创建并迁移数据${NC}"
    NEED_MIGRATION=true
else
    echo -e "${GREEN}✓ card_account_pool 表已存在${NC}"
    POOL_COUNT=$(wrangler d1 execute "$DB_NAME" --command="SELECT COUNT(*) as count FROM card_account_pool;" --json | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
    echo "  - card_account_pool 记录数: $POOL_COUNT"
    NEED_MIGRATION=false
fi

# 检查 account_quantity 字段
echo ""
echo "检查 cards 表的 account_quantity 字段..."
FIELD_EXISTS=$(wrangler d1 execute "$DB_NAME" --command="PRAGMA table_info(cards);" --json | grep -c "account_quantity" || echo "0")

if [ "$FIELD_EXISTS" -eq "0" ]; then
    echo -e "${YELLOW}⚠ account_quantity 字段不存在，需要添加${NC}"
    NEED_FIELD=true
else
    echo -e "${GREEN}✓ account_quantity 字段已存在${NC}"
    NEED_FIELD=false
fi

# 执行数据迁移
if [ "$NEED_MIGRATION" = true ]; then
    echo ""
    echo -e "${YELLOW}步骤 4: 执行数据迁移${NC}"
    echo "正在执行迁移脚本..."
    
    wrangler d1 execute "$DB_NAME" --file=scripts/migrate-bindings-to-pool.sql
    
    echo -e "${GREEN}✓ 数据迁移完成${NC}"
    
    # 验证迁移结果
    echo ""
    echo "验证迁移结果..."
    POOL_COUNT_AFTER=$(wrangler d1 execute "$DB_NAME" --command="SELECT COUNT(*) as count FROM card_account_pool;" --json | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
    echo "  - card_account_pool 记录数: $POOL_COUNT_AFTER"
    
    if [ "$POOL_COUNT_AFTER" -eq "$BINDINGS_COUNT" ]; then
        echo -e "${GREEN}✓ 迁移验证成功: bindings ($BINDINGS_COUNT) = card_account_pool ($POOL_COUNT_AFTER)${NC}"
    else
        echo -e "${YELLOW}⚠ 警告: 记录数不匹配 - bindings: $BINDINGS_COUNT, card_account_pool: $POOL_COUNT_AFTER${NC}"
        read -p "是否继续？(y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "部署已取消"
            exit 0
        fi
    fi
else
    echo ""
    echo -e "${GREEN}步骤 4: 跳过数据迁移（已完成）${NC}"
fi

# 添加 account_quantity 字段
if [ "$NEED_FIELD" = true ]; then
    echo ""
    echo -e "${YELLOW}步骤 5: 添加 account_quantity 字段${NC}"
    
    wrangler d1 execute "$DB_NAME" --command="ALTER TABLE cards ADD COLUMN account_quantity INTEGER NOT NULL DEFAULT 1;"
    
    echo -e "${GREEN}✓ 字段添加完成${NC}"
else
    echo ""
    echo -e "${GREEN}步骤 5: 跳过字段添加（已存在）${NC}"
fi

# 部署代码
echo ""
echo -e "${YELLOW}步骤 6: 部署代码到 Cloudflare Workers${NC}"
echo "正在部署..."

wrangler deploy

echo -e "${GREEN}✓ 代码部署完成${NC}"

# 验证部署
echo ""
echo -e "${YELLOW}步骤 7: 验证部署${NC}"
echo ""
echo "请手动验证以下功能:"
echo "  1. 访问管理后台并登录"
echo "  2. 生成一个单账号卡密（每卡账号数 = 1）"
echo "  3. 生成一个多账号卡密（每卡账号数 = 5）"
echo "  4. 兑换单账号卡密，验证显示正常"
echo "  5. 兑换多账号卡密，验证显示正常"
echo "  6. 访问售后页面，验证账号检测功能"
echo ""

# 测试供货 API
echo -e "${YELLOW}步骤 8: 测试供货 API${NC}"
echo ""
read -p "请输入你的域名（例如：your-domain.com）: " DOMAIN

if [ -n "$DOMAIN" ]; then
    echo ""
    echo "测试单账号卡密..."
    curl -X POST "https://$DOMAIN/api/supply/cards" \
      -H "Authorization: Bearer c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512" \
      -H "Content-Type: application/json" \
      -d '{
        "poolCode": "kiro",
        "count": 1,
        "order_id": "PROD-TEST-001",
        "warrantyHours": 168
      }'
    
    echo ""
    echo ""
    echo "测试多账号卡密..."
    curl -X POST "https://$DOMAIN/api/supply/cards" \
      -H "Authorization: Bearer c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512" \
      -H "Content-Type: application/json" \
      -d '{
        "poolCode": "kiro",
        "count": 5,
        "order_id": "PROD-TEST-002",
        "warrantyHours": 168
      }'
    
    echo ""
fi

# 完成
echo ""
echo "=========================================="
echo -e "${GREEN}部署完成！${NC}"
echo "=========================================="
echo ""
echo "备份文件: $BACKUP_FILE"
echo ""
echo "后续步骤:"
echo "  1. 监控错误日志: wrangler tail"
echo "  2. 检查 Cloudflare Dashboard 的日志"
echo "  3. 关注用户反馈"
echo ""
echo "如遇问题，可以回滚:"
echo "  - 代码回滚: wrangler rollback"
echo "  - 数据库回滚: wrangler d1 execute $DB_NAME --file=$BACKUP_FILE"
echo ""
echo -e "${GREEN}祝部署顺利！🚀${NC}"
