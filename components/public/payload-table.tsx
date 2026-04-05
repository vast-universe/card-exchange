"use client";

import { CopyButton } from "@/components/ui/copy-button";

type PayloadTableProps = {
  raw: string;
  title?: string;
  subtitle?: string;
};

export function PayloadTable({
  raw,
  title = "账号字段",
  subtitle,
}: PayloadTableProps) {
  return (
    <section className="space-y-4 rounded-3xl border border-stone-200 bg-white/85 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-[family-name:var(--font-heading)] text-xl text-stone-950">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-sm leading-6 text-stone-600">{subtitle}</p>
          ) : null}
        </div>
        <CopyButton value={raw} label="复制原文" />
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
        <p className="text-sm font-semibold text-stone-900">账号原文</p>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-2xl border border-stone-200 bg-white px-4 py-4 text-xs leading-6 text-stone-800">
          {raw}
        </pre>
      </div>
    </section>
  );
}
