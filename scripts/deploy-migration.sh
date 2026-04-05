#!/bin/bash

# Database Migration Deployment Script
# Usage: ./scripts/deploy-migration.sh [environment]
# Environment: local | production

set -e

ENVIRONMENT=${1:-local}
MIGRATION_FILE="migrations/0002_multi_account_cards.sql"
VERIFY_FILE="migrations/verify-0002.sql"

echo "=========================================="
echo "Database Migration Deployment"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Migration: $MIGRATION_FILE"
echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Confirm before proceeding
read -p "⚠️  This will modify the database. Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Migration cancelled"
    exit 0
fi

if [ "$ENVIRONMENT" = "local" ]; then
    echo "Deploying to local SQLite database..."
    
    # Find the SQLite database file
    DB_FILE=$(find .wrangler/state/v3/d1 -name "*.sqlite" -type f | head -n 1)
    
    if [ -z "$DB_FILE" ]; then
        echo "❌ Error: SQLite database file not found"
        exit 1
    fi
    
    echo "Database: $DB_FILE"
    echo ""
    
    # Execute migration
    echo "Executing migration..."
    sqlite3 "$DB_FILE" < "$MIGRATION_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration executed successfully"
    else
        echo "❌ Error: Migration failed"
        exit 1
    fi
    
    # Run verification
    if [ -f "$VERIFY_FILE" ]; then
        echo ""
        echo "Running verification..."
        sqlite3 "$DB_FILE" < "$VERIFY_FILE"
        
        if [ $? -eq 0 ]; then
            echo "✅ Verification passed"
        else
            echo "⚠️  Warning: Verification failed"
        fi
    fi
    
    # Show table info
    echo ""
    echo "Migration results:"
    sqlite3 "$DB_FILE" "
        SELECT 'card_account_pool records: ' || COUNT(*) FROM card_account_pool
        UNION ALL
        SELECT 'cards with account_quantity: ' || COUNT(*) FROM cards WHERE account_quantity IS NOT NULL
        UNION ALL
        SELECT 'cards with account_quantity=1: ' || COUNT(*) FROM cards WHERE account_quantity = 1;
    "

elif [ "$ENVIRONMENT" = "production" ]; then
    echo "Deploying to production Cloudflare D1 database..."
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        echo "❌ Error: wrangler CLI not found"
        echo "Please install: npm install -g wrangler"
        exit 1
    fi
    
    # Get database name from wrangler.toml
    DB_NAME=$(grep -A 5 "d1_databases" wrangler.toml | grep "database_name" | cut -d'"' -f2)
    
    if [ -z "$DB_NAME" ]; then
        echo "❌ Error: Database name not found in wrangler.toml"
        exit 1
    fi
    
    echo "Database name: $DB_NAME"
    echo ""
    
    # Execute migration
    echo "Executing migration..."
    wrangler d1 execute "$DB_NAME" --file="$MIGRATION_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration executed successfully"
    else
        echo "❌ Error: Migration failed"
        exit 1
    fi
    
    # Run verification
    if [ -f "$VERIFY_FILE" ]; then
        echo ""
        echo "Running verification..."
        wrangler d1 execute "$DB_NAME" --file="$VERIFY_FILE"
        
        if [ $? -eq 0 ]; then
            echo "✅ Verification passed"
        else
            echo "⚠️  Warning: Verification failed"
        fi
    fi
    
    # Show migration results
    echo ""
    echo "Checking migration results..."
    wrangler d1 execute "$DB_NAME" --command="
        SELECT 'card_account_pool records: ' || COUNT(*) FROM card_account_pool
        UNION ALL
        SELECT 'cards with account_quantity: ' || COUNT(*) FROM cards WHERE account_quantity IS NOT NULL
        UNION ALL
        SELECT 'cards with account_quantity=1: ' || COUNT(*) FROM cards WHERE account_quantity = 1;
    "

else
    echo "❌ Error: Invalid environment '$ENVIRONMENT'"
    echo "Usage: $0 [local|production]"
    exit 1
fi

echo ""
echo "=========================================="
echo "Migration Complete"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Status: ✅ Success"
echo ""
echo "Next steps:"
echo "1. Verify the migration results above"
echo "2. Test basic functionality"
echo "3. Deploy application code"
echo "=========================================="
