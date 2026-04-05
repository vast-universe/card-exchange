"use client";

import { useState, useTransition } from "react";

import { MultiAccountDisplay } from "@/components/public/multi-account-display";
import { PayloadTable } from "@/components/public/payload-table";
import { StatusTable } from "@/components/public/status-table";
import { TurnstileBox } from "@/components/public/turnstile-box";

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

type RedeemResponse = {
  payloadRaw?: string;
  reused: boolean;
  accountQuantity?: number;
  accounts?: AccountInfo[];
};

type SupportResponse = {
  payloadRaw?: string;
  checkStatus?: "ok" | "banned" | "unknown";
  aftersaleLeft?: number;
  canReplace?: boolean;
  checkSource?: "live" | "stored";
  statusDetail?: string | null;
  quota?: {
    plan: string | null;
    total: number;
    used: number;
    remaining: number;
    percent: number;
    nextResetAt: string | null;
  } | null;
  warrantyHours?: number;
  warrantyStartedAt?: string | null;
  warrantyExpiresAt?: string | null;
  warrantyExpired?: boolean;
  warrantyStatusText?: string;
  accountQuantity?: number;
  accounts?: AccountInfo[];
  replaced?: boolean;
  replacedCount?: number;
  checkResult?: {
    total: number;
    ok: number;
    banned: number;
    unknown: number;
  };
  warranty?: {
    hours: number;
    startedAt: string | null;
    expiresAt: string | null;
    expired: boolean;
    statusText: string;
  };
  aftersale?: {
    limit: number;
    used: number;
    remaining: number;
  };
};

type ResultState =
  | {
      type: "redeem";
      cardCode: string;
      data: RedeemResponse;
    }
  | {
      type: "support";
      cardCode: string;
      data: SupportResponse;
    };

