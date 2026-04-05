"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { AccountCreateForm } from "@/components/admin/account-create-form";
import { AccountQuotaSummary } from "@/components/admin/account-quota-summary";
import { AccountTypesManager } from "@/components/admin/account-types-manager";
import { AccountsUploadForm } from "@/components/admin/accounts-upload-form";
import { SideDrawer } from "@/components/admin/side-drawer";
import { CopyButton } from "@/components/ui/copy-button";
import {
  formatDateTime,
  getAccountCheckStatusMeta,
  getAccountRuntimeStatusMeta,
  getAccountStockStatusMeta,
  isLiveCheckSupportedPoolCode,
} from "@/lib/admin-display";
import { adminApiPath } from "@/lib/admin-paths";
import { extractPayloadEmail } from "@/lib/payload";
import type {
  AdminAccountListItem,
  AdminAccountLiveCheckResult,
  AdminAccountTypeListItem,
} from "@/lib/types";

type AccountsListManagerProps = {
  accounts: AdminAccountListItem[];
  accountTypes: AdminAccountTypeListItem[];
  onDataChange?: () => void;
};

type DrawerType = "types" | "create" | "upload" | null;

function getBindingSummary(account: AdminAccountListItem) {
  if (account.active_card_id) {
    return {
      title: `绑定卡密 #${account.active_card_id}`,
      detail:
        account.active_binding_kind === "replace"
          ? "当前是售后补发绑定"
          : "当前是首次兑换绑定",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (account.has_bindings > 0) {
    return {
      title: "有历史绑定",
      detail: "仅保留历史记录，不可删除",
      tone: "border-stone-200 bg-stone-100 text-stone-600",
    };
  }

  return {
    title: "未绑定",
    detail: "当前可发放",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

export function AccountsListManager({
  accounts,
  accountTypes,
  onDataChange,
}: AccountsListManagerProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [liveCheckResults, setLiveCheckResults] = useState<
    Record<number, AdminAccountLiveCheckResult>
  >({});
  const [liveCheckErrors, setLiveCheckErrors] = useState<
    Record<number, string>
  >({});
  const [checkingIds, setCheckingIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();
  const accountIds = useMemo(
    () => new Set(accounts.map((account) => account.id)),
    [accounts],
  );

  const deletableIds = useMemo(
    () =>
      accounts
        .filter((account) => account.has_bindings === 0)
        .map((account) => account.id),
    [accounts],
  );
  const selectedIdsOnPage = useMemo(
    () => selectedIds.filter((id) => accountIds.has(id)),
    [accountIds, selectedIds],
  );
  const visibleLiveCheckResults = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(liveCheckResults).filter(([id]) => accountIds.has(Number(id))),
      ),
    [accountIds, liveCheckResults],
  );
  const visibleLiveCheckErrors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(liveCheckErrors).filter(([id]) => accountIds.has(Number(id))),
      ),
    [accountIds, liveCheckErrors],
  );
  const supportedAccountIds = useMemo(
    () =>
      accounts
        .filter((account) => isLiveCheckSupportedPoolCode(account.pool_code))
        .map((account) => account.id),
    [accounts],
  );

  const allSelected =
    deletableIds.length > 0 &&
    deletableIds.every((id) => selectedIdsOnPage.includes(id));

  function openDrawer(type: Exclude<DrawerType, null>) {
    setError("");
    setMessage("");
    setActiveDrawer(type);
  }

  function closeDrawer() {
    setActiveDrawer(null);
  }

  function toggleSelection(accountId: number, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, accountId]));
      }

      return current.filter((id) => id !== accountId);
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? deletableIds : []);
  }

  function handleBulkDelete() {
    if (selectedIdsOnPage.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `确认批量删除 ${selectedIdsOnPage.length} 个账号吗？`,
    );
    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    startTransition(async () => {
      const response = await fetch(adminApiPath("/accounts/bulk-delete"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedIdsOnPage,
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

      setSelectedIds((current) =>
        current.filter((id) => !selectedIdsOnPage.includes(id)),
      );
      const deletedCount = data.deletedCount ?? 0;
      const errors = data.errors ?? [];

      if (errors.length > 0) {
        setError(errors.join("；"));
      } else {
        setMessage(`已删除 ${deletedCount} 个账号`);
      }

      router.refresh();
      onDataChange?.();
    });
  }

  function clearLiveCheckResult(accountId: number) {
    setLiveCheckResults((current) => {
      const next = { ...current };
      delete next[accountId];
      return next;
    });
  }

  function clearLiveCheckError(accountId: number) {
    setLiveCheckErrors((current) => {
      if (!(accountId in current)) {
        return current;
      }

      const next = { ...current };
      delete next[accountId];
      return next;
    });
  }

  useEffect(() => {
    if (supportedAccountIds.length === 0) {
      setCheckingIds((current) => current.filter((id) => accountIds.has(id)));
      return;
    }

    let cancelled = false;
    const queue = [...supportedAccountIds];
    const concurrency = Math.min(4, queue.length);

    void Promise.all(
      Array.from({ length: concurrency }, async () => {
        while (!cancelled) {
          const nextId = queue.shift();
          if (!nextId) {
            return;
          }

          clearLiveCheckResult(nextId);
          clearLiveCheckError(nextId);
          setCheckingIds((current) =>
            current.includes(nextId) ? current : [...current, nextId],
          );

          try {
            const response = await fetch(adminApiPath("/accounts/check"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                accountId: nextId,
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
              setLiveCheckErrors((current) => ({
                ...current,
                [nextId]:
                  "error" in data ? data.error ?? "额度查询失败。" : "额度查询失败。",
              }));
              continue;
            }

            setLiveCheckResults((current) => ({
              ...current,
              [nextId]: data as AdminAccountLiveCheckResult,
            }));
          } catch {
            if (!cancelled) {
              setLiveCheckErrors((current) => ({
                ...current,
                [nextId]: "额度查询失败。",
              }));
            }
          } finally {
            if (!cancelled) {
              setCheckingIds((current) => current.filter((id) => id !== nextId));
            }
          }
        }
      }),
    );

    return () => {
      cancelled = true;
    };
  }, [accountIds, supportedAccountIds]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-stone-50/80 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openDrawer("types")}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          >
            账号类型 {accountTypes.length}
          </button>

          <button
            type="button"
            onClick={() => openDrawer("create")}
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            添加账号
          </button>

          <button
            type="button"
            onClick={() => openDrawer("upload")}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          >
            上传账号池
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-3 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => toggleSelectAll(event.target.checked)}
              disabled={deletableIds.length === 0}
              className="h-4 w-4 rounded border-stone-300 text-stone-950 focus:ring-stone-400 disabled:cursor-not-allowed disabled:opacity-40"
            />
            全选当前页可删除账号
          </label>

          <span className="text-sm text-stone-600">
            已选 {selectedIdsOnPage.length} 项
          </span>

          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={isPending || selectedIdsOnPage.length === 0}
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

      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="w-14 px-4 py-3 font-semibold">选择</th>
                <th className="min-w-[280px] px-4 py-3 font-semibold">账号邮箱</th>
                <th className="min-w-[180px] px-4 py-3 font-semibold">状态</th>
                <th className="min-w-[260px] px-4 py-3 font-semibold">额度</th>
                <th className="min-w-[180px] px-4 py-3 font-semibold">绑定情况</th>
                <th className="min-w-[140px] px-4 py-3 font-semibold">创建时间</th>
                <th className="min-w-[120px] px-4 py-3 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length > 0 ? (
                accounts.map((account) => {
                  const liveCheckResult = visibleLiveCheckResults[account.id] ?? null;
                  const liveCheckError = visibleLiveCheckErrors[account.id] ?? null;
                  const isChecking = checkingIds.includes(account.id);
                  const supportsLiveCheck = isLiveCheckSupportedPoolCode(
                    account.pool_code,
                  );
                  const checkStatusMeta = getAccountCheckStatusMeta(
                    liveCheckResult?.checkStatus ?? account.check_status,
                  );
                  const stockStatusMeta = getAccountStockStatusMeta(
                    liveCheckResult?.stockStatus ?? account.stock_status,
                  );
                  const runtimeStatusMeta = liveCheckResult
                    ? getAccountRuntimeStatusMeta(liveCheckResult.runtimeStatus)
                    : null;
                  const bindingSummary = getBindingSummary(account);
                  const payloadRaw = liveCheckResult?.payloadRaw ?? account.payload_raw;
                  const email = extractPayloadEmail(payloadRaw) ?? "-";
                  const canDelete = account.has_bindings === 0;
                  const quotaCheckedAt = liveCheckResult?.checkedAt ?? null;

                  return (
                    <tr
                      key={`${account.id}-${account.pool_code}-${account.check_status}-${account.stock_status}-${account.payload_raw}`}
                      className="border-t border-stone-100 align-top transition hover:bg-stone-50/70"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIdsOnPage.includes(account.id)}
                          onChange={(event) =>
                            toggleSelection(account.id, event.target.checked)
                          }
                          disabled={!canDelete}
                          className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-950 focus:ring-stone-400 disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-semibold text-stone-950">
                            {email}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                              #{account.id}
                            </span>
                            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                              {account.pool_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${stockStatusMeta.tone}`}
                          >
                            {stockStatusMeta.label}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${checkStatusMeta.tone}`}
                          >
                            {checkStatusMeta.label}
                          </span>
                          {runtimeStatusMeta ? (
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${runtimeStatusMeta.tone}`}
                            >
                              {runtimeStatusMeta.label}
                            </span>
                          ) : null}
                          <p className="text-xs leading-5 text-stone-500">
                            {liveCheckResult
                              ? liveCheckResult.checkSource === "live"
                                ? liveCheckResult.statusDetail || "已完成实时检测"
                                : "当前类型暂不支持实时检测"
                              : liveCheckError
                                ? liveCheckError
                                : isChecking
                                  ? "正在自动查询实时状态"
                                  : supportsLiveCheck
                                    ? "当前页会自动查询实时状态"
                                    : "当前显示的是数据库状态"}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <AccountQuotaSummary
                            quota={liveCheckResult?.quota ?? null}
                            compact
                            emptyLabel={
                              supportsLiveCheck
                                ? isChecking
                                  ? "额度查询中..."
                                  : liveCheckError
                                    ? "额度查询失败"
                                    : "当前页自动查询实时额度"
                                : "当前类型暂不支持额度检测"
                            }
                          />

                          {supportsLiveCheck ? (
                            <div className="text-[11px] text-stone-500">
                              <span>
                                {isChecking
                                  ? "实时查询中"
                                  : quotaCheckedAt
                                    ? `查询于 ${formatDateTime(quotaCheckedAt)}`
                                    : liveCheckError
                                      ? liveCheckError
                                      : "进入页面后会自动查询"}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${bindingSummary.tone}`}
                          >
                            {bindingSummary.title}
                          </span>
                          <p className="text-xs leading-5 text-stone-500">
                            {bindingSummary.detail}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-stone-600">
                        {formatDateTime(account.created_at)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <CopyButton
                            value={payloadRaw}
                            label="复制 JSON"
                            size="xs"
                            className="min-w-24"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="border-t border-stone-100">
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-stone-500"
                  >
                    当前还没有账号记录，点击上方“添加账号”或“上传账号池”即可开始录入。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SideDrawer
        open={activeDrawer === "types"}
        onClose={closeDrawer}
        title="账号类型管理"
        description="维护账号类型后，导入账号和生成卡密时都可以直接选择。"
        widthClassName="max-w-2xl"
      >
        <AccountTypesManager accountTypes={accountTypes} embedded />
      </SideDrawer>

      <SideDrawer
        open={activeDrawer === "create"}
        onClose={closeDrawer}
        title="添加账号"
        description="适合手动补录单个账号，创建后会立即出现在当前列表顶部。"
        widthClassName="max-w-3xl"
      >
        <AccountCreateForm
          accountTypes={accountTypes}
          embedded
          onCreated={(accountId) => {
            setMessage(`已创建账号 #${accountId}`);
            setError("");
            closeDrawer();
          }}
        />
      </SideDrawer>

      <SideDrawer
        open={activeDrawer === "upload"}
        onClose={closeDrawer}
        title="上传账号池"
        description="支持 JSON 数组、单个 JSON 对象和 JSONL，原文会原样保存。"
        widthClassName="max-w-3xl"
      >
        <AccountsUploadForm accountTypes={accountTypes} embedded />
      </SideDrawer>
    </div>
  );
}
