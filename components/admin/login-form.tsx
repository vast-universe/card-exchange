"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { TurnstileBox } from "@/components/public/turnstile-box";
import { adminApiPath, adminPath } from "@/lib/admin-paths";

export function LoginForm({ siteKey }: { siteKey: string }) {
  const router = useRouter();
  const turnstileEnabled = Boolean(siteKey);
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
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
      const response = await fetch(adminApiPath("/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          turnstileToken,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "登录失败。");
        resetChallenge();
        return;
      }

      router.push(adminPath("/dashboard"));
      router.refresh();
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          htmlFor="admin-password"
          className="text-sm font-semibold text-stone-800"
        >
          管理密码
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="输入后台密码"
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

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={
          isPending ||
          !password.trim() ||
          (turnstileEnabled && !turnstileToken)
        }
        className="inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        {isPending ? "登录中..." : "进入后台"}
      </button>
    </form>
  );
}
