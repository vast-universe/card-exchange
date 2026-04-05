"use client";

import { useState, useTransition } from "react";

import { CardsTableManager } from "@/components/admin/cards-table-manager";
import { Pagination } from "@/components/admin/pagination";
import { adminApiPath } from "@/lib/admin-paths";
import type {
  AdminCardListItem,
  AccountTypeOption,
  CardStatus,
  PaginatedResult,
} from "@/lib/types";

type CardsListClientProps = {
  initialData: PaginatedResult<AdminCardListItem>;
  accountTypes: AccountTypeOption[];
  initialFilters: {
    query: string;
    poolCode: string;
    status: CardStatus | "all";
    usage: "all" | "unused" | "issued" | "bound" | "used";
  };
};

export function CardsListClient({
  initialData,
  accountTypes,
  initialFilters,
}: CardsListClientProps) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState(initialFilters.query);
  const [poolCode, setPoolCode] = useState(initialFilters.poolCode);
  const [status, setStatus] = useState(initialFilters.status);
  const [usage, setUsage] = useState(initialFilters.usage);
  const [isPending, startTransition] = useTransition();

  async function handleFilter(page = 1) {
    startTransition(async () => {
      const params = new URLSearchParams({
        q: query,
        poolCode,
        status,
        usage,
        page: String(page),
      });

      // 不更新 URL，只在客户端过滤
      // router.replace(`${adminPath("/cards")}?${params}`, { scroll: false });

      try {
        // 获取新数据
        const response = await fetch(`${adminApiPath("/cards/list")}?${params}`);

        if (!response.ok) {
          throw new Error("获取数据失败");
        }

        const newData = await response.json();
        setData(newData);
      } catch (error) {
        console.error("Failed to fetch cards:", error);
        // 可以添加错误提示
      }
    });
  }

  // 提供刷新函数给子组件
  function handleRefresh() {
    handleFilter(data.page);
  }

  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white/80 p-5 shadow-[0_20px_42px_-36px_rgba(41,37,36,0.42)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-[family-name:var(--font-heading)] text-[1.9rem] leading-none text-stone-950">
            卡密管理
          </h2>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-sm text-stone-600">
            共 {data.total} 条
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-stone-200 bg-stone-50/80 p-3 lg:grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_110px]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleFilter(1);
            }
          }}
          placeholder="搜索卡密 / ID / 类型"
          className="rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500"
        />
        <select
          value={poolCode}
          onChange={(e) => {
            setPoolCode(e.target.value);
            setTimeout(() => handleFilter(1), 0);
          }}
          className="rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500"
        >
          <option value="">全部账号类型</option>
          {accountTypes.map((type) => (
            <option key={type.id} value={type.code}>
              {type.code}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as CardStatus | "all");
            setTimeout(() => handleFilter(1), 0);
          }}
          className="rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500"
        >
          <option value="all">全部状态</option>
          <option value="normal">正常</option>
          <option value="disabled">已停用</option>
        </select>
        <select
          value={usage}
          onChange={(e) => {
            setUsage(
              e.target.value as "all" | "unused" | "issued" | "bound" | "used",
            );
            setTimeout(() => handleFilter(1), 0);
          }}
          className="rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500"
        >
          <option value="all">全部使用情况</option>
          <option value="unused">库存中</option>
          <option value="issued">已发货待兑换</option>
          <option value="bound">使用中</option>
          <option value="used">有兑换历史</option>
        </select>
        <button
          type="button"
          onClick={() => handleFilter(1)}
          disabled={isPending}
          className="rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "搜索中..." : "搜索"}
        </button>
      </div>

      <div className="mt-4">
        {data.items.length > 0 ? (
          <CardsTableManager
            cards={data.items}
            accountTypes={accountTypes}
            onDataChange={handleRefresh}
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center text-sm text-stone-500">
            没有匹配的卡密记录。
          </div>
        )}
      </div>

      <div className="mt-4">
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={(newPage) => handleFilter(newPage)}
        />
      </div>
    </section>
  );
}
