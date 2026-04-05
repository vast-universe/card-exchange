import { CardsCreateForm } from "@/components/admin/cards-create-form";
import { CardsListClient } from "@/components/admin/cards-list-client";
import { listAccountTypes } from "@/lib/account-types";
import { listAdminCards } from "@/lib/cards";
import type { CardStatus } from "@/lib/types";
import { clampInt, getSingleSearchParam } from "@/lib/utils";

// 使用短时间缓存替代 force-dynamic
export const revalidate = 10;

type AdminCardsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeCardStatus(value: string): CardStatus | "all" {
  if (value === "normal" || value === "disabled") {
    return value;
  }

  return "all";
}

function normalizeUsage(
  value: string,
): "all" | "unused" | "issued" | "bound" | "used" {
  if (
    value === "unused" ||
    value === "issued" ||
    value === "bound" ||
    value === "used"
  ) {
    return value;
  }

  return "all";
}

export default async function AdminCardsPage({
  searchParams,
}: AdminCardsPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = getSingleSearchParam(resolvedSearchParams.q).trim();
  const poolCode = getSingleSearchParam(resolvedSearchParams.poolCode).trim();
  const status = normalizeCardStatus(
    getSingleSearchParam(resolvedSearchParams.status, "all"),
  );
  const usage = normalizeUsage(
    getSingleSearchParam(resolvedSearchParams.usage, "all"),
  );
  const page = clampInt(
    Number(getSingleSearchParam(resolvedSearchParams.page, "1")),
    1,
    10_000,
    1,
  );

  // 只在初始加载时查询
  const result = await listAdminCards({
    query,
    poolCode,
    status,
    usage,
    page,
    pageSize: 20,
  });
  const accountTypes = await listAccountTypes();

  return (
    <div className="space-y-6">
      <CardsCreateForm accountTypes={accountTypes} />

      <CardsListClient
        initialData={result}
        accountTypes={accountTypes}
        initialFilters={{
          query,
          poolCode,
          status,
          usage,
        }}
      />
    </div>
  );
}
