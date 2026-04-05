import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/auth";
import {
  deleteAccount,
  updateAccount,
} from "@/lib/accounts";
import type {
  AccountCheckStatus,
  AccountStockStatus,
} from "@/lib/types";
import { readJsonBody, toErrorResponse } from "@/lib/utils";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "未登录。" }, { status: 401 });
    }

    const { accountId } = await context.params;
    const body = await readJsonBody<{
      poolCode?: string;
      payloadRaw?: string;
      checkStatus?: AccountCheckStatus;
      stockStatus?: AccountStockStatus;
    }>(request);

    await updateAccount({
      accountId: Number(accountId),
      poolCode: body.poolCode ?? "",
      payloadRaw: body.payloadRaw ?? "",
      checkStatus: body.checkStatus ?? "unknown",
      stockStatus: body.stockStatus ?? "available",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "未登录。" }, { status: 401 });
    }

    const { accountId } = await context.params;
    await deleteAccount(Number(accountId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
