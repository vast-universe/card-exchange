import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/auth";
import { createCards } from "@/lib/cards";
import { readJsonBody, toErrorResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "未登录。" }, { status: 401 });
    }

    const body = await readJsonBody<{
      poolCode?: string;
      count?: number;
      accountQuantity?: number;
      aftersaleLimit?: number;
      warrantyHours?: number;
    }>(request);

    const codes = await createCards({
      poolCode: body.poolCode ?? "",
      count: Number(body.count ?? 0),
      accountQuantity: Number(body.accountQuantity ?? 1),
      aftersaleLimit: Number(body.aftersaleLimit ?? 0),
      warrantyHours: Number(body.warrantyHours ?? 24),
    });

    return NextResponse.json({ codes });
  } catch (error) {
    return toErrorResponse(error);
  }
}
