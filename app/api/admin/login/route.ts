import { NextResponse } from "next/server";

import {
  clearAdminSession,
  validateAdminPassword,
  withAdminSession,
} from "@/lib/auth";
import {
  clearLoginRateLimit,
  ensureLoginAllowed,
  recordLoginFailure,
} from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { getRequestIp, readJsonBody, toErrorResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const body = await readJsonBody<{
      password?: string;
      turnstileToken?: string;
    }>(request);

    await ensureLoginAllowed(ip);

    const verification = await verifyTurnstile(body.turnstileToken, ip);
    if (!verification.ok) {
      return NextResponse.json(
        { error: verification.message },
        { status: 400 },
      );
    }

    const valid = await validateAdminPassword(body.password?.trim() ?? "");
    if (!valid) {
      await recordLoginFailure(ip);
      return NextResponse.json({ error: "密码错误。" }, { status: 401 });
    }

    await clearLoginRateLimit(ip);
    const response = NextResponse.json({ ok: true });
    return withAdminSession(response);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  return clearAdminSession(response);
}
