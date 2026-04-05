"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  getAccountCheckStatusMeta,
  getAccountStockStatusMeta,
} from "@/lib/admin-display";
import { adminApiPath } from "@/lib/admin-paths";
import type {
  AccountCheckStatus,
  AccountStockStatus,
} from "@/lib/types";

type AccountStatusFormProps = {
  accountId: number;
  checkStatus: AccountCheckStatus;
  stockStatus: AccountStockStatus;
};

export function AccountStatusForm({
  accountId,
  checkStatus,
  stockStatus,
}: AccountStatusFormProps) {
  const router = useRouter();
  const [nextCheckStatus, setNextCheckStatus] = useState(checkStatus);
  const [nextStockStatus, setNextStockStatus] = useState(stockStatus);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const checkStatusMeta = getAccountCheckStatusMeta(nextCheckStatus);
  const stockStatusMeta = getAccountStockStatusMeta(nextStockStatus);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    startTransition(async () => {
      const response = await fetch(adminApiPath("/accounts/status"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          checkStatus: nextCheckStatus,
          stockStatus: nextStockStatus,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "保存失败。");
        return;
      }

      setMessage("已保存");
      router.refresh();
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="flex flex-wrap gap-2">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${checkStatusMeta.tone}`}
        >
          {checkStatusMeta.label}
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${stockStatusMeta.tone}`}
        >
          {stockStatusMeta.label}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <select
          value={nextCheckStatus}
          onChange={(event) =>
            setNextCheckStatus(event.target.value as AccountCheckStatus)
          }
          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-500"
        >
          <option value="ok">正常</option>
          <option value="banned">已封禁</option>
          <option value="unknown">待确认</option>
        </select>

        <select
          value={nextStockStatus}
          onChange={(event) =>
            setNextStockStatus(event.target.value as AccountStockStatus)
          }
          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-500"
        >
          <option value="available">可发放</option>
          <option value="bound">已绑定</option>
          <option value="disabled">已停用</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {isPending ? "保存中..." : "保存"}
        </button>
        {message ? <span className="text-xs text-emerald-700">{message}</span> : null}
        {error ? <span className="text-xs text-red-700">{error}</span> : null}
      </div>
    </form>
  );
}
