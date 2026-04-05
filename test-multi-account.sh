#!/bin/bash

# 测试多账号卡密功能
# 使用方法: ./test-multi-account.sh

set -e

BASE_URL="http://localhost:3000"
SUPPLY_TOKEN="c59fc5b183693989e323494f72e92cb2d545c25fffefa4ffd29d7b87d69fc512"

echo "=========================================="
echo "多账号卡密功能测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试1: 生成单账号卡密
echo -e "${YELLOW}测试 1: 生成单账号卡密 (count=1)${NC}"
echo "请求: POST /api/supply/cards"
echo "参数: poolCode=test, count=1"
echo ""

RESPONSE_1=$(curl -s -X POST "$BASE_URL/api/supply/cards" \
  -H "Authorization: Bearer $SUPPLY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poolCode": "test",
    "count": 1,
    "deliveryRef": "TEST-SINGLE-'$(date +%s)'"
  }')

echo "响应:"
echo "$RESPONSE_1" | jq '.'
echo ""

CARD_CODE_1=$(echo "$RESPONSE_1" | grep -oE '[A-Z]+-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}' | head -1)
if [ -n "$CARD_CODE_1" ]; then
  echo -e "${GREEN}✓ 单账号卡密生成成功: $CARD_CODE_1${NC}"
else
  echo -e "${RED}✗ 单账号卡密生成失败${NC}"
  exit 1
fi
echo ""
echo "=========================================="
echo ""

# 测试2: 生成多账号卡密
echo -e "${YELLOW}测试 2: 生成多账号卡密 (count=10)${NC}"
echo "请求: POST /api/supply/cards"
echo "参数: poolCode=test, count=10"
echo ""

START_TIME=$(date +%s%3N)

RESPONSE_10=$(curl -s -X POST "$BASE_URL/api/supply/cards" \
  -H "Authorization: Bearer $SUPPLY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poolCode": "test",
    "count": 10,
    "deliveryRef": "TEST-MULTI-'$(date +%s)'"
  }')

END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

echo "响应:"
echo "$RESPONSE_10" | jq '.'
echo ""

CARD_CODE_10=$(echo "$RESPONSE_10" | grep -oE '[A-Z]+-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}' | head -1)
ACCOUNT_QUANTITY=$(echo "$RESPONSE_10" | grep -oE '包含 [0-9]+ 个账号' | grep -oE '[0-9]+' || echo "1")

if [ -n "$CARD_CODE_10" ]; then
  echo -e "${GREEN}✓ 多账号卡密生成成功: $CARD_CODE_10${NC}"
  echo -e "${GREEN}✓ 账号数量: $ACCOUNT_QUANTITY${NC}"
  echo -e "${GREEN}✓ 生成耗时: ${DURATION}ms${NC}"
else
  echo -e "${RED}✗ 多账号卡密生成失败${NC}"
  exit 1
fi
echo ""
echo "=========================================="
echo ""

# 测试3: 兑换单账号卡密
echo -e "${YELLOW}测试 3: 兑换单账号卡密${NC}"
echo "卡密: $CARD_CODE_1"
echo ""

REDEEM_1=$(curl -s -X POST "$BASE_URL/api/redeem" \
  -H "Content-Type: application/json" \
  -d '{
    "cardCode": "'"$CARD_CODE_1"'",
    "turnstileToken": "dummy-token"
  }')

echo "响应:"
echo "$REDEEM_1" | jq '.'
echo ""

if echo "$REDEEM_1" | jq -e '.payloadRaw' > /dev/null; then
  echo -e "${GREEN}✓ 单账号卡密兑换成功（返回 payloadRaw 格式）${NC}"
else
  echo -e "${RED}✗ 单账号卡密兑换失败${NC}"
fi
echo ""
echo "=========================================="
echo ""

# 测试4: 兑换多账号卡密（首次兑换，会分配账号）
echo -e "${YELLOW}测试 4: 首次兑换多账号卡密 (会分配10个账号)${NC}"
echo "卡密: $CARD_CODE_10"
echo ""

START_TIME=$(date +%s%3N)

REDEEM_10=$(curl -s -X POST "$BASE_URL/api/redeem" \
  -H "Content-Type: application/json" \
  -d '{
    "cardCode": "'"$CARD_CODE_10"'",
    "turnstileToken": "dummy-token"
  }')

END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

echo "响应:"
echo "$REDEEM_10" | jq '.'
echo ""

ACCOUNTS_COUNT=$(echo "$REDEEM_10" | jq -r '.accounts | length // 0')
ACCOUNT_QUANTITY_REDEEM=$(echo "$REDEEM_10" | jq -r '.accountQuantity // 0')

if [ "$ACCOUNTS_COUNT" -eq 10 ]; then
  echo -e "${GREEN}✓ 多账号卡密兑换成功${NC}"
  echo -e "${GREEN}✓ 返回账号数量: $ACCOUNTS_COUNT${NC}"
  echo -e "${GREEN}✓ accountQuantity: $ACCOUNT_QUANTITY_REDEEM${NC}"
  echo -e "${GREEN}✓ 首次兑换耗时: ${DURATION}ms${NC}"
  
  # 检查并行优化效果
  if [ "$DURATION" -lt 10000 ]; then
    echo -e "${GREEN}✓ 性能优秀！耗时 < 10秒${NC}"
  elif [ "$DURATION" -lt 20000 ]; then
    echo -e "${YELLOW}⚠ 性能一般，耗时 10-20秒${NC}"
  else
    echo -e "${RED}✗ 性能较差，耗时 > 20秒${NC}"
  fi
else
  echo -e "${RED}✗ 多账号卡密兑换失败，期望10个账号，实际: $ACCOUNTS_COUNT${NC}"
fi
echo ""
echo "=========================================="
echo ""

# 测试5: 再次兑换多账号卡密（应该直接返回，不重新分配）
echo -e "${YELLOW}测试 5: 再次兑换多账号卡密 (应该直接返回已分配的账号)${NC}"
echo "卡密: $CARD_CODE_10"
echo ""

START_TIME=$(date +%s%3N)

REDEEM_10_AGAIN=$(curl -s -X POST "$BASE_URL/api/redeem" \
  -H "Content-Type: application/json" \
  -d '{
    "cardCode": "'"$CARD_CODE_10"'",
    "turnstileToken": "dummy-token"
  }')

END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

echo "响应:"
echo "$REDEEM_10_AGAIN" | jq '.'
echo ""

REUSED=$(echo "$REDEEM_10_AGAIN" | jq -r '.reused // false')

if [ "$REUSED" = "true" ]; then
  echo -e "${GREEN}✓ 幂等性测试通过（reused=true）${NC}"
  echo -e "${GREEN}✓ 再次兑换耗时: ${DURATION}ms (应该很快)${NC}"
else
  echo -e "${RED}✗ 幂等性测试失败（reused应该为true）${NC}"
fi
echo ""
echo "=========================================="
echo ""

# 测试总结
echo -e "${GREEN}=========================================="
echo "测试完成！"
echo "==========================================${NC}"
echo ""
echo "测试卡密:"
echo "  单账号: $CARD_CODE_1"
echo "  多账号: $CARD_CODE_10"
echo ""
echo "你可以在浏览器中访问兑换页面测试:"
echo "  $BASE_URL/redeem"
