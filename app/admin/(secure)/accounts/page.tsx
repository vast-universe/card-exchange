import { AccountsListClient } from "@/components/admin/accounts-list-client";
import { listAdminAccountTypes } from "@/lib/account-types";
import { adminPath } from "@/lib/admin-paths";
import { listAdminAccounts } from "@/lib/accounts";
import type {
  AccountCheckStatus,
  AccountStockStatus,
} from "@/lib/types";
import { clampInt, getSingleSearchParam } from "@/lib/utils";

// 使用短时间缓存替代 force-dynamic
export const revalidate = 10;

type AdminAccountsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeStockStatus(
  value: string,
): AccountStockStatus | "all" {
  if (value === "available" || value === "bound" || value === "disabled") {
    return value;
  }

  return "all";
}

function normalizeCheckStatus(
  value: string,
): AccountCheckStatus | "all" {
  if (value === "ok" || value === "banned" || value === "unknown") {
    return value;
  }

  return "all";
}

export default async function AdminAccountsPage({
  searchParams,
}: AdminAccountsPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = getSingleSearchParam(resolvedSearchParams.q).trim();
  const poolCode = getSingleSearchParam(resolvedSearchParams.poolCode).trim();
  const stockStatus = normalizeStockStatus(
    getSingleSearchParam(resolvedSearchParams.stockStatus, "all"),
  );
  const checkStatus = normalizeCheckStatus(
    getSingleSearchParam(resolvedSearchParams.checkStatus, "all"),
  );
  const page = clampInt(
    Number(getSingleSearchParam(resolvedSearchParams.page, "1")),
    1,
    10_000,
    1,
  );

  // 只在初始加载时查询
  const result = await listAdminAccounts({
    query,
    poolCode,
    stockStatus,
    checkStatus,
    page,
    pageSize: 20,
  });
  const accountTypes = await listAdminAccountTypes();

  return (
    <AccountsListClient
      initialData={result}
      accountTypes={accountTypes}
      initialFilters={{
        query,
        poolCode,
        stockStatus,
        checkStatus,
      }}
    />
  );
}
