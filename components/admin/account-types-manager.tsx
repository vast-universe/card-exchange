"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { adminApiPath } from "@/lib/admin-paths";
import type { AdminAccountTypeListItem } from "@/lib/types";

type AccountTypesManagerProps = {
  accountTypes: AdminAccountTypeListItem[];
  embedded?: boolean;
};

export function AccountTypesManager({
  accountTypes,
  embedded = false,
}: AccountTypesManagerProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    startTransition(async () => {
      const response = await fetch(adminApiPath("/account-types"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "新增类型失败。");
        return;
      }

      setCode("");
      setMessage("已新增账号类型");
      router.refresh();
    });
  }

  function handleDelete(typeId: number, typeCode: string) {
    const confirmed = window.confirm(`确认删除类型 ${typeCode} 吗？`);
    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    startTransition(async () => {
      const response = await fetch(adminApiPath(`/account-types/${typeId}`), {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "删除类型失败。");
        return;
      }

      setMessage("已删除账号类型");
      router.refresh();
    });
  }

  const content = (
    <div className="space-y-5">
      {!embedded ? (
        <div className="space-y-1">
          <h3 className="font-[family-name:var(--font-heading)] text-2xl text-stone-950">
            账号类型
          </h3>
          <p className="text-sm leading-6 text-stone-600">
            卡密前缀会直接使用类型前缀，先配类型，再导入账号和生成卡密。
          </p>
        </div>
      ) : (
        <p className="text-sm leading-6 text-stone-600">
          卡密前缀会直接使用类型前缀，先配类型，再导入账号和生成卡密。
        </p>
      )}

      <form
        className="grid gap-3 rounded-3xl border border-stone-200 bg-white p-4 md:grid-cols-[1fr_auto]"
        onSubmit={handleCreate}
      >
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="例如 kiro / codex"
          className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={isPending || !code.trim()}
          className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          新增类型
        </button>
      </form>

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

      {accountTypes.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-stone-50 text-stone-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">类型</th>
                  <th className="px-4 py-3 font-semibold">前缀</th>
                  <th className="px-4 py-3 font-semibold">账号数</th>
                  <th className="px-4 py-3 font-semibold">卡密数</th>
                  <th className="px-4 py-3 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {accountTypes.map((type) => {
                  const canDelete =
                    type.account_count === 0 && type.card_count === 0;

                  return (
                    <tr key={type.id} className="border-t border-stone-100">
                      <td className="px-4 py-3 font-semibold text-stone-950">
                        {type.code}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {type.prefix}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {type.account_count}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {type.card_count}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(type.id, type.code)}
                          disabled={isPending || !canDelete}
                          className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
                        >
                          {canDelete ? "删除" : "已使用"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
          还没有配置账号类型。
        </div>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white/80 p-5 shadow-[0_20px_42px_-36px_rgba(41,37,36,0.42)]">
      {content}
    </section>
  );
}
