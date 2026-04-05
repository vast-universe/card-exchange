import { NextResponse } from "next/server";

import { listAdminAccounts } from "@/lib/accounts";
import { hasAdminSession } from "@/lib/auth";
import type { AccountCheckStatus, AccountStockStatus } from "@/lib/types";
import { toErrorResponse } from "@/lib/utils";

function normalizeStockStatus(value: string): AccountStockStatus | "all" {
  if (value === "available" || value === "bound" || value === "disabled") {
    return value;
  }
  return "all";
}

function normalizeCheckStatus(value: string): AccountCheckStatus | "all" {
  if (value === "ok" || value === "banned" || value === "unknown") {
    return value;
  }
  return "all";
}

export async function GET(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "未登录。" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const poolCode = searchParams.get("poolCode")?.trim() || "";
    const stockStatus = normalizeStockStatus(
      searchParams.get("stockStatus") || "all",
    );
    const checkStatus = normalizeCheckStatus(
      searchParams.get("checkStatus") || "all",
    );
    const page = Math.max(1, Number(searchParams.get("page")) || 1);

    const result = await listAdminAccounts({
      query,
      poolCode,
      stockStatus,
      checkStatus,
      page,
      pageSize: 20,
    });

    const response = NextResponse.json(result);

    // 管理后台不缓存，确保实时查询
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate",
    );

    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
