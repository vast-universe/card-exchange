"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { adminApiPath } from "@/lib/admin-paths";
import type {
  AccountCheckStatus,
  AccountStockStatus,
  AccountTypeOption,
} from "@/lib/types";

type AccountCreateFormProps = {
  accountTypes: AccountTypeOption[];
  embedded?: boolean;
  onCreated?: (accountId: number) => void;
};

export function AccountCreateForm({
  accountTypes,
  embedded = false,
  onCreated,
}: AccountCreateFormProps) {
  const router = useRouter();
  const [poolCode, setPoolCode] = useState(accountTypes[0]?.code ?? "");
  const [checkStatus, setCheckStatus] = useState<AccountCheckStatus>("ok");
  const [stockStatus, setStockStatus] =
    useState<AccountStockStatus>("available");
  const [payloadRaw, setPayloadRaw] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const resolvedPoolCode = accountTypes.some((type) => type.code === poolCode)
    ? poolCode
    : accountTypes[0]?.code ?? "";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    startTransition(async () => {
      const response = await fetch(adminApiPath("/accounts"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poolCode: resolvedPoolCode,
          payloadRaw,
          checkStatus,
          stockStatus,
        }),
      });

      const data = (await response.json()) as
        | {
            account: {
              id: number;
            };
          }
        | {
            error: string;
          };

      if (!response.ok) {
        setError("error" in data ? data.error : "添加失败。");
        return;
      }

      const accountId = "account" in data ? data.account.id : 0;
      setMessage(`已创建账号 #${accountId}`);
      setPayloadRaw("");
      onCreated?.(accountId);
      router.refresh();
    });
  }

  const contentNode = (
    <div className="space-y-5">
      {!embedded ? (
        <div className="space-y-1">
          <h3 className="font-[family-name:var(--font-heading)] text-2xl text-stone-950">
            添加账号
          </h3>
          <p className="text-sm leading-6 text-stone-600">
            适合手动补录单个账号。账号原文会按你粘贴的内容原样保存。
          </p>
        </div>
      ) : (
        <p className="text-sm leading-6 text-stone-600">
          适合手动补录单个账号。批量导入仍然建议使用“上传账号池”。
        </p>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-4 lg:grid-cols-[1fr_0.8fr_0.8fr]">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-800">
              账号类型
            </label>
            <select
              value={resolvedPoolCode}
              onChange={(event) => setPoolCode(event.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500"
            >
              {accountTypes.length > 0 ? (
                accountTypes.map((type) => (
                  <option key={type.id} value={type.code}>
                    {type.code} · 前缀 {type.prefix}
                  </option>
                ))
              ) : (
                <option value="">请先配置账号类型</option>
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-800">
              检测状态
            </label>
            <select
              value={checkStatus}
              onChange={(event) =>
                setCheckStatus(event.target.value as AccountCheckStatus)
              }
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500"
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
              onChange={(event) =>
                setStockStatus(event.target.value as AccountStockStatus)
              }
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500"
            >
              <option value="available">可发放</option>
              <option value="bound">已绑定</option>
              <option value="disabled">已停用</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 rounded-3xl border border-stone-200 bg-white p-4">
          <label className="text-sm font-semibold text-stone-800">
            账号原文
          </label>
          <textarea
            value={payloadRaw}
            onChange={(event) => setPayloadRaw(event.target.value)}
            rows={12}
            placeholder='例如 {"email":"a@example.com","password":"123456"}'
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-amber-500"
          />
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={
              isPending ||
              !resolvedPoolCode.trim() ||
              !payloadRaw.trim() ||
              accountTypes.length === 0
            }
            className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isPending ? "添加中..." : "添加账号"}
          </button>

          {accountTypes.length === 0 ? (
            <p className="text-sm text-amber-700">请先新增账号类型。</p>
          ) : null}
        </div>
      </form>
    </div>
  );

  if (embedded) {
    return contentNode;
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white/80 p-5">
      {contentNode}
    </div>
  );
}