type UnifiedResponse =
  | ({
      mode: "redeem";
    } & RedeemResponse)
  | ({
      mode: "support";
    } & SupportResponse);

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

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ExchangeCenter({ siteKey }: { siteKey: string }) {
  const turnstileEnabled = Boolean(siteKey);
  const [cardCode, setCardCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [replaceTurnstileToken, setReplaceTurnstileToken] = useState("");
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState("");
  const [widgetKey, setWidgetKey] = useState(0);
  const [replaceWidgetKey, setReplaceWidgetKey] = useState(0);
  const [isActionPending, startActionTransition] = useTransition();
  const [isReplacePending, startReplaceTransition] = useTransition();

  function resetActionChallenge() {
    setTurnstileToken("");
    setWidgetKey((value) => value + 1);
  }

  function resetReplaceChallenge() {
    setReplaceTurnstileToken("");
    setReplaceWidgetKey((value) => value + 1);
  }

  function clearResultIfCardChanged(nextCardCode: string) {
    if (error) {
      setError("");
    }

    if (result && nextCardCode.trim() !== result.cardCode) {
      setResult(null);
      setError("");
      resetReplaceChallenge();
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startActionTransition(async () => {
      const response = await fetch("/api/card", {
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
        | UnifiedResponse
        | {
            error: string;
          };

      if (!response.ok) {
        setResult(null);
        setError("error" in data ? data.error : "兑换失败，请稍后重试。");
        resetActionChallenge();
        resetReplaceChallenge();
        return;
      }

      const nextData = data as UnifiedResponse;

      if (nextData.mode === "redeem") {
        setResult({
          type: "redeem",
          cardCode: cardCode.trim(),
          data: {
            payloadRaw: nextData.payloadRaw,
            reused: nextData.reused,
            accountQuantity: nextData.accountQuantity,
            accounts: nextData.accounts,
          },
        });
      } else {
        setResult({
          type: "support",
          cardCode: cardCode.trim(),
          data: {
            payloadRaw: nextData.payloadRaw,
            checkStatus: nextData.checkStatus,
            aftersaleLeft: nextData.aftersaleLeft,
            canReplace: nextData.canReplace,
            checkSource: nextData.checkSource,
            statusDetail: nextData.statusDetail,
            quota: nextData.quota,
            warrantyHours: nextData.warrantyHours,
            warrantyStartedAt: nextData.warrantyStartedAt,
            warrantyExpiresAt: nextData.warrantyExpiresAt,
            warrantyExpired: nextData.warrantyExpired,
            warrantyStatusText: nextData.warrantyStatusText,
            accountQuantity: nextData.accountQuantity,
            accounts: nextData.accounts,
            replaced: nextData.replaced,
            replacedCount: nextData.replacedCount,
            checkResult: nextData.checkResult,
            warranty: nextData.warranty,
            aftersale: nextData.aftersale,
          },
        });
      }

      resetActionChallenge();
      resetReplaceChallenge();
    });
  }

  function handleReplace() {
    if (!result || result.type !== "support") {
      setError("请先检测当前卡密。");
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
          cardCode: result.cardCode,
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
        type: "support",
        cardCode: result.cardCode,
        data: {
          payloadRaw: payload.payloadRaw,
          checkStatus: "ok",
          aftersaleLeft: payload.aftersaleLeft,
          canReplace: false,
          checkSource: "stored",
          statusDetail: "已更换新账号，如需复查可再次检测。",
          quota: null,
          warrantyHours: result.data.warrantyHours,
          warrantyStartedAt: result.data.warrantyStartedAt,
          warrantyExpiresAt: result.data.warrantyExpiresAt,
          warrantyExpired: result.data.warrantyExpired,
          warrantyStatusText: result.data.warrantyStatusText,
        },
      });
      resetReplaceChallenge();
    });
  }

  const supportResult = result?.type === "support" ? result.data : null;

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-2xl border border-blue-200 bg-blue-50/80 p-5">
        <div>
          <p className="font-semibold text-blue-900">切号器使用说明</p>
          <div className="mt-2 space-y-1 text-sm text-blue-800">
            <p>
              推荐使用切号器管理账号：
              <a
                href="https://github.com/hj01857655/kiro-account-manager/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 font-medium text-blue-600 underline hover:text-blue-700"
              >
                下载地址
              </a>
            </p>
            <p>
              1. MAC 电脑如提示损坏，执行命令：
              <code className="mx-1 rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs">
                sudo xattr -cr /Applications/KiroAccountManager.app
              </code>
              再打开 app
            </p>
            <p>
              2. 记得在切号器「设置」中关闭「锁定模型」，否则 IDE 选择模型时会有问题
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-[rgba(255,253,250,0.9)] p-6 shadow-[0_30px_80px_-50px_rgba(41,37,36,0.42)] sm:p-8">
        <div className="space-y-2">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl text-stone-950 sm:text-4xl">
            输入卡密
          </h2>
          <p className="text-sm leading-7 text-stone-600 sm:text-base">
            输入一次卡密后提交，系统会自动判断是直接返回账号，还是展示当前售后状态。
          </p>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="exchange-card-code"
              className="text-sm font-semibold text-stone-800"
            >
              卡密
            </label>
            <input
              id="exchange-card-code"
              value={cardCode}
              onChange={(event) => {
                const nextCardCode = event.target.value;
                setCardCode(nextCardCode);
                clearResultIfCardChanged(nextCardCode);
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
              isActionPending ||
              isReplacePending ||
              !cardCode.trim() ||
              (turnstileEnabled && !turnstileToken)
            }
            className="inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isActionPending ? "处理中..." : "提交"}
          </button>
        </form>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result?.type === "redeem" ? (
        <div className="space-y-4">
          <StatusTable
            title="兑换结果"
            items={[
              {
                label: "当前卡密",
                value: result.cardCode,
              },
              {
                label: "处理结果",
                value: result.data.reused ? "已返回当前账号" : "兑换成功",
              },
              {
                label: "售后方式",
                value: "后续继续提交同一卡密即可查看售后状态",
              },
            ]}
          />

          {result.data.accountQuantity && result.data.accountQuantity > 1 ? (
            <MultiAccountDisplay
              accounts={result.data.accounts || []}
              accountQuantity={result.data.accountQuantity}
              title="账号内容"
            />
          ) : (
            <PayloadTable raw={result.data.payloadRaw || ""} title="账号内容" />
          )}
        </div>
      ) : null}

      {result?.type === "support" ? (
        <div className="space-y-4">
          {result.data.accountQuantity && result.data.accountQuantity > 1 ? (
            <>
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <h3 className="mb-3 text-base font-semibold text-stone-900">售后结果</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">当前卡密</span>
                    <span className="font-mono text-stone-900">{result.cardCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">账号数量</span>
                    <span className="text-stone-900">{result.data.accountQuantity}</span>
                  </div>
                  {result.data.checkResult && (
                    <div className="col-span-2 flex justify-between border-t border-stone-100 pt-2.5">
                      <span className="text-stone-600">检测结果</span>
                      <span className="text-stone-900">
                        正常 {result.data.checkResult.ok} / 封禁 {result.data.checkResult.banned} / 未知 {result.data.checkResult.unknown}
                      </span>
                    </div>
                  )}
                  {result.data.replaced && (
                    <div className="col-span-2 flex justify-between border-t border-stone-100 pt-2.5">
                      <span className="text-stone-600">自动换号</span>
                      <span className="text-green-600 font-medium">已自动更换 {result.data.replacedCount} 个账号</span>
                    </div>
                  )}
                  {result.data.warranty && (
                    <>
                      <div className="flex justify-between border-t border-stone-100 pt-2.5">
                        <span className="text-stone-600">质保状态</span>
                        <span className="text-stone-900">{result.data.warranty.statusText}</span>
                      </div>
                      <div className="flex justify-between border-t border-stone-100 pt-2.5">
                        <span className="text-stone-600">质保截止</span>
                        <span className="text-stone-900">{formatDateTime(result.data.warranty.expiresAt)}</span>
                      </div>
                    </>
                  )}
                  {result.data.aftersale && (
                    <div className="flex justify-between border-t border-stone-100 pt-2.5">
                      <span className="text-stone-600">剩余售后</span>
                      <span className="text-stone-900">{result.data.aftersale.remaining} / {result.data.aftersale.limit}</span>
                    </div>
                  )}
                </div>
              </div>

              <MultiAccountDisplay
                accounts={result.data.accounts || []}
                accountQuantity={result.data.accountQuantity}
                title="账号列表"
              />
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <h3 className="mb-3 text-base font-semibold text-stone-900">售后结果</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">当前卡密</span>
                    <span className="font-mono text-stone-900">{result.cardCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">检测来源</span>
                    <span className="text-stone-900">{result.data.checkSource === "live" ? "实时检测" : "本地记录"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">账号状态</span>
                    <span className="text-stone-900">{getStatusLabel(result.data.checkStatus || "unknown")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">状态说明</span>
                    <span className="text-stone-900">{result.data.statusDetail || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">剩余售后次数</span>
                    <span className="text-stone-900">{result.data.aftersaleLeft || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">可否换号</span>
                    <span className="text-stone-900">{result.data.canReplace ? "可以" : "不可以"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">质保状态</span>
                    <span className="text-stone-900">{result.data.warrantyStatusText || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">质保截止</span>
                    <span className="text-stone-900">{formatDateTime(result.data.warrantyExpiresAt ?? null)}</span>
                  </div>
                  <div className="col-span-2 flex justify-between border-t border-stone-100 pt-2.5">
                    <span className="text-stone-600">额度剩余</span>
                    <span className="text-stone-900">
                      {result.data.quota ? `${formatQuota(result.data.quota.remaining)} / ${formatQuota(result.data.quota.total)}` : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <PayloadTable raw={result.data.payloadRaw || ""} title="账号内容" />
            </>
          )}

          {supportResult?.canReplace ? (
            <div className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50/70 p-5">
              <div className="space-y-1">
                <p className="text-base font-semibold text-stone-900">
                  当前卡密可申请换新账号
                </p>
                <p className="text-sm leading-7 text-stone-600">
                  账号异常且仍有售后次数时，可直接在这里更换。
                </p>
              </div>

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
                  isActionPending ||
                  isReplacePending ||
                  (turnstileEnabled && !replaceTurnstileToken)
                }
                className="inline-flex items-center justify-center rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-300"
              >
                {isReplacePending ? "换号中..." : "换新账号"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-stone-200 bg-white/72 p-5 text-sm leading-7 text-stone-600 shadow-[0_20px_60px_-45px_rgba(41,37,36,0.45)] sm:p-6">
        <p className="font-semibold text-stone-900">使用说明</p>
        <div className="mt-3 space-y-1">
          <p>1. 新卡密提交后会直接返回当前账号原文。</p>
          <p>2. 已绑定账号的卡密提交后，会展示当前账号状态和剩余售后次数。</p>
          <p>3. 若账号异常且仍有次数，可在检测结果里直接换新账号。</p>
        </div>
      </section>
    </div>
  );
}
