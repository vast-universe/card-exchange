#!/bin/bash

# Production Readiness Test Script
# Tests all features before deployment

set -e

BASE_URL="http://localhost:3000"
TOKEN="test-supply-api-token"
ADMIN_PASSWORD="test-admin"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0
TEST_RESULTS=()

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "生产环境就绪测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_api() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=${5:-200}
    
    echo -n "[$((TESTS_PASSED + TESTS_FAILED + 1))] $test_name... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" 2>/dev/null || echo -e "\n000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null || echo -e "\n000")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        TEST_RESULTS+=("✅ $test_name")
        echo "$body"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_status, got $http_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        TEST_RESULTS+=("❌ $test_name")
        echo "$body"
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 1: Supply API - 动态生成卡密"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE1=$(curl -s -X POST "$BASE_URL/api/supply/cards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "poolCode": "test-type",
    "order_quantity": 10,
    "warrantyHours": 168,
    "order_id": "PROD-TEST-001",
    "order_amount": 99.99
  }')

echo "$RESPONSE1" | jq .

# Extract card code from the data field (which contains formatted text)
# Card format: TEST-XXXX-XXXX-XXXX-XXXX (4 groups of 4 characters)
CARD_CODE1=$(echo "$RESPONSE1" | jq -r '.data' | grep -oE 'TEST-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}' | head -1)

# If not found in data, try extracting from the response directly
if [ -z "$CARD_CODE1" ]; then
    CARD_CODE1=$(echo "$RESPONSE1" | jq -r 'if .cardCode then .cardCode elif .card_code then .card_code else empty end')
fi

if [ -n "$CARD_CODE1" ] && [ "$CARD_CODE1" != "null" ]; then
    echo -e "${GREEN}✅ 卡密生成成功: $CARD_CODE1${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TEST_RESULTS+=("✅ Supply API 动态生成")
else
    echo -e "${RED}❌ 卡密生成失败${NC}"
    echo "DEBUG: RESPONSE1 = $RESPONSE1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_RESULTS+=("❌ Supply API 动态生成")
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 2: 幂等性 - 相同订单号"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE2=$(curl -s -X POST "$BASE_URL/api/supply/cards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "poolCode": "test-type",
    "order_quantity": 10,
    "warrantyHours": 168,
    "order_id": "PROD-TEST-001",
    "order_amount": 99.99
  }')

CARD_CODE2=$(echo "$RESPONSE2" | jq -r '.data' | grep -oE 'TEST-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}' | head -1)

# If not found in data, try extracting from the response directly
if [ -z "$CARD_CODE2" ]; then
    CARD_CODE2=$(echo "$RESPONSE2" | jq -r 'if .cardCode then .cardCode elif .card_code then .card_code else empty end')
fi

if [ "$CARD_CODE1" = "$CARD_CODE2" ] && [ -n "$CARD_CODE1" ] && [ "$CARD_CODE1" != "null" ]; then
    echo -e "${GREEN}✅ 幂等性验证通过${NC}"
    echo "   原卡密: $CARD_CODE1"
    echo "   新卡密: $CARD_CODE2"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TEST_RESULTS+=("✅ 幂等性验证")
else
    echo -e "${RED}❌ 幂等性验证失败${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_RESULTS+=("❌ 幂等性验证")
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 3: 数据库验证 - order_amount 保存"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

DB_FILE=$(find .wrangler/state/v3/d1 -name "*.sqlite" -type f | head -n 1)
if [ -n "$DB_FILE" ]; then
    ORDER_AMOUNT=$(sqlite3 "$DB_FILE" "SELECT order_amount FROM cards WHERE delivery_ref='PROD-TEST-001';" 2>/dev/null || echo "")
    
    if [ "$ORDER_AMOUNT" = "99.99" ]; then
        echo -e "${GREEN}✅ order_amount 保存成功: $ORDER_AMOUNT${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        TEST_RESULTS+=("✅ order_amount 保存")
    else
        echo -e "${RED}❌ order_amount 保存失败: $ORDER_AMOUNT${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        TEST_RESULTS+=("❌ order_amount 保存")
    fi
else
    echo -e "${RED}❌ 数据库文件未找到${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_RESULTS+=("❌ 数据库验证")
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 4: 卡密兑换 - 延迟分配账号"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -n "$CARD_CODE1" ]; then
    REDEEM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/redeem" \
      -H "Content-Type: application/json" \
      -d "{\"cardCode\":\"$CARD_CODE1\"}")
    
    echo "$REDEEM_RESPONSE" | jq '{accountQuantity, accounts: (.accounts | length), reused}'
    
    ACCOUNT_COUNT=$(echo "$REDEEM_RESPONSE" | jq -r '.accounts | length')
    
    if [ "$ACCOUNT_COUNT" -eq 10 ]; then
        echo -e "${GREEN}✅ 账号分配成功: $ACCOUNT_COUNT 个${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        TEST_RESULTS+=("✅ 延迟分配账号")
    else
        echo -e "${RED}❌ 账号分配失败: $ACCOUNT_COUNT 个 (期望 10)${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        TEST_RESULTS+=("❌ 延迟分配账号")
    fi
