import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/auth";
import { deleteCard } from "@/lib/cards";
import { AppError, readJsonBody, toErrorResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "未登录。" }, { status: 401 });
    }

    const body = await readJsonBody<{
      ids?: unknown[];
    }>(request);

    const ids = Array.from(
      new Set(
        (Array.isArray(body.ids) ? body.ids : [])
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0),
      ),
    ).slice(0, 100);

    if (ids.length === 0) {
      throw new AppError("请选择要删除的卡密。");
    }

    const errors: string[] = [];
    let deletedCount = 0;

    for (const id of ids) {
      try {
        await deleteCard(id);
        deletedCount += 1;
      } catch (error) {
        if (error instanceof AppError) {
          errors.push(`#${id} ${error.message}`);
          continue;
        }

        throw error;
      }
    }

    return NextResponse.json({
      deletedCount,
      errors,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
