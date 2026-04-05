import { NextResponse } from "next/server";

import { listAdminCards } from "@/lib/cards";
import { hasAdminSession } from "@/lib/auth";
import type { CardStatus } from "@/lib/types";
import { toErrorResponse } from "@/lib/utils";

function normalizeCardStatus(value: string): CardStatus | "all" {
  if (value === "normal" || value === "disabled") {
    return value;
  }
  return "all";
}

function normalizeUsage(
  value: string,
): "all" | "unused" | "issued" | "bound" | "used" {
  if (
    value === "unused" ||
    value === "issued" ||
    value === "bound" ||
    value === "used"
  ) {
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
    const status = normalizeCardStatus(searchParams.get("status") || "all");
    const usage = normalizeUsage(searchParams.get("usage") || "all");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);

    const result = await listAdminCards({
      query,
      poolCode,
      status,
      usage,
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
