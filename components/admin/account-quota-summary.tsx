"use client";

import {
  formatDateTime,
  formatQuotaValue,
} from "@/lib/admin-display";
import type { AccountQuotaSummary } from "@/lib/types";

type AccountQuotaSummaryProps = {
  quota: AccountQuotaSummary | null;
  emptyLabel?: string;
  compact?: boolean;
};

function getProgressTone(percent: number) {
  if (percent >= 85) {
    return "bg-red-500";
  }

  if (percent >= 60) {
    return "bg-amber-500";
  }

  return "bg-emerald-500";
}

export function AccountQuotaSummary({
  quota,
  emptyLabel = "实时检测后显示额度",
  compact = false,
}: AccountQuotaSummaryProps) {
  if (!quota) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-stone-500 ${
          compact ? "px-3 py-4 text-xs" : "px-4 py-5 text-sm"
        }`}
      >
        {emptyLabel}
      </div>
    );
  }

  const percent = Math.max(0, Math.min(100, quota.percent));
  const progressTone = getProgressTone(percent);

  return (
    <div
      className={`rounded-2xl border border-stone-200 bg-white ${
        compact ? "px-3 py-3" : "p-4"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-stone-500">
            {quota.plan || "额度"}
          </p>
          <p className={`${compact ? "text-sm" : "text-lg"} font-semibold text-stone-950`}>
            剩余 {formatQuotaValue(quota.remaining)}
          </p>
        </div>

        <div className="text-right text-[11px] text-stone-500">
          <p>已用 {formatQuotaValue(quota.used)}</p>
          <p>总额 {formatQuotaValue(quota.total)}</p>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-stone-200">
        <div
          className={`h-full rounded-full ${progressTone}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
        <span>使用率 {percent.toFixed(1)}%</span>
        <span>重置 {formatDateTime(quota.nextResetAt)}</span>
      </div>
    </div>
  );
}
