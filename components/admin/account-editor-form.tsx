"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AccountQuotaSummary } from "@/components/admin/account-quota-summary";
import { CopyButton } from "@/components/ui/copy-button";
import { StatusTable } from "@/components/public/status-table";
import {
  formatDateTime,
  getAccountCheckStatusMeta,
  getAccountRuntimeStatusMeta,
  getAccountStockStatusMeta,
  isLiveCheckSupportedPoolCode,
} from "@/lib/admin-display";
import { adminApiPath } from "@/lib/admin-paths";
import type {
  AccountCheckStatus,
  AccountStockStatus,
  AccountTypeOption,
  AdminAccountListItem,
  AdminAccountLiveCheckResult,
} from "@/lib/types";

type AccountEditorFormProps = {
  account: AdminAccountListItem;
  accountTypes: AccountTypeOption[];
  mode?: "card" | "drawer";
  selected?: boolean;
  onSelectedChange?: (checked: boolean) => void;
  initialLiveCheckResult?: AdminAccountLiveCheckResult | null;
  onSaved?: () => void;
  onDeleted?: () => void;
  onLiveCheckComplete?: (result: AdminAccountLiveCheckResult) => void;
};

export function AccountEditorForm({
  account,
  accountTypes,
  mode = "card",
  selected = false,
  onSelectedChange,
  initialLiveCheckResult = null,
  onSaved,
  onDeleted,
  onLiveCheckComplete,
}: AccountEditorFormProps) {
  const router = useRouter();
  const [poolCode, setPoolCode] = useState(account.pool_code);
  const [payloadRaw, setPayloadRaw] = useState(account.payload_raw);
  const [checkStatus, setCheckStatus] = useState<AccountCheckStatus>(
    account.check_status,
  );
  const [stockStatus, setStockStatus] = useState<AccountStockStatus>(
    account.stock_status,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [checkMessage, setCheckMessage] = useState("");
  const [checkError, setCheckError] = useState("");
  const [liveCheckResult, setLiveCheckResult] =
    useState<AdminAccountLiveCheckResult | null>(initialLiveCheckResult);
  const [isPending, startTransition] = useTransition();
  const [isChecking, startCheckTransition] = useTransition();

  const isBound = Boolean(account.active_card_id);
  const canDelete = account.has_bindings === 0;
  const isDirty =
    poolCode !== account.pool_code ||
    payloadRaw !== account.payload_raw ||
    checkStatus !== account.check_status ||
    stockStatus !== account.stock_status;
  const supportsLiveCheck = isLiveCheckSupportedPoolCode(poolCode);
  const stockStatusMeta = getAccountStockStatusMeta(stockStatus);
  const checkStatusMeta = getAccountCheckStatusMeta(checkStatus);
  const typeOptions = accountTypes.some((type) => type.code === account.pool_code)
    ? accountTypes
    : [
        ...accountTypes,
        {
          id: -1,
          code: account.pool_code,
          prefix: account.pool_code.toUpperCase(),
          created_at: "",
        },
      ];

  function clearLiveCheckState() {
    setLiveCheckResult(null);
    setCheckMessage("");
    setCheckError("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    startTransition(async () => {
      const response = await fetch(adminApiPath(`/accounts/${account.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poolCode,
          payloadRaw,
          checkStatus,
          stockStatus,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "保存失败。");
        return;
      }

      setMessage("已保存");
      onSaved?.();
      router.refresh();
    });
  }

  function handleLiveCheck() {
    setCheckMessage("");
    setCheckError("");

    startCheckTransition(async () => {
      const response = await fetch(adminApiPath("/accounts/check"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: account.id,
        }),
      });

      const data = (await response.json()) as
        | AdminAccountLiveCheckResult
        | { error?: string };

      if (!response.ok) {
        setCheckError("error" in data ? data.error ?? "检测失败。" : "检测失败。");
        return;
      }

      const result = data as AdminAccountLiveCheckResult;
      setLiveCheckResult(result);
      setPayloadRaw(result.payloadRaw);
      setCheckStatus(result.checkStatus);
      setStockStatus(result.stockStatus);
      setCheckMessage(
        result.checkSource === "live"
          ? "实时检测已完成，并同步了当前状态。"
          : "当前账号类型暂不支持实时检测。",
      );
      onLiveCheckComplete?.(result);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm(`确认删除账号 #${account.id} 吗？`);
    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    startTransition(async () => {
      const response = await fetch(adminApiPath(`/accounts/${account.id}`), {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "删除失败。");
        return;
      }

      onDeleted?.();
      router.refresh();
    });
  }

  return (
    <article
      className={
        mode === "drawer"
          ? "space-y-5"
          : "rounded-3xl border border-stone-200 bg-stone-50/80 p-5"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {mode === "card" ? (
            <label className="mt-0.5 inline-flex items-center">
              <input
                type="checkbox"
                checked={selected}
                onChange={(event) => onSelectedChange?.(event.target.checked)}
                disabled={!canDelete}
                className="h-4 w-4 rounded border-stone-300 text-stone-950 focus:ring-stone-400 disabled:cursor-not-allowed disabled:opacity-40"
              />
            </label>
          ) : null}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-stone-950">
                账号 #{account.id}
              </p>
              <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                {poolCode}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
              <span
                className={`rounded-full border px-3 py-1 font-semibold ${stockStatusMeta.tone}`}
              >
                {stockStatusMeta.label}
              </span>
              <span
                className={`rounded-full border px-3 py-1 font-semibold ${checkStatusMeta.tone}`}
              >
                {checkStatusMeta.label}
              </span>
              {account.active_card_id ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                  绑定卡密 #{account.active_card_id}
                </span>
              ) : null}
              {!canDelete ? (
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1">
                  有历史绑定
                </span>
              ) : null}
            </div>

            {mode === "drawer" ? (
              <p className="text-xs text-stone-500">
                创建时间 {formatDateTime(account.created_at)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {supportsLiveCheck ? (
            <button
              type="button"
              onClick={handleLiveCheck}
              disabled={isChecking || isPending || isDirty}
              className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
            >
              {isChecking ? "检测中..." : "实时检测"}
            </button>
          ) : null}
          <CopyButton value={payloadRaw} label="复制原文" />
        </div>
      </div>

      {isBound ? (
        <p className="text-xs leading-5 text-amber-700">
          当前账号正在绑定中，只允许修改检测状态。
        </p>
      ) : null}

      {!canDelete && !isBound ? (
        <p className="text-xs leading-5 text-stone-600">
          该账号已有绑定历史，为避免影响记录，只允许编辑，不允许删除。
        </p>
      ) : null}

      {supportsLiveCheck && isDirty ? (
        <p className="text-xs leading-5 text-stone-600">
          当前有未保存修改，先保存后再做实时检测。
        </p>
      ) : null}

      {checkMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {checkMessage}
        </div>
      ) : null}

      {checkError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {checkError}
        </div>
      ) : null}

      {liveCheckResult ? (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <StatusTable
            title="实时检测结果"
            items={[
              {
                label: "检测来源",
                value:
                  liveCheckResult.checkSource === "live" ? "实时检测" : "本地记录",
              },
              {
                label: "运行结果",
                value: getAccountRuntimeStatusMeta(liveCheckResult.runtimeStatus)
                  .label,
              },
              {
                label: "检测状态",
                value: getAccountCheckStatusMeta(liveCheckResult.checkStatus).label,
              },
              {
                label: "库存状态",
                value: getAccountStockStatusMeta(liveCheckResult.stockStatus).label,
              },
              {
                label: "自动刷新",
                value: liveCheckResult.refreshed ? "已刷新" : "未刷新",
              },
              {
                label: "状态说明",
                value: liveCheckResult.statusDetail || "-",
              },
            ]}
          />

          <div className="space-y-3">
            <h3 className="font-[family-name:var(--font-heading)] text-xl text-stone-950">
              额度信息
            </h3>
            <AccountQuotaSummary
              quota={liveCheckResult.quota}
              emptyLabel="当前账号暂未返回额度信息"
            />
          </div>
        </div>
      ) : supportsLiveCheck && mode === "drawer" ? (
        <AccountQuotaSummary quota={null} />
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr_0.7fr]">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-800">
              账号类型
            </label>
            <select
              value={poolCode}
              onChange={(event) => {
                setPoolCode(event.target.value);
                clearLiveCheckState();
              }}
              disabled={isBound || isPending || isChecking}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100"
            >
              {typeOptions.map((type) => (
                <option
                  key={`${account.id}-${type.id}-${type.code}`}
                  value={type.code}
                >
                  {type.code} · 前缀 {type.prefix}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-800">
              检测状态
            </label>
            <select
              value={checkStatus}
              onChange={(event) => {
                setCheckStatus(event.target.value as AccountCheckStatus);
                clearLiveCheckState();
              }}
              disabled={isPending || isChecking}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100"
            >
              <option value="ok">正常</option>
              <option value="banned">已封禁</option>
              <option value="unknown">待确认</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-800">
              库存状态
            </label>
            <select
              value={stockStatus}
              onChange={(event) => {
                setStockStatus(event.target.value as AccountStockStatus);
                clearLiveCheckState();
              }}
              disabled={isBound || isPending || isChecking}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100"
            >
              <option value="available">可发放</option>
              <option value="bound">已绑定</option>
              <option value="disabled">已停用</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-800">
            账号原文
          </label>
          <textarea
            value={payloadRaw}
            onChange={(event) => {
              setPayloadRaw(event.target.value);
              clearLiveCheckState();
            }}
            rows={mode === "drawer" ? 12 : 7}
            disabled={isBound || isPending || isChecking}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isDirty || isPending ? (
            <button
              type="submit"
              disabled={isPending || isChecking}
              className="rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              {isPending ? "保存中..." : "保存"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending || isChecking || !canDelete}
            className="rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
          >
            删除
          </button>

          {message ? (
            <span className="text-sm text-emerald-700">{message}</span>
          ) : null}
          {error ? <span className="text-sm text-red-700">{error}</span> : null}
        </div>
      </form>
    </article>
  );
}