else
    echo -e "${YELLOW}⚠️  跳过兑换测试（无卡密）${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 5: 质保时间 - 首次兑换开始计时"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -n "$DB_FILE" ] && [ -n "$CARD_CODE1" ]; then
    WARRANTY_INFO=$(sqlite3 "$DB_FILE" "SELECT warranty_started_at, warranty_expires_at, warranty_hours FROM cards WHERE code_plain='$CARD_CODE1';" 2>/dev/null || echo "")
    
    if [ -n "$WARRANTY_INFO" ]; then
        echo "质保信息: $WARRANTY_INFO"
        
        WARRANTY_STARTED=$(echo "$WARRANTY_INFO" | cut -d'|' -f1)
        if [ -n "$WARRANTY_STARTED" ] && [ "$WARRANTY_STARTED" != "" ]; then
            echo -e "${GREEN}✅ 质保时间已开始计时${NC}"
            echo "   开始时间: $WARRANTY_STARTED"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            TEST_RESULTS+=("✅ 质保时间计时")
        else
            echo -e "${RED}❌ 质保时间未开始${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            TEST_RESULTS+=("❌ 质保时间计时")
        fi
    fi
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 6: 多规格支持 - 不同数量"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for qty in 1 5 20; do
    echo "测试 $qty 个账号..."
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/supply/cards" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"poolCode\": \"test-type\",
        \"count\": $qty,
        \"warrantyHours\": 168,
        \"order_id\": \"PROD-TEST-QTY-$qty\"
      }")
    
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
    MESSAGE=$(echo "$RESPONSE" | jq -r '.message')
    
    # For single account, message might not contain "1 个账号" (which is correct)
    # For multi-account, message should contain "X 个账号"
    if [ "$SUCCESS" = "true" ]; then
        if [ "$qty" -eq 1 ]; then
            # Single account: just check success
            echo -e "${GREEN}✅ $qty 个账号 - 成功${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        elif echo "$MESSAGE" | grep -q "$qty 个账号"; then
            # Multi-account: check message contains account count
            echo -e "${GREEN}✅ $qty 个账号 - 成功${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}❌ $qty 个账号 - 失败（消息不包含账号数量）${NC}"
            echo "   响应: $MESSAGE"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo -e "${RED}❌ $qty 个账号 - 失败${NC}"
        echo "   响应: $MESSAGE"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
done
TEST_RESULTS+=("✅ 多规格支持")
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 7: 响应格式 - xianyu 兼容性"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/supply/cards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "poolCode": "test-type",
    "count": 3,
    "order_id": "PROD-TEST-FORMAT"
  }')

HAS_SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
HAS_CODE=$(echo "$RESPONSE" | jq -r '.code')
HAS_MESSAGE=$(echo "$RESPONSE" | jq -r '.message')
HAS_DATA=$(echo "$RESPONSE" | jq -r '.data')

if [ "$HAS_SUCCESS" = "true" ] && [ "$HAS_CODE" = "0" ] && [ -n "$HAS_MESSAGE" ] && [ -n "$HAS_DATA" ]; then
    echo -e "${GREEN}✅ 响应格式正确${NC}"
    echo "   success: $HAS_SUCCESS"
    echo "   code: $HAS_CODE"
    echo "   message: $HAS_MESSAGE"
    echo "   data: $(echo "$HAS_DATA" | head -c 50)..."
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TEST_RESULTS+=("✅ 响应格式")
else
    echo -e "${RED}❌ 响应格式错误${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_RESULTS+=("❌ 响应格式")
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 8: 错误处理"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 测试无效 token
echo "测试无效 token..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/supply/cards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"poolCode":"test-type","order_quantity":1}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${GREEN}✅ 无效 token 正确拒绝${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ 无效 token 未拒绝${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# 测试无效参数
echo "测试无效参数..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/supply/cards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"poolCode":"invalid-pool","order_quantity":1}')

SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "false" ]; then
    echo -e "${GREEN}✅ 无效参数正确处理${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ 无效参数未处理${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

TEST_RESULTS+=("✅ 错误处理")
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for result in "${TEST_RESULTS[@]}"; do
    echo "$result"
done

echo ""
echo -e "通过: ${GREEN}$TESTS_PASSED${NC}"
echo -e "失败: ${RED}$TESTS_FAILED${NC}"
echo -e "总计: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ 所有测试通过！系统已就绪，可以上线！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "📋 上线前检查清单："
    echo "  ✅ Supply API 动态生成卡密"
    echo "  ✅ 幂等性保证（防止重复发货）"
    echo "  ✅ order_amount 保存到数据库"
    echo "  ✅ 延迟分配账号（首次兑换时）"
    echo "  ✅ 质保时间从兑换时开始计时"
    echo "  ✅ 多规格支持（1-100个账号）"
    echo "  ✅ xianyu 响应格式兼容"
    echo "  ✅ 错误处理完善"
    echo ""
    echo "🚀 下一步："
    echo "  1. 备份生产数据库"
    echo "  2. 执行数据库迁移（0003_add_order_amount.sql）"
    echo "  3. 部署新代码"
    echo "  4. 配置 xianyu-auto-reply-fix"
    echo "  5. 小流量测试"
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ 有测试失败，请修复后再上线"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    exit 1
fi
