-- 性能优化：添加缺失的索引

-- 为 bindings 表的 account_id 添加索引
-- 用于优化账号查询和关联查询
CREATE INDEX IF NOT EXISTS idx_bindings_account_id
ON bindings(account_id);

-- 为 cards 表的 code_plain 添加部分索引
-- 用于优化卡密查询（虽然主要通过 code_hash 查询，但管理后台可能需要）
CREATE INDEX IF NOT EXISTS idx_cards_code_plain
ON cards(code_plain)
WHERE code_plain IS NOT NULL;

-- 为 bindings 表添加复合索引，优化状态查询
CREATE INDEX IF NOT EXISTS idx_bindings_status_created
ON bindings(status, created_at DESC);

-- 为 accounts 表添加复合索引，优化库存查询
CREATE INDEX IF NOT EXISTS idx_accounts_stock_check
ON accounts(stock_status, check_status, pool_code);
