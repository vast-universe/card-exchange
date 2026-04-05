"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { adminApiPath } from "@/lib/admin-paths";
import type { AccountTypeOption } from "@/lib/types";

type AccountsUploadFormProps = {
  accountTypes: AccountTypeOption[];
  embedded?: boolean;
};

export function AccountsUploadForm({
  accountTypes,
  embedded = false,
}: AccountsUploadFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [poolCode, setPoolCode] = useState(accountTypes[0]?.code ?? "");
  const [checkStatus, setCheckStatus] = useState<"ok" | "unknown">("ok");
  const [content, setContent] = useState("");
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
      const formData = new FormData();
      formData.set("poolCode", resolvedPoolCode);
      formData.set("checkStatus", checkStatus);
      formData.set("content", content);

      const file = fileRef.current?.files?.[0];
      if (file) {
        formData.set("file", file);
      }

      const response = await fetch(adminApiPath("/accounts/upload"), {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as
        | {
            imported: number;
            skipped?: number;
            format: string;
          }
        | {
            error: string;
          };

      if (!response.ok) {
        setError("error" in data ? data.error : "上传失败。");
        return;
      }

      const payload = data as {
        imported: number;
        skipped?: number;
        format: string;
      };
      const skipped = payload.skipped ?? 0;

      setMessage(
        skipped > 0
          ? `已导入 ${payload.imported} 条账号，跳过 ${skipped} 条重复账号，识别格式：${payload.format.toUpperCase()}`
          : `已导入 ${payload.imported} 条账号，识别格式：${payload.format.toUpperCase()}`,
      );
      setContent("");
      if (fileRef.current) {
        fileRef.current.value = "";
      }
      router.refresh();
    });
  }

  const contentNode = (
    <div className="space-y-5">
      {!embedded ? (
        <div className="space-y-1">
          <h3 className="font-[family-name:var(--font-heading)] text-2xl text-stone-950">
            上传账号池
          </h3>
          <p className="text-sm leading-6 text-stone-600">
            支持 `JSON` 数组、单个 `JSON` 对象和 `JSONL`。原始内容会原样保存，用户端展示和复制的也是这份原文。
          </p>
        </div>
      ) : (
        <p className="text-sm leading-6 text-stone-600">
          支持 `JSON` 数组、单个 `JSON` 对象和 `JSONL`。原始内容会原样保存，用户端展示和复制的也是这份原文。
        </p>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-4 lg:grid-cols-[1.2fr_0.8fr]">
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
              初始检测状态
            </label>
            <select
              value={checkStatus}
              onChange={(event) =>
                setCheckStatus(event.target.value as "ok" | "unknown")
              }
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500"
            >
              <option value="ok">正常</option>
              <option value="unknown">待确认</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 rounded-3xl border border-stone-200 bg-white p-4">
          <label className="text-sm font-semibold text-stone-800">
            文件上传
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.jsonl,.txt,application/json"
            className="block w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-700"
          />
        </div>

        <div className="space-y-2 rounded-3xl border border-stone-200 bg-white p-4">
          <label className="text-sm font-semibold text-stone-800">
            或直接粘贴内容
          </label>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
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
              isPending || !resolvedPoolCode.trim() || accountTypes.length === 0
            }
            className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isPending ? "上传中..." : "导入账号"}
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
