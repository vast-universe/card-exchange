import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/auth";
import { insertAccounts, parseAccountUpload } from "@/lib/accounts";
import { readFormData, toErrorResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "未登录。" }, { status: 401 });
    }

    const formData = await readFormData(request);
    const poolCode = String(formData.get("poolCode") ?? "");
    const checkStatus = String(formData.get("checkStatus") ?? "ok");
    const content = String(formData.get("content") ?? "");
    const file = formData.get("file");

    let text = content;
    if (
      file &&
      typeof file === "object" &&
      "size" in file &&
      typeof file.size === "number" &&
      file.size > 0 &&
      "text" in file &&
      typeof file.text === "function"
    ) {
      text = await file.text();
    }

    const parsed = parseAccountUpload(text);
    const result = await insertAccounts({
      poolCode,
      payloads: parsed.payloads,
      checkStatus: checkStatus === "unknown" ? "unknown" : "ok",
    });

    return NextResponse.json({
      imported: result.imported,
      skipped: result.skipped,
      format: parsed.format,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
