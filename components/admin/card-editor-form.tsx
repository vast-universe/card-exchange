"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AccountQuotaSummary } from "@/components/admin/account-quota-summary";
import { CopyButton } from "@/components/ui/copy-button";
import { StatusTable } from "@/components/public/status-table";
import {
  formatDateTime,
  formatQuotaValue,
  getAccountCheckStatusMeta,
  getAccountRuntimeStatusMeta,
  getBindingStateMeta,
  getCardStatusMeta,
  isLiveCheckSupportedPoolCode,
} from "@/lib/admin-display";
import { adminApiPath } from "@/lib/admin-paths";
import { extractPayloadEmail } from "@/lib/payload";
import type {
  AccountTypeOption,
  AdminAccountLiveCheckResult,
  AdminCardListItem,
  CardStatus,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";

type CardEditorFormProps = {
  card: AdminCardListItem;
  accountTypes: AccountTypeOption[];
  selected?: boolean;
  activeAccountLiveCheckResult?: AdminAccountLiveCheckResult | null;
  activeAccountLiveCheckError?: string | null;
  isCheckingActiveAccount?: boolean;
  onSelectedChange?: (checked: boolean) => void;
};

function getPayloadPreview(raw: string | null) {
  if (!raw) {
    return null;
  }

  const email = extractPayloadEmail(raw);
  if (email) {
    return email;
  }

  const normalized = raw.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  return normalized.length > 44 ? `${normalized.slice(0, 44)}...` : normalized;
}

export function CardEditorForm({
  card,
  accountTypes,
  selected = false,
  activeAccountLiveCheckResult = null,
  activeAccountLiveCheckError = null,
  isCheckingActiveAccount = false,
  onSelectedChange,
}: CardEditorFormProps) {
  const router = useRouter();
  const [poolCode, setPoolCode] = useState(card.pool_code);
  const [aftersaleLimit, setAftersaleLimit] = useState(card.aftersale_limit);
  const [warrantyHours, setWarrantyHours] = useState(card.warranty_hours);
  const [status, setStatus] = useState<CardStatus>(card.status);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const canChangePool = card.has_bindings === 0 && !card.delivery_ref;
  const canDelete = card.has_bindings === 0 && !card.delivery_ref;
  const isDirty =
    poolCode !== card.pool_code ||
    aftersaleLimit !== card.aftersale_limit ||
    warrantyHours !== card.warranty_hours ||
    status !== card.status;
  const statusMeta = getCardStatusMeta(status);
  const activeAccountPayloadRaw =
    activeAccountLiveCheckResult?.payloadRaw ?? card.active_account_payload_raw;
  const activeAccountPreview = getPayloadPreview(activeAccountPayloadRaw);
  const supportsActiveAccountLiveCheck =
    Boolean(card.active_account_id) &&
    isLiveCheckSupportedPoolCode(card.pool_code);
  const liveAccountCheckStatus =
    activeAccountLiveCheckResult?.checkStatus ?? card.active_account_check_status;
  const activeAccountCheckStatusMeta = liveAccountCheckStatus
    ? getAccountCheckStatusMeta(liveAccountCheckStatus)
    : null;
  const activeAccountRuntimeStatusMeta = activeAccountLiveCheckResult
    ? getAccountRuntimeStatusMeta(activeAccountLiveCheckResult.runtimeStatus)
    : null;
  const activeAccountQuota = activeAccountLiveCheckResult?.quota ?? null;
  const activeAccountQuotaText = activeAccountQuota
    ? `${formatQuotaValue(activeAccountQuota.remaining)} / ${formatQuotaValue(activeAccountQuota.total)}`
    : null;
  const bindingMeta = getBindingStateMeta({
    hasActiveBinding: card.has_active_binding,
    hasBindings: card.has_bindings,
    accountCheckStatus: liveAccountCheckStatus,
    deliveryRef: card.delivery_ref,
  });
  const aftersaleLeft = Math.max(aftersaleLimit - card.aftersale_used, 0);
  const typeOptions = accountTypes.some((type) => type.code === card.pool_code)
    ? accountTypes
    : [
        ...accountTypes,
        {
          id: -1,
          code: card.pool_code,
          prefix: card.pool_code.toUpperCase(),
          created_at: "",
        },
      ];

  function handleSave() {
    setMessage("");
    setError("");

    startTransition(async () => {
      const response = await fetch(adminApiPath(`/cards/${card.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poolCode,
          aftersaleLimit,
          warrantyHours,
          status,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "保存失败。");
        return;
      }

      setMessage("已保存");
      setIsExpanded(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm(`确认删除卡密记录 #${card.id} 吗？`);
    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    startTransition(async () => {
      const response = await fetch(adminApiPath(`/cards/${card.id}`), {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "删除失败。");
        return;
      }

      router.refresh();
    });
  }

  return (
    <>
      <tr className={isExpanded ? "bg-amber-50/40" : "bg-white"}>
        <td className="border-t border-stone-200 px-4 py-3 align-top">
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelectedChange?.(event.target.checked)}
            disabled={!canDelete}
            className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-950 focus:ring-stone-400 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </td>
        <td className="border-t border-stone-200 px-4 py-3 align-top">
          <span className="inline-flex rounded-full bg-stone-950 px-3 py-1 text-xs font-semibold text-white">
            #{card.id}
          </span>
        </td>
        <td className="border-t border-stone-200 px-4 py-3 align-top">
          {card.code_plain ? (
            <div className="flex min-w-[20rem] items-center gap-3">
              <p className="whitespace-nowrap font-mono text-sm leading-5 text-stone-950">
                {card.code_plain}
              </p>
              <CopyButton
                value={card.code_plain}
                label="复制"
                variant="ghost"
                size="xs"
                className="shrink-0 px-0"
              />
            </div>
          ) : (
            <span className="text-xs text-stone-500">旧数据无明文</span>
          )}
        </td>
        <td className="border-t border-stone-200 px-4 py-3 align-top text-sm text-stone-700">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            {poolCode}
          </span>
        </td>
        <td className="border-t border-stone-200 px-4 py-3 align-top text-sm text-stone-700">
          {card.account_quantity > 1 ? (
            <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
              {card.account_quantity} 个账号
            </span>
          ) : (
            <span className="text-xs text-stone-500">单账号</span>
          )}
        </td>
        <td className="border-t border-stone-200 px-4 py-3 align-top">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-700">
              总 {aftersaleLimit}
            </span>
            <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-700">
              已 {card.aftersale_used}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              剩 {aftersaleLeft}
            </span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
              保 {warrantyHours}h
            </span>
          </div>
        </td>
        <td className="border-t border-stone-200 px-4 py-3 align-top">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.tone}`}
          >
            {statusMeta.label}
          </span>
        </td>
        <td className="border-t border-stone-200 px-4 py-3 align-top">
          <div className="space-y-1">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${bindingMeta.tone}`}
            >
              {bindingMeta.label}
            </span>
            {card.has_active_binding ? (
              <>
                <p className="max-w-[17rem] break-all text-xs leading-5 text-stone-600">
                  {activeAccountPreview ?? `账号 #${card.active_account_id}`}
                </p>
                <p className="text-[11px] text-stone-500">
                  {activeAccountQuotaText
                    ? `额度 ${activeAccountQuotaText}`
                    : supportsActiveAccountLiveCheck
                      ? isCheckingActiveAccount
                        ? "额度查询中..."
                        : activeAccountLiveCheckError || "当前页会自动查询额度"
                      : "展开后可查看账号原文"}
                </p>
              </>
            ) : card.delivery_ref ? (
              <p className="text-xs text-stone-500">
                发货单 {card.delivery_ref}
                {card.delivered_at ? ` · ${formatDate(card.delivered_at)}` : ""}
              </p>
            ) : null}
          </div>
        </td>
        <td className="border-t border-stone-200 px-4 py-3 align-top text-xs text-stone-600">
          <span className="whitespace-nowrap">{formatDate(card.created_at)}</span>
        </td>
        <td className="border-t border-stone-200 px-4 py-3 align-top">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            >
              {isExpanded ? "收起" : "编辑"}
            </button>
            {isDirty || isPending ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="rounded-full bg-stone-950 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {isPending ? "保存中" : "保存"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending || !canDelete}
              className="rounded-full border border-red-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
            >
              删除
            </button>
          </div>
          {message ? (
            <p className="mt-2 text-xs text-emerald-700">{message}</p>
          ) : null}
          {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
        </td>
      </tr>

      {isExpanded ? (
        <tr className="bg-stone-50/80">
          <td colSpan={10} className="border-t border-stone-200 px-4 pb-3 pt-0">
            <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 lg:grid-cols-[1.2fr_150px_150px_170px_auto]">
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-[0.08em] text-stone-600">
                  账号类型
                </label>
                <select
                  value={poolCode}
                  onChange={(event) => setPoolCode(event.target.value)}
                  disabled={isPending || !canChangePool}
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100"
                >
                  {typeOptions.map((type) => (
                    <option key={`${card.id}-${type.id}-${type.code}`} value={type.code}>
                      {type.code} · 前缀 {type.prefix}
                    </option>
                  ))}
                </select>
                {!canChangePool ? (
                  <p className="text-xs text-stone-500">
                    {card.delivery_ref
                      ? "卡密已发给外部平台，账号类型不可改。"
                      : "已有兑换记录，账号类型不可改。"}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-[0.08em] text-stone-600">
                  售后次数
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={aftersaleLimit}
                  onChange={(event) => setAftersaleLimit(Number(event.target.value))}
                  disabled={isPending}
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-[0.08em] text-stone-600">
                  质保小时
                </label>
                <input
                  type="number"
                  min={0}
                  max={720}
                  value={warrantyHours}
                  onChange={(event) => setWarrantyHours(Number(event.target.value))}
                  disabled={isPending}
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-[0.08em] text-stone-600">
                  卡密状态
                </label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as CardStatus)}
                  disabled={isPending}
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100"
                >
                  <option value="normal">正常</option>
                  <option value="disabled">已停用</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  {card.has_active_binding
                    ? activeAccountPreview ?? `当前绑定账号 #${card.active_account_id}`
                    : card.delivery_ref
                      ? `已发货单 ${card.delivery_ref}`
                      : "当前未绑定账号"}
                </div>
              </div>
            </div>

            {card.has_active_binding ? (
              <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                {card.account_quantity > 1 ? (
                  <div className="space-y-4 rounded-3xl border border-stone-200 bg-stone-50/80 p-4 xl:col-span-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold tracking-[0.08em] text-stone-600">
                          多账号卡密
                        </p>
                        <p className="text-sm font-semibold text-stone-950">
                          该卡密包含 {card.account_quantity} 个账号
                        </p>
                        <p className="text-xs text-stone-500">
                          展开后可查看所有账号详情和换号历史
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      多账号卡密详情功能开发中，敬请期待。
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 rounded-3xl border border-stone-200 bg-stone-50/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold tracking-[0.08em] text-stone-600">
                        绑定账号
                      </p>
                      <p className="text-sm font-semibold text-stone-950">
                        {activeAccountPreview ?? `账号 #${card.active_account_id}`}
                      </p>
                      <p className="text-xs text-stone-500">
                        账号 #{card.active_account_id}
                        {activeAccountLiveCheckResult?.checkedAt
                          ? ` · 查询于 ${formatDateTime(activeAccountLiveCheckResult.checkedAt)}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {supportsActiveAccountLiveCheck ? (
                        <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600">
                          {isCheckingActiveAccount
                            ? "实时检测中"
                            : activeAccountLiveCheckResult?.checkSource === "live"
                              ? "实时检测"
                              : activeAccountLiveCheckResult
                                ? "本地记录"
                                : "待检测"}
                        </span>
                      ) : null}
                      {activeAccountPayloadRaw ? (
                        <CopyButton value={activeAccountPayloadRaw} label="复制原文" />
                      ) : null}
                    </div>
                  </div>

                  {activeAccountLiveCheckError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {activeAccountLiveCheckError}
                    </div>
                  ) : null}

                  <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {activeAccountCheckStatusMeta ? (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${activeAccountCheckStatusMeta.tone}`}
                          >
                            {activeAccountCheckStatusMeta.label}
                          </span>
                        ) : null}
                        {activeAccountRuntimeStatusMeta ? (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${activeAccountRuntimeStatusMeta.tone}`}
                          >
                            {activeAccountRuntimeStatusMeta.label}
                          </span>
                        ) : null}
                      </div>

                      {activeAccountLiveCheckResult ? (
                        <StatusTable
                          title="账号检测"
                          items={[
                            {
                              label: "检测来源",
                              value:
                                activeAccountLiveCheckResult.checkSource === "live"
                                  ? "实时检测"
                                  : "本地记录",
                            },
                            {
                              label: "状态说明",
                              value: activeAccountLiveCheckResult.statusDetail || "-",
                            },
                            {
                              label: "自动刷新",
                              value: activeAccountLiveCheckResult.refreshed
                                ? "已刷新"
                                : "未刷新",
                            },
                          ]}
                        />
                      ) : (
                        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-5 text-sm text-stone-500">
                          {supportsActiveAccountLiveCheck
                            ? isCheckingActiveAccount
                              ? "正在检测当前绑定账号的状态和额度..."
                              : "当前页会自动查询绑定账号的状态和额度。"
                            : "当前账号类型暂不支持实时检测。"}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold tracking-[0.08em] text-stone-600">
                        账号原文
                      </label>
                      <textarea
                        readOnly
                        value={activeAccountPayloadRaw ?? ""}
                        rows={9}
                        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none"
                        placeholder="当前卡密还没有绑定账号原文。"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-[family-name:var(--font-heading)] text-xl text-stone-950">
                    使用额度
                  </h3>
                  <AccountQuotaSummary
                    quota={activeAccountQuota}
                    emptyLabel={
                      supportsActiveAccountLiveCheck
                        ? isCheckingActiveAccount
                          ? "额度查询中..."
                          : activeAccountLiveCheckError
                            ? "额度查询失败"
                            : "当前账号暂未返回额度信息"
                        : "当前账号类型暂不支持额度检测"
                    }
                  />
                </div>
                  </>
                )}
              </div>
            ) : null}
          </td>
        </tr>
      ) : null}
    </>
  );
}
