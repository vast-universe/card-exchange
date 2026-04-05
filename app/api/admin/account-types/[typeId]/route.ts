import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/auth";
import { deleteAccountType } from "@/lib/account-types";
import { toErrorResponse } from "@/lib/utils";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ typeId: string }> },
) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "未登录。" }, { status: 401 });
    }

    const { typeId } = await context.params;
    await deleteAccountType(Number(typeId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
