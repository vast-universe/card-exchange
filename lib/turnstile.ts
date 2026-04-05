import "server-only";

import { getSecret, isTurnstileEnabled } from "@/lib/env";

export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string | null,
) {
  if (!(await isTurnstileEnabled())) {
    return { ok: true };
  }

  const secret = await getSecret("TURNSTILE_SECRET_KEY");

  if (!secret && process.env.NODE_ENV !== "production") {
    return { ok: true };
  }

  if (!token) {
    return { ok: false, message: "请先完成人机验证。" };
  }

  const payload = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    payload.set("remoteip", remoteIp);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: payload,
    },
  );

  const result = (await response.json()) as {
    success: boolean;
    "error-codes"?: string[];
  };

  if (!result.success) {
    return {
      ok: false,
      message: "人机验证失败，请刷新后再试。",
      detail: result["error-codes"] ?? [],
    };
  }

  return { ok: true };
}
