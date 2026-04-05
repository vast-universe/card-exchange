import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/auth";
import { createAccount } from "@/lib/accounts";
import type {
  AccountCheckStatus,
  AccountStockStatus,
} from "@/lib/types";
import { readJsonBody, toErrorResponse } from "@/lib/utils";

function normalizeCheckStatus(value: string): AccountCheckStatus {
  if (value === "ok" || value === "banned" || value === "unknown") {
    return value;
  }

  return "ok";
}

function normalizeStockStatus(value: string): AccountStockStatus {
  if (value === "available" || value === "bound" || value === "disabled") {
    return value;
  }

  return "available";
}

export async function POST(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "未登录。" }, { status: 401 });
    }

    const body = await readJsonBody<{
      poolCode?: string;
      payloadRaw?: string;
      checkStatus?: AccountCheckStatus;
      stockStatus?: AccountStockStatus;
    }>(request);

    const account = await createAccount({
      poolCode: body.poolCode ?? "",
      payloadRaw: body.payloadRaw ?? "",
      checkStatus: normalizeCheckStatus(body.checkStatus ?? "ok"),
      stockStatus: normalizeStockStatus(body.stockStatus ?? "available"),
    });

    return NextResponse.json({ account });
  } catch (error) {
    return toErrorResponse(error);
  }
}
