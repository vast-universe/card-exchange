#!/bin/bash

# Generate test cards for multi-account card testing
# This script generates cards directly in the database using SQL

set -e

# Find database file
DB_FILE=$(find .wrangler/state/v3/d1 -name "*.sqlite" -type f | head -n 1)

if [ -z "$DB_FILE" ]; then
    echo "❌ Database file not found"
    exit 1
fi

echo "Database: $DB_FILE"
echo ""

# Helper function to generate card code
generate_card_code() {
    local prefix=$1
    local random=$(openssl rand -hex 6 | tr '[:lower:]' '[:upper:]')
    echo "${prefix}-${random:0:6}${random:6:6}"
}

# Helper function to hash card code
hash_card_code() {
    local code=$1
    local secret="test-card-hash-secret"
    echo -n "${code}${secret}" | openssl dgst -sha256 | awk '{print $2}'
}

# Get current timestamp
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

echo "Checking database..."
echo ""

# Check account types
echo "Available account types:"
sqlite3 "$DB_FILE" "SELECT '  - ' || code || ': ' || name FROM account_types;"
echo ""

# Check accounts
ACCOUNT_STATS=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) || ' total, ' || SUM(CASE WHEN stock_status='available' THEN 1 ELSE 0 END) || ' available' FROM accounts;")
echo "Account pool: $ACCOUNT_STATS"
echo ""

echo "=========================================="
echo "Generating test cards..."
echo "=========================================="
echo ""

# Function to generate cards
generate_cards() {
    local pool_code=$1
    local count=$2
    local account_quantity=$3
    local aftersale_limit=$4
    local warranty_hours=$5
    
    echo "Generating $count cards with $account_quantity accounts each..."
    echo "Pool: $pool_code, Warranty: ${warranty_hours}h, Aftersale: $aftersale_limit"
    
    local prefix=$(echo "$pool_code" | tr '[:lower:]' '[:upper:]' | sed 's/[^A-Z0-9]//g' | cut -c1-4)
    if [ -z "$prefix" ]; then
        prefix="CARD"
    fi
    
    for i in $(seq 1 $count); do
        local code=$(generate_card_code "$prefix")
        local code_hash=$(hash_card_code "$code")
        
        sqlite3 "$DB_FILE" "INSERT INTO cards (code_plain, code_hash, pool_code, account_quantity, aftersale_limit, aftersale_used, warranty_hours, status, created_at) VALUES ('$code', '$code_hash', '$pool_code', $account_quantity, $aftersale_limit, 0, $warranty_hours, 'normal', '$NOW');"
        
        if [ $i -le 3 ]; then
            echo "  $i. $code"
        fi
    done
    
    if [ $count -gt 3 ]; then
        echo "  ... and $((count - 3)) more"
    fi
    
    echo "✅ Generated $count cards"
    echo ""
}

# 1. Single-account cards (backward compatibility)
generate_cards "test-type" 5 1 1 168

# 2. Multi-account cards (10 accounts each)
generate_cards "test-type" 10 10 10 168

# 3. Multi-account cards (5 accounts each)
generate_cards "test-type" 5 5 5 72

# Summary
echo "=========================================="
echo "Database Summary"
echo "=========================================="

CARD_STATS=$(sqlite3 "$DB_FILE" "SELECT 
    'Total cards: ' || COUNT(*) || '
Available for Supply API: ' || SUM(CASE WHEN delivered_at IS NULL THEN 1 ELSE 0 END) || '
Single-account cards: ' || SUM(CASE WHEN account_quantity = 1 THEN 1 ELSE 0 END) || '
Multi-account cards: ' || SUM(CASE WHEN account_quantity > 1 THEN 1 ELSE 0 END)
FROM cards;")

echo "$CARD_STATS"
echo ""
echo "✅ Test cards generated successfully!"
echo ""
echo "You can now test the Supply API:"
echo "  curl -X POST http://localhost:3000/api/supply/cards \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -H \"Authorization: Bearer test-supply-api-token\" \\"
echo "    -d '{\"poolCode\":\"test-type\",\"count\":10}'"
echo ""
