#!/bin/bash

# Multi-Account Card Testing Script
# Usage: ./scripts/test-multi-account.sh [base_url]
# Example: ./scripts/test-multi-account.sh http://localhost:8788

set -e

BASE_URL=${1:-http://localhost:8788}
ADMIN_TOKEN=${ADMIN_TOKEN:-"your-admin-token"}

echo "=========================================="
echo "Multi-Account Card Testing"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test API
test_api() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=${5:-200}
    
    echo -n "Testing: $test_name... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAIL${NC} (Expected HTTP $expected_status, got $http_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "$body"
    fi
    
    echo ""
}

echo "=========================================="
echo "Test 1: Generate Multi-Account Card"
echo "=========================================="

# Generate a card with 10 accounts
test_api "Generate 10-account card" "POST" "/api/supply/cards" '{
  "typeId": 1,
  "count": 10,
  "warrantyHours": 168
}'

# Extract card code from response (you may need to adjust this based on actual response)
CARD_CODE=$(echo "$body" | jq -r '.cards[0].code' 2>/dev/null || echo "")

if [ -z "$CARD_CODE" ] || [ "$CARD_CODE" = "null" ]; then
    echo -e "${YELLOW}⚠️  Warning: Could not extract card code from response${NC}"
    echo "Please manually set CARD_CODE environment variable and re-run"
    echo ""
    echo "Example: CARD_CODE=your-card-code ./scripts/test-multi-account.sh"
    exit 1
fi

echo "Card code: $CARD_CODE"
echo ""

echo "=========================================="
echo "Test 2: First Redemption (Lazy Allocation)"
echo "=========================================="

test_api "Redeem card (first time)" "POST" "/api/redeem" "{
  \"cardCode\": \"$CARD_CODE\"
}"

# Check if response contains accountQuantity and accounts array
if echo "$body" | jq -e '.accountQuantity' > /dev/null 2>&1; then
    ACCOUNT_QUANTITY=$(echo "$body" | jq -r '.accountQuantity')
    echo -e "${GREEN}✅ accountQuantity found: $ACCOUNT_QUANTITY${NC}"
else
    echo -e "${RED}❌ accountQuantity not found in response${NC}"
fi

if echo "$body" | jq -e '.accounts' > /dev/null 2>&1; then
    ACCOUNTS_COUNT=$(echo "$body" | jq -r '.accounts | length')
    echo -e "${GREEN}✅ accounts array found: $ACCOUNTS_COUNT accounts${NC}"
else
    echo -e "${RED}❌ accounts array not found in response${NC}"
fi

echo ""

echo "=========================================="
echo "Test 3: Repeated Redemption (Idempotency)"
echo "=========================================="

test_api "Redeem card (second time)" "POST" "/api/redeem" "{
  \"cardCode\": \"$CARD_CODE\"
}"

# Check if reused flag is true
if echo "$body" | jq -e '.reused == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Idempotency verified: reused=true${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: reused flag not true${NC}"
fi

echo ""

echo "=========================================="
echo "Test 4: Support Page (Account Status Check)"
echo "=========================================="

test_api "Check card support status" "POST" "/api/card" "{
  \"cardCode\": \"$CARD_CODE\"
}"

# Check if response contains checkResult
if echo "$body" | jq -e '.checkResult' > /dev/null 2>&1; then
    CHECK_RESULT=$(echo "$body" | jq -r '.checkResult')
    echo -e "${GREEN}✅ checkResult found:${NC}"
    echo "$CHECK_RESULT" | jq '.'
else
    echo -e "${YELLOW}⚠️  checkResult not found (might be single-account mode)${NC}"
fi

echo ""

echo "=========================================="
echo "Test 5: Single-Account Card (Backward Compatibility)"
echo "=========================================="

# Generate a single-account card
test_api "Generate single-account card" "POST" "/api/supply/cards" '{
  "typeId": 1,
  "count": 1,
  "warrantyHours": 168
}'

SINGLE_CARD_CODE=$(echo "$body" | jq -r '.cards[0].code' 2>/dev/null || echo "")

if [ -n "$SINGLE_CARD_CODE" ] && [ "$SINGLE_CARD_CODE" != "null" ]; then
    echo "Single card code: $SINGLE_CARD_CODE"
    echo ""
    
    test_api "Redeem single-account card" "POST" "/api/redeem" "{
      \"cardCode\": \"$SINGLE_CARD_CODE\"
    }"
    
    # Check if response contains payloadRaw (not accounts array)
    if echo "$body" | jq -e '.payloadRaw' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backward compatibility verified: payloadRaw found${NC}"
    else
        echo -e "${RED}❌ payloadRaw not found in single-account response${NC}"
    fi
    
    if echo "$body" | jq -e '.accounts' > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Warning: accounts array found in single-account response${NC}"
    else
        echo -e "${GREEN}✅ Backward compatibility verified: no accounts array${NC}"
    fi
fi

echo ""

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
