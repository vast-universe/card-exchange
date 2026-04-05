import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/auth";
import { createAccountType } from "@/lib/account-types";
import { readJsonBody, toErrorResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "未登录。" }, { status: 401 });
    }

    const body = await readJsonBody<{
      code?: string;
    }>(request);

    await createAccountType({
      code: body.code ?? "",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
