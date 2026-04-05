"use client";

import { useState, useTransition } from "react";

import { PayloadTable } from "@/components/public/payload-table";
import { StatusTable } from "@/components/public/status-table";
import { TurnstileBox } from "@/components/public/turnstile-box";

type RedeemResponse = {
  payloadRaw: string;
  reused: boolean;
};

export function RedeemForm({ siteKey }: { siteKey: string }) {
  const turnstileEnabled = Boolean(siteKey);
  const [cardCode, setCardCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [result, setResult] = useState<RedeemResponse | null>(null);
  const [redeemedCardCode, setRedeemedCardCode] = useState("");
  const [error, setError] = useState("");
  const [widgetKey, setWidgetKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  function resetChallenge() {
    setTurnstileToken("");
    setWidgetKey((value) => value + 1);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/redeem", {
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
        | RedeemResponse
        | {
            error: string;
          };

      if (!response.ok) {
        setResult(null);
        setRedeemedCardCode("");
        setError("error" in data ? data.error : "兑换失败，请稍后重试。");
        resetChallenge();
        return;
      }

      setResult(data as RedeemResponse);
      setRedeemedCardCode(cardCode.trim());
      resetChallenge();
    });
  }

  return (
    <div className="rounded-[2rem] border border-stone-200 bg-[rgba(255,253,250,0.9)] p-6 shadow-[0_30px_80px_-50px_rgba(41,37,36,0.42)] sm:p-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="redeem-card-code"
            className="text-sm font-semibold text-stone-800"
          >
            卡密
          </label>
          <input
            id="redeem-card-code"
            value={cardCode}
            onChange={(event) => {
              const nextCardCode = event.target.value;
              setCardCode(nextCardCode);

              if (result && nextCardCode.trim() !== redeemedCardCode) {
                setResult(null);
                setRedeemedCardCode("");
                setError("");
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
            isPending ||
            !cardCode.trim() ||
            (turnstileEnabled && !turnstileToken)
          }
          className="inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {isPending ? "兑换中..." : "兑换"}
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
            title="兑换信息"
            items={[
              {
                label: "当前卡密",
                value: redeemedCardCode,
              },
              {
                label: "结果",
                value: result.reused ? "已返回当前账号" : "兑换成功",
              },
              {
                label: "售后方式",
                value: "售后页输入卡密检测",
              },
            ]}
          />

          <PayloadTable raw={result.payloadRaw} title="账号内容" />
        </div>
      ) : null}
    </div>
  );
}
