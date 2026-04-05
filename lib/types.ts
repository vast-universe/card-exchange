export type AccountStockStatus = "available" | "bound" | "disabled";
export type AccountCheckStatus = "ok" | "banned" | "unknown";
export type AccountRuntimeStatus = "banned" | "invalid" | "ok" | "unknown";
export type CardStatus = "normal" | "disabled";
export type BindingKind = "redeem" | "replace";
export type BindingStatus = "active" | "ended";

export interface AccountTypeOption {
  id: number;
  code: string;
  prefix: string;
  created_at: string;
}

export interface AdminAccountTypeListItem extends AccountTypeOption {
  account_count: number;
  card_count: number;
}

export interface AccountRecord {
  id: number;
  pool_code: string;
  payload_raw: string;
  stock_status: AccountStockStatus;
  check_status: AccountCheckStatus;
  created_at: string;
}

export interface CardRecord {
  id: number;
  code_plain: string | null;
  code_hash: string;
  pool_code: string;
  query_token: string | null;
  delivery_ref: string | null;
  delivered_at: string | null;
  aftersale_limit: number;
  aftersale_used: number;
  warranty_hours: number;
  warranty_started_at: string | null;
  warranty_expires_at: string | null;
  status: CardStatus;
  lock_until: string | null;
  created_at: string;
  account_quantity: number;
}

export interface RecentCardRecord {
  id: number;
  code_plain: string | null;
  pool_code: string;
  delivery_ref: string | null;
  delivered_at: string | null;
  aftersale_limit: number;
  aftersale_used: number;
  warranty_hours: number;
  warranty_started_at: string | null;
  warranty_expires_at: string | null;
  status: CardStatus;
  created_at: string;
  account_quantity: number;
}

export interface ActiveBindingRecord {
  binding_id: number;
  card_id: number;
  card_pool_code: string;
  aftersale_limit: number;
  aftersale_used: number;
  warranty_hours: number;
  warranty_started_at: string | null;
  warranty_expires_at: string | null;
  account_id: number;
  payload_raw: string;
  check_status: AccountCheckStatus;
  stock_status: AccountStockStatus;
}

export interface DashboardStats {
  accounts: {
    total: number;
    available: number;
    bound: number;
    unknown: number;
    disabled: number;
    banned: number;
  };
  cards: {
    total: number;
    inventory: number;
    issued: number;
    used: number;
  };
  today: {
    redeemCount: number;
    replaceCount: number;
    externalDeliveryCount: number;
  };
  pools: Array<{
    poolCode: string;
    total: number;
    available: number;
    bound: number;
    unknown: number;
    disabled: number;
    banned: number;
  }>;
}

export interface AdminAccountListItem extends AccountRecord {
  active_card_id: number | null;
  active_binding_kind: BindingKind | null;
  has_bindings: number;
}

export interface AccountQuotaSummary {
  plan: string | null;
  total: number;
  used: number;
  remaining: number;
  percent: number;
  nextResetAt: string | null;
}

export interface AdminAccountLiveCheckResult {
  supported: boolean;
  checkSource: "live" | "stored";
  runtimeStatus: AccountRuntimeStatus;
  checkStatus: AccountCheckStatus;
  stockStatus: AccountStockStatus;
  statusDetail: string | null;
  quota: AccountQuotaSummary | null;
  payloadRaw: string;
  refreshed: boolean;
  checkedAt: string | null;
}

export interface AdminCardListItem extends RecentCardRecord {
  active_account_id: number | null;
  active_account_payload_raw: string | null;
  active_account_check_status: AccountCheckStatus | null;
  has_bindings: number;
  has_active_binding: number;
  aftersale_left: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
