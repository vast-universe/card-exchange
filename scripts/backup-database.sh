#!/bin/bash

# Database Backup Script for Multi-Account Card Migration
# Usage: ./scripts/backup-database.sh [environment]
# Environment: local | production

set -e

ENVIRONMENT=${1:-local}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "Database Backup Script"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $TIMESTAMP"
echo ""

if [ "$ENVIRONMENT" = "local" ]; then
    echo "Backing up local SQLite database..."
    
    # Find the SQLite database file
    DB_FILE=$(find .wrangler/state/v3/d1 -name "*.sqlite" -type f | head -n 1)
    
    if [ -z "$DB_FILE" ]; then
        echo "❌ Error: SQLite database file not found"
        exit 1
    fi
    
    BACKUP_FILE="$BACKUP_DIR/local-backup-$TIMESTAMP.sqlite"
    
    # Copy the database file
    cp "$DB_FILE" "$BACKUP_FILE"
    
    echo "✅ Backup completed: $BACKUP_FILE"
    echo "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # Verify backup integrity
    echo ""
    echo "Verifying backup integrity..."
    sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup integrity verified"
    else
        echo "❌ Warning: Backup integrity check failed"
        exit 1
    fi
    
    # Show table counts
    echo ""
    echo "Table record counts:"
    sqlite3 "$BACKUP_FILE" "
        SELECT 'cards: ' || COUNT(*) FROM cards
        UNION ALL
        SELECT 'accounts: ' || COUNT(*) FROM accounts
        UNION ALL
        SELECT 'bindings: ' || COUNT(*) FROM bindings
        UNION ALL
        SELECT 'account_types: ' || COUNT(*) FROM account_types;
    "

elif [ "$ENVIRONMENT" = "production" ]; then
    echo "Backing up production Cloudflare D1 database..."
    
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
    
    BACKUP_FILE="$BACKUP_DIR/production-backup-$TIMESTAMP.sql"
    
    # Export database using wrangler
    wrangler d1 export "$DB_NAME" --output="$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup completed: $BACKUP_FILE"
        echo "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
    else
        echo "❌ Error: Backup failed"
        exit 1
    fi
    
    # Show backup info
    echo ""
    echo "Backup file contains:"
    grep -c "INSERT INTO" "$BACKUP_FILE" || echo "0"
    echo "INSERT statements"

else
    echo "❌ Error: Invalid environment '$ENVIRONMENT'"
    echo "Usage: $0 [local|production]"
    exit 1
fi

echo ""
echo "=========================================="
echo "Backup Summary"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Backup file: $BACKUP_FILE"
echo "Timestamp: $TIMESTAMP"
echo ""
echo "⚠️  IMPORTANT: Store this backup in a safe location!"
echo "=========================================="
