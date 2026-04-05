import { NextResponse } from "next/server";

import { redeemCardByCode } from "@/lib/exchange";
import {
  ensurePublicActionAllowed,
  recordPublicActionAttempt,
} from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { getRequestIp, readJsonBody, toErrorResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const body = await readJsonBody<{
      cardCode?: string;
      turnstileToken?: string;
    }>(request);
    await ensurePublicActionAllowed("redeem", ip);

    const verification = await verifyTurnstile(
      body.turnstileToken,
      ip,
    );

    if (!verification.ok) {
      return NextResponse.json(
        { error: verification.message },
        { status: 400 },
      );
    }

    await recordPublicActionAttempt("redeem", ip);
    const result = await redeemCardByCode(body.cardCode ?? "");
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
