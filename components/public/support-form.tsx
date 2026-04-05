"use client";

import { useState, useTransition } from "react";

import { PayloadTable } from "@/components/public/payload-table";
import { StatusTable } from "@/components/public/status-table";
import { TurnstileBox } from "@/components/public/turnstile-box";

type SupportResponse = {
  payloadRaw: string;
  checkStatus: "ok" | "banned" | "unknown";
  aftersaleLeft: number;
  canReplace: boolean;
  checkSource: "live" | "stored";
  statusDetail: string | null;
  quota: {
    plan: string | null;
    total: number;
    used: number;
    remaining: number;
    percent: number;
    nextResetAt: string | null;
  } | null;
};

function getStatusLabel(status: SupportResponse["checkStatus"]) {
  if (status === "ok") return "正常";
  if (status === "banned") return "已封禁";
  return "待确认";
}

function formatQuota(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
}

function formatResetAt(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function SupportForm({ siteKey }: { siteKey: string }) {
  const turnstileEnabled = Boolean(siteKey);
  const [cardCode, setCardCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [replaceTurnstileToken, setReplaceTurnstileToken] = useState("");
  const [result, setResult] = useState<SupportResponse | null>(null);
  const [queriedCardCode, setQueriedCardCode] = useState("");
  const [error, setError] = useState("");
  const [widgetKey, setWidgetKey] = useState(0);
  const [replaceWidgetKey, setReplaceWidgetKey] = useState(0);
  const [isQueryPending, startQueryTransition] = useTransition();
  const [isReplacePending, startReplaceTransition] = useTransition();

  function resetQueryChallenge() {
    setTurnstileToken("");
    setWidgetKey((value) => value + 1);
  }

  function resetReplaceChallenge() {
    setReplaceTurnstileToken("");
    setReplaceWidgetKey((value) => value + 1);
  }

  function handleQuery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startQueryTransition(async () => {
      const response = await fetch("/api/support/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardCode,
          turnstileToken,
        }),
      });

      const data = (await response.json()) as
        | SupportResponse
        | {
            error: string;
          };

      if (!response.ok) {
        setResult(null);
        setQueriedCardCode("");
        setError("error" in data ? data.error : "查询失败，请稍后重试。");
        resetQueryChallenge();
        resetReplaceChallenge();
        return;
      }

      setResult(data as SupportResponse);
      setQueriedCardCode(cardCode.trim());
      resetQueryChallenge();
      resetReplaceChallenge();
    });
  }

  function handleReplace() {
    if (!queriedCardCode) {
      setError("请先重新检测当前卡密。");
      return;
    }

    setError("");

    startReplaceTransition(async () => {
      const response = await fetch("/api/support/replace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardCode: queriedCardCode,
          turnstileToken: replaceTurnstileToken,
        }),
      });

      const data = (await response.json()) as
        | {
            payloadRaw: string;
            aftersaleLeft: number;
          }
        | {
            error: string;
          };

      if (!response.ok) {
        setError("error" in data ? data.error : "换号失败，请稍后重试。");
        resetReplaceChallenge();
        return;
      }

      const payload = data as {
        payloadRaw: string;
        aftersaleLeft: number;
      };

      setResult({
        payloadRaw: payload.payloadRaw,
        checkStatus: "ok",
        aftersaleLeft: payload.aftersaleLeft,
        canReplace: false,
        checkSource: "stored",
        statusDetail: "已更换新账号，如需复查可再次点击检测。",
        quota: null,
      });
      resetReplaceChallenge();
    });
  }

  return (
    <div className="rounded-[2rem] border border-stone-200 bg-[rgba(255,253,250,0.9)] p-6 shadow-[0_30px_80px_-50px_rgba(41,37,36,0.42)] sm:p-8">
      <form className="space-y-6" onSubmit={handleQuery}>
        <div className="space-y-2">
          <label
            htmlFor="support-card-code"
            className="text-sm font-semibold text-stone-800"
          >
            卡密
          </label>
          <input
            id="support-card-code"
            value={cardCode}
            onChange={(event) => {
              const nextCardCode = event.target.value;
              setCardCode(nextCardCode);

              if (result && nextCardCode.trim() !== queriedCardCode) {
                setResult(null);
                setQueriedCardCode("");
                setError("");
                resetReplaceChallenge();
              }
            }}
            placeholder="输入卡密"
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500"
          />
        </div>

        {turnstileEnabled ? (
          <TurnstileBox
            key={widgetKey}
            siteKey={siteKey}
            onTokenChange={setTurnstileToken}
          />
        ) : null}

        <button
          type="submit"
          disabled={
            isQueryPending ||
            !cardCode.trim() ||
            (turnstileEnabled && !turnstileToken)
          }
          className="inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {isQueryPending ? "检测中..." : "检测"}
        </button>
      </form>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-4">
          <StatusTable
            title="当前状态"
            items={[
              {
                label: "当前卡密",
                value: queriedCardCode,
              },
              {
                label: "检测来源",
                value: result.checkSource === "live" ? "实时检测" : "本地记录",
              },
              {
                label: "账号状态",
                value: getStatusLabel(result.checkStatus),
              },
              {
                label: "状态说明",
                value: result.statusDetail || "-",
              },
              {
                label: "剩余售后次数",
                value: String(result.aftersaleLeft),
              },
              {
                label: "可否换号",
                value: result.canReplace ? "可以" : "不可以",
              },
              {
                label: "额度剩余",
                value: result.quota
                  ? `${formatQuota(result.quota.remaining)} / ${formatQuota(result.quota.total)}`
                  : "-",
              },
            ]}
          />

          <PayloadTable raw={result.payloadRaw} title="账号内容" />

          {result.quota ? (
            <StatusTable
              title="额度信息"
              items={[
                {
                  label: "套餐",
                  value: result.quota.plan || "-",
                },
                {
                  label: "已用额度",
                  value: formatQuota(result.quota.used),
                },
                {
                  label: "总额度",
                  value: formatQuota(result.quota.total),
                },
                {
                  label: "剩余额度",
                  value: formatQuota(result.quota.remaining),
                },
                {
                  label: "使用率",
                  value: `${result.quota.percent.toFixed(1)}%`,
                },
                {
                  label: "下次重置",
                  value: formatResetAt(result.quota.nextResetAt),
                },
              ]}
            />
          ) : null}

          {result.canReplace ? (
            <div className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50/70 p-5">
              {turnstileEnabled ? (
                <TurnstileBox
                  key={replaceWidgetKey}
                  siteKey={siteKey}
                  onTokenChange={setReplaceTurnstileToken}
                />
              ) : null}

              <button
                type="button"
                onClick={handleReplace}
                disabled={
                  isReplacePending ||
                  (turnstileEnabled && !replaceTurnstileToken) ||
                  !queriedCardCode
                }
                className="inline-flex items-center justify-center rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-300"
              >
                {isReplacePending ? "换号中..." : "换新账号"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
