#!/usr/bin/env node

/**
 * Generate test cards for multi-account card testing
 * This script generates cards directly in the database
 */

import { randomBytes, createHash } from 'crypto';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find the database file
const dbPath = process.argv[2] || join(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/aaa292c0bb3ed3b2f26cd902cfbbd7a5cfb659ee409a32890b0e613fd9554050.sqlite');

console.log('Database path:', dbPath);

const db = new Database(dbPath);

// Helper functions (matching card-exchange logic)
function createCardCode(prefix) {
  const randomPart = randomBytes(8).toString('hex').toUpperCase();
  return `${prefix}-${randomPart.slice(0, 6)}${randomPart.slice(6, 12)}`;
}

function hashCardCode(code) {
  const secret = 'test-card-hash-secret'; // From .dev.vars
  return createHash('sha256').update(code + secret).digest('hex');
}

function nowIso() {
  return new Date().toISOString();
}

// Generate cards
function generateCards(options) {
  const {
    poolCode = 'test-type',
    count = 10,
    accountQuantity = 10,
    aftersaleLimit = 10,
    warrantyHours = 168
  } = options;

  const prefix = poolCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'CARD';
  const createdAt = nowIso();
  const generated = [];

  console.log(`\nGenerating ${count} cards with ${accountQuantity} accounts each...`);
  console.log(`Pool: ${poolCode}, Warranty: ${warrantyHours}h, Aftersale: ${aftersaleLimit}`);

  const insert = db.prepare(`
    INSERT INTO cards (
      code_plain,
      code_hash,
      pool_code,
      account_quantity,
      aftersale_limit,
      aftersale_used,
      warranty_hours,
      status,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, 0, ?, 'normal', ?)
  `);

  for (let i = 0; i < count; i++) {
    const code = createCardCode(prefix);
    const codeHash = hashCardCode(code);

    insert.run(
      code,
      codeHash,
      poolCode,
      accountQuantity,
      aftersaleLimit,
      warrantyHours,
      createdAt
    );

    generated.push(code);
  }

  console.log(`✅ Generated ${generated.length} cards`);
  console.log('\nSample cards:');
  generated.slice(0, 3).forEach((code, i) => {
    console.log(`  ${i + 1}. ${code}`);
  });

  if (generated.length > 3) {
    console.log(`  ... and ${generated.length - 3} more`);
  }

  return generated;
}

// Main
try {
  // Check database
  const accountTypes = db.prepare('SELECT code, name FROM account_types').all();
  console.log('\nAvailable account types:');
  accountTypes.forEach(type => {
    console.log(`  - ${type.code}: ${type.name}`);
  });

  const accountStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN stock_status='available' THEN 1 ELSE 0 END) as available
    FROM accounts
  `).get();
  console.log(`\nAccount pool: ${accountStats.available} available / ${accountStats.total} total`);

  // Generate different types of cards
  console.log('\n' + '='.repeat(60));
  console.log('Generating test cards...');
  console.log('='.repeat(60));

  // 1. Single-account cards (backward compatibility)
  generateCards({
    poolCode: 'test-type',
    count: 5,
    accountQuantity: 1,
    aftersaleLimit: 1,
    warrantyHours: 168
  });

  // 2. Multi-account cards (10 accounts each)
  generateCards({
    poolCode: 'test-type',
    count: 10,
    accountQuantity: 10,
    aftersaleLimit: 10,
    warrantyHours: 168
  });

  // 3. Multi-account cards (5 accounts each)
  generateCards({
    poolCode: 'test-type',
    count: 5,
    accountQuantity: 5,
    aftersaleLimit: 5,
    warrantyHours: 72
  });

  // Summary
  const cardStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN delivered_at IS NULL THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN account_quantity = 1 THEN 1 ELSE 0 END) as single_account,
      SUM(CASE WHEN account_quantity > 1 THEN 1 ELSE 0 END) as multi_account
    FROM cards
  `).get();

  console.log('\n' + '='.repeat(60));
  console.log('Database Summary');
  console.log('='.repeat(60));
  console.log(`Total cards: ${cardStats.total}`);
  console.log(`Available for Supply API: ${cardStats.available}`);
  console.log(`Single-account cards: ${cardStats.single_account}`);
  console.log(`Multi-account cards: ${cardStats.multi_account}`);
  console.log('\n✅ Test cards generated successfully!');
  console.log('\nYou can now test the Supply API:');
  console.log('  curl -X POST http://localhost:3000/api/supply/cards \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -H "Authorization: Bearer test-supply-api-token" \\');
  console.log('    -d \'{"poolCode":"test-type","count":10}\'');

} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} finally {
  db.close();
}
