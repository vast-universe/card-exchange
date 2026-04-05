"use client";

import { useState, useTransition } from "react";

import { AccountsListManager } from "@/components/admin/accounts-list-manager";
import { Pagination } from "@/components/admin/pagination";
import { adminApiPath } from "@/lib/admin-paths";
import type {
  AdminAccountListItem,
  AdminAccountTypeListItem,
  AccountCheckStatus,
  AccountStockStatus,
  PaginatedResult,
} from "@/lib/types";

type AccountsListClientProps = {
  initialData: PaginatedResult<AdminAccountListItem>;
  accountTypes: AdminAccountTypeListItem[];
  initialFilters: {
    query: string;
    poolCode: string;
    stockStatus: AccountStockStatus | "all";
    checkStatus: AccountCheckStatus | "all";
  };
};

export function AccountsListClient({
  initialData,
  accountTypes,
  initialFilters,
}: AccountsListClientProps) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState(initialFilters.query);
  const [poolCode, setPoolCode] = useState(initialFilters.poolCode);
  const [stockStatus, setStockStatus] = useState(initialFilters.stockStatus);
  const [checkStatus, setCheckStatus] = useState(initialFilters.checkStatus);
  const [isPending, startTransition] = useTransition();

  async function handleFilter(page = 1) {
    startTransition(async () => {
      // 使用最新的状态值
      const currentQuery = query;
      const currentPoolCode = poolCode;
      const currentStockStatus = stockStatus;
      const currentCheckStatus = checkStatus;
      
      const params = new URLSearchParams({
        q: currentQuery,
        poolCode: currentPoolCode,
        stockStatus: currentStockStatus,
        checkStatus: currentCheckStatus,
        page: String(page),
      });

      // 不更新 URL，只在客户端过滤
      // router.replace(`${adminPath("/accounts")}?${params}`, { scroll: false });

      try {
        // 获取新数据
        const response = await fetch(`${adminApiPath("/accounts/list")}?${params}`);

        if (!response.ok) {
          throw new Error("获取数据失败");
        }

        const newData = await response.json();
        setData(newData);
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
        // 可以添加错误提示
      }
    });
  }

  // 提供刷新函数给子组件
  function handleRefresh() {
    handleFilter(data.page);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-white/80 p-6 shadow-[0_24px_70px_-50px_rgba(41,37,36,0.42)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-[0.18em] text-stone-500">
              账号列表
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl text-stone-950">
              账号管理
            </h2>
            <p className="text-sm leading-6 text-stone-600">
              支持按账号编号、账号类型和原始 JSON 内容搜索，也可以在右侧抽屉里编辑、检测和查看额度。
            </p>
          </div>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-sm text-stone-600">
            共 {data.total} 条
          </span>
        </div>

        <div className="mt-5 grid gap-4 rounded-3xl border border-stone-200 bg-stone-50/80 p-5 lg:grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_auto]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleFilter(1);
              }
            }}
            placeholder="搜索账号编号 / 账号类型 / JSON 内容"
            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500"
          />
          <select
            value={poolCode}
            onChange={(e) => {
              setPoolCode(e.target.value);
              // 自动触发过滤
              setTimeout(() => handleFilter(1), 0);
            }}
            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500"
          >
            <option value="">全部账号类型</option>
            {accountTypes.map((type) => (
              <option key={type.id} value={type.code}>
                {type.code}
              </option>
            ))}
          </select>
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value as AccountStockStatus | "all");
              // 自动触发过滤
              setTimeout(() => handleFilter(1), 0);
            }}
            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500"
          >
            <option value="all">全部库存状态</option>
            <option value="available">可发放</option>
            <option value="bound">已绑定</option>
            <option value="disabled">已停用</option>
          </select>
          <select
            value={checkStatus}
            onChange={(e) => {
              setCheckStatus(e.target.value as AccountCheckStatus | "all");
              // 自动触发过滤
              setTimeout(() => handleFilter(1), 0);
            }}
            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500"
          >
            <option value="all">全部检测状态</option>
            <option value="ok">正常</option>
            <option value="banned">已封禁</option>
            <option value="unknown">待确认</option>
          </select>
          <button
            type="button"
            onClick={() => handleFilter(1)}
            disabled={isPending}
            className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "搜索中..." : "搜索"}
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <AccountsListManager
            accounts={data.items}
            accountTypes={accountTypes}
            onDataChange={handleRefresh}
          />
        </div>

        <div className="mt-5">
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={(newPage) => handleFilter(newPage)}
          />
        </div>
      </section>
    </div>
  );
}
