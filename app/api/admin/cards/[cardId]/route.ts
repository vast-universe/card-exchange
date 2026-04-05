import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/auth";
import { deleteCard, updateCard } from "@/lib/cards";
import type { CardStatus } from "@/lib/types";
import { readJsonBody, toErrorResponse } from "@/lib/utils";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ cardId: string }> },
) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "未登录。" }, { status: 401 });
    }

    const { cardId } = await context.params;
    const body = await readJsonBody<{
      poolCode?: string;
      aftersaleLimit?: number;
      warrantyHours?: number;
      status?: CardStatus;
    }>(request);

    await updateCard({
      cardId: Number(cardId),
      poolCode: body.poolCode ?? "",
      aftersaleLimit: Number(body.aftersaleLimit ?? 0),
      warrantyHours: Number(body.warrantyHours ?? 24),
      status: body.status ?? "normal",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ cardId: string }> },
) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "未登录。" }, { status: 401 });
    }

    const { cardId } = await context.params;
    await deleteCard(Number(cardId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
