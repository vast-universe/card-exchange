"use client";

import { CopyButton } from "@/components/ui/copy-button";

type AccountInfo = {
  position: number;
  status: string;
  checkStatus: string;
  payload: Record<string, unknown>;
  replacedAt?: string;
  replacedByPosition?: number;
  isReplacement?: boolean;
  replacedPosition?: number;
};

type MultiAccountDisplayProps = {
  accounts: AccountInfo[];
  accountQuantity: number;
  title?: string;
};

function downloadJson(data: Record<string, unknown>[], filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getStatusBadge(status: string) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        活跃
      </span>
    );
  }
  if (status === "replaced") {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
        已换号
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
      {status}
    </span>
  );
}

function getCheckStatusBadge(checkStatus: string) {
  if (checkStatus === "ok") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        正常
      </span>
    );
  }
  if (checkStatus === "banned") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
        已封禁
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
      待确认
    </span>
  );
}

export function MultiAccountDisplay({
  accounts,
  accountQuantity,
  title = "账号列表",
}: MultiAccountDisplayProps) {
  // Generate pure account JSON array (only active accounts, sorted by position)
  const activeAccounts = accounts
    .filter((acc) => acc.status === "active")
    .sort((a, b) => a.position - b.position);

  const exportJson = JSON.stringify(
    activeAccounts.map((acc) => acc.payload),
    null,
    2
  );

  const handleDownloadJson = () => {
    downloadJson(
      activeAccounts.map((acc) => acc.payload),
      "accounts.json"
    );
  };

  return (
    <section className="space-y-4 rounded-3xl border border-stone-200 bg-white/85 p-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-[family-name:var(--font-heading)] text-xl text-stone-950">
              {title}
            </h3>
            <p className="text-sm leading-6 text-stone-600">
              共 {accountQuantity} 个账号
            </p>
          </div>
          <div className="flex gap-2">
            <CopyButton
              value={exportJson}
              label="复制所有账号 JSON"
              size="sm"
            />
            <button
              type="button"
              onClick={handleDownloadJson}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            >
              下载 accounts.json
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
          <p className="text-sm text-amber-900">
            💡 如遇封号请访问售后页面（继续提交同一卡密即可）
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {accounts
          .sort((a, b) => a.position - b.position)
          .map((account) => (
            <div
              key={account.position}
              className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900">
                    账号 #{account.position}
                  </span>
                  {getStatusBadge(account.status)}
                  {getCheckStatusBadge(account.checkStatus)}
                </div>
                {account.status === "active" && (
                  <CopyButton
                    value={JSON.stringify(account.payload, null, 2)}
                    label="复制"
                    size="xs"
                    variant="ghost"
                  />
                )}
              </div>

              {account.status === "active" && (
                <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-stone-200 bg-white px-3 py-3 text-xs leading-6 text-stone-800">
                  {JSON.stringify(account.payload, null, 2)}
                </pre>
              )}

              {account.status === "replaced" && (
                <div className="text-sm text-stone-600">
                  <p>
                    已于 {account.replacedAt ? new Date(account.replacedAt).toLocaleString("zh-CN") : "未知时间"} 被换号
                  </p>
                  {account.replacedByPosition && (
                    <p>替换为账号 #{account.replacedByPosition}</p>
                  )}
                </div>
              )}

              {account.isReplacement && account.replacedPosition && (
                <div className="mt-2 text-xs text-blue-700">
                  🔄 此账号替换了原账号 #{account.replacedPosition}
                </div>
              )}
            </div>
          ))}
      </div>
    </section>
  );
}
