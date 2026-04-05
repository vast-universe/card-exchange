"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { adminApiPath, adminPath } from "@/lib/admin-paths";
import { CopyButton } from "@/components/ui/copy-button";
import type { AccountTypeOption } from "@/lib/types";

export function CardsCreateForm({
  accountTypes,
}: {
  accountTypes: AccountTypeOption[];
}) {
  const router = useRouter();
  const [poolCode, setPoolCode] = useState(accountTypes[0]?.code ?? "");
  const [count, setCount] = useState(1);
  const [accountQuantity, setAccountQuantity] = useState(1);
  const [aftersaleLimit, setAftersaleLimit] = useState(1);
  const [warrantyHours, setWarrantyHours] = useState(24);
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Sync aftersaleLimit with accountQuantity when accountQuantity changes
  function handleAccountQuantityChange(value: number) {
    setAccountQuantity(value);
    setAftersaleLimit(value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch(adminApiPath("/cards/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poolCode,
          count,
          accountQuantity,
          aftersaleLimit,
          warrantyHours,
        }),
      });

      const data = (await response.json()) as
        | {
            codes: string[];
          }
        | {
            error: string;
          };

      if (!response.ok) {
        setError("error" in data ? data.error : "生成失败。");
        return;
      }

      const payload = data as { codes: string[] };
      setCodes(payload.codes);
      
      // Show success message with account quantity info
      const cardCount = payload.codes.length;
      const totalAccounts = cardCount * accountQuantity;
      if (accountQuantity > 1) {
        setError(`✓ 已生成 ${cardCount} 个卡密（每个包含 ${accountQuantity} 个账号，共 ${totalAccounts} 个账号）`);
      }
      
      router.refresh();
    });
  }

  return (
    <div className="rounded-[1.75rem] border border-stone-200 bg-[rgba(255,252,247,0.92)] p-4 shadow-[0_20px_42px_-36px_rgba(41,37,36,0.42)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-[1.9rem] leading-none text-stone-950">
            生成卡密
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            选择账号类型、卡密数量、每卡账号数、售后次数和质保小时后直接生成。
          </p>
        </div>
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_140px_140px_120px_120px_130px] xl:items-end">
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-[0.08em] text-stone-600">
              账号类型
            </label>
            <select
              value={poolCode}
              onChange={(event) => setPoolCode(event.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500"
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
            <label className="text-xs font-semibold tracking-[0.08em] text-stone-600">
              卡密数量
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-[0.08em] text-stone-600">
              每卡账号数
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={accountQuantity}
              onChange={(event) => handleAccountQuantityChange(Number(event.target.value))}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500"
            />
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
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500"
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
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !poolCode.trim() || accountTypes.length === 0}
            className="inline-flex h-[42px] items-center justify-center rounded-full bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isPending ? "生成中..." : "生成卡密"}
          </button>
        </div>
      </form>

      {accountTypes.length === 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-amber-700">
          <span>请先去账号管理里新增账号类型。</span>
          <Link
            href={adminPath("/accounts")}
            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            去配置类型
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {codes.length > 0 ? (
        <div className="mt-3 space-y-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-amber-800">
              本次生成 {codes.length} 张卡密
            </p>
            <CopyButton value={codes.join("\n")} label="复制全部卡密" />
          </div>
          <textarea
            readOnly
            spellCheck={false}
            value={codes.join("\n")}
            rows={Math.min(Math.max(codes.length, 2), 4)}
            className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 font-mono text-sm leading-6 text-stone-900"
          />
        </div>
      ) : null}
    </div>
  );
}
