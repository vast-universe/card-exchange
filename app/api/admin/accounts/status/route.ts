import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/auth";
import { updateAccountStatus } from "@/lib/accounts";
import type {
  AccountCheckStatus,
  AccountStockStatus,
} from "@/lib/types";
import { readJsonBody, toErrorResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "未登录。" }, { status: 401 });
    }

    const body = await readJsonBody<{
      accountId?: number;
      checkStatus?: AccountCheckStatus;
      stockStatus?: AccountStockStatus;
    }>(request);

    await updateAccountStatus({
      accountId: Number(body.accountId),
      checkStatus: body.checkStatus ?? "unknown",
      stockStatus: body.stockStatus ?? "available",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
