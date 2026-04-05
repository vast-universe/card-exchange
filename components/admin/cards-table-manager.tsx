"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { adminApiPath } from "@/lib/admin-paths";
import { isLiveCheckSupportedPoolCode } from "@/lib/admin-display";
import type {
  AccountTypeOption,
  AdminAccountLiveCheckResult,
  AdminCardListItem,
} from "@/lib/types";
import { CopyButton } from "@/components/ui/copy-button";
import { CardEditorForm } from "@/components/admin/card-editor-form";

type CardsTableManagerProps = {
  cards: AdminCardListItem[];
  accountTypes: AccountTypeOption[];
  onDataChange?: () => void;
};

export function CardsTableManager({
  cards,
  accountTypes,
  onDataChange,
}: CardsTableManagerProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeAccountLiveCheckResults, setActiveAccountLiveCheckResults] =
    useState<Record<number, AdminAccountLiveCheckResult>>({});
  const [activeAccountLiveCheckErrors, setActiveAccountLiveCheckErrors] =
    useState<Record<number, string>>({});
  const [checkingCardIds, setCheckingCardIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  const deletableIds = cards
    .filter((card) => card.has_bindings === 0 && !card.delivery_ref)
    .map((card) => card.id);
  const selectedCodes = cards
    .filter(
      (card) => selectedIds.includes(card.id) && Boolean(card.code_plain),
    )
    .map((card) => card.code_plain as string);
  const allSelected =
    deletableIds.length > 0 &&
    deletableIds.every((id) => selectedIds.includes(id));

  function clearActiveAccountLiveCheckResult(cardId: number) {
    setActiveAccountLiveCheckResults((current) => {
      if (!(cardId in current)) {
        return current;
      }

      const next = { ...current };
      delete next[cardId];
      return next;
    });
  }

  function clearActiveAccountLiveCheckError(cardId: number) {
    setActiveAccountLiveCheckErrors((current) => {
      if (!(cardId in current)) {
        return current;
      }

      const next = { ...current };
      delete next[cardId];
      return next;
    });
  }

  useEffect(() => {
    const targets = cards
      .filter(
        (card) =>
          card.active_account_id &&
          isLiveCheckSupportedPoolCode(card.pool_code),
      )
      .map((card) => ({
        cardId: card.id,
        accountId: card.active_account_id as number,
      }));

    if (targets.length === 0) {
      setCheckingCardIds([]);
      return;
    }

    let cancelled = false;
    const queue = [...targets];
    const concurrency = Math.min(4, queue.length);

    void Promise.all(
      Array.from({ length: concurrency }, async () => {
        while (!cancelled) {
          const next = queue.shift();
          if (!next) {
            return;
          }

          clearActiveAccountLiveCheckResult(next.cardId);
          clearActiveAccountLiveCheckError(next.cardId);
          setCheckingCardIds((current) =>
            current.includes(next.cardId) ? current : [...current, next.cardId],
          );

          try {
            const response = await fetch(adminApiPath("/accounts/check"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                accountId: next.accountId,
                persist: false,
              }),
            });

            const data = (await response.json()) as
              | AdminAccountLiveCheckResult
              | { error?: string };

            if (cancelled) {
              return;
            }

            if (!response.ok) {
              setActiveAccountLiveCheckErrors((current) => ({
                ...current,
                [next.cardId]:
                  "error" in data ? data.error ?? "额度查询失败。" : "额度查询失败。",
              }));
              continue;
            }

            setActiveAccountLiveCheckResults((current) => ({
              ...current,
              [next.cardId]: data as AdminAccountLiveCheckResult,
            }));
          } catch {
            if (!cancelled) {
              setActiveAccountLiveCheckErrors((current) => ({
                ...current,
                [next.cardId]: "额度查询失败。",
              }));
            }
          } finally {
            if (!cancelled) {
              setCheckingCardIds((current) =>
                current.filter((id) => id !== next.cardId),
              );
            }
          }
        }
      }),
    );

    return () => {
      cancelled = true;
    };
  }, [cards]);

  function toggleSelection(cardId: number, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, cardId]));
      }

      return current.filter((id) => id !== cardId);
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? deletableIds : []);
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `确认批量删除 ${selectedIds.length} 个卡密吗？`,
    );
    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    startTransition(async () => {
      const response = await fetch(adminApiPath("/cards/bulk-delete"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedIds,
        }),
      });

      const data = (await response.json()) as {
        deletedCount?: number;
        errors?: string[];
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "批量删除失败。");
        return;
      }

      setSelectedIds([]);
      const deletedCount = data.deletedCount ?? 0;
      const errors = data.errors ?? [];

      if (errors.length > 0) {
        setError(errors.join("；"));
      } else {
        setMessage(`已删除 ${deletedCount} 个卡密`);
      }

      router.refresh();
      onDataChange?.();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-stone-50/80 px-3.5 py-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="inline-flex items-center gap-3 text-sm font-medium text-stone-700">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => toggleSelectAll(event.target.checked)}
            disabled={deletableIds.length === 0}
            className="h-4 w-4 rounded border-stone-300 text-stone-950 focus:ring-stone-400 disabled:cursor-not-allowed disabled:opacity-40"
          />
          全选可删除项
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-sm text-stone-600">
            已选 {selectedIds.length} 项
          </span>
          {selectedCodes.length > 0 ? (
            <CopyButton
              value={selectedCodes.join("\n")}
              label="复制选中"
              variant="ghost"
            />
          ) : null}
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={isPending || selectedIds.length === 0}
            className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
          >
            批量删除
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[1.5rem] border border-stone-200 bg-white">
        <table className="min-w-[1040px] w-full text-left text-sm">
          <thead className="bg-stone-50/90 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-semibold"></th>
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">卡密</th>
              <th className="px-4 py-3 font-semibold">类型</th>
              <th className="px-4 py-3 font-semibold">账号数</th>
              <th className="px-4 py-3 font-semibold">售后 / 质保</th>
              <th className="px-4 py-3 font-semibold">状态</th>
              <th className="px-4 py-3 font-semibold">使用情况</th>
              <th className="px-4 py-3 font-semibold">创建时间</th>
              <th className="px-4 py-3 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody className="[&_tr:hover]:bg-stone-50/60">
            {cards.map((card) => (
              <CardEditorForm
                key={card.id}
                card={card}
                accountTypes={accountTypes}
                selected={selectedIds.includes(card.id)}
                activeAccountLiveCheckResult={
                  activeAccountLiveCheckResults[card.id] ?? null
                }
                activeAccountLiveCheckError={
                  activeAccountLiveCheckErrors[card.id] ?? null
                }
                isCheckingActiveAccount={checkingCardIds.includes(card.id)}
                onSelectedChange={(checked) => toggleSelection(card.id, checked)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
