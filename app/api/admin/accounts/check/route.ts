import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/auth";
import {
  disableAccount,
  getAdminAccountById,
  markAccountBanned,
  replaceAccountPayloadRaw,
  setAccountCheckStatus,
} from "@/lib/accounts";
import { checkKiroAccountLive } from "@/lib/kiro-portal";
import { readJsonBody, toErrorResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "未登录。" }, { status: 401 });
    }

    const body = await readJsonBody<{
      accountId?: number;
      persist?: boolean;
    }>(request);
    const persist = body.persist !== false;

    const account = await getAdminAccountById(Number(body.accountId));
    const liveCheck = await checkKiroAccountLive(
      account.pool_code,
      account.payload_raw,
    );
    const checkedAt = new Date().toISOString();

    let payloadRaw = account.payload_raw;
    if (persist && liveCheck.payloadRaw !== account.payload_raw) {
      await replaceAccountPayloadRaw(account.id, liveCheck.payloadRaw);
    }
    payloadRaw = liveCheck.payloadRaw;

    let checkStatus = account.check_status;
    let stockStatus = account.stock_status;

    if (persist && liveCheck.supported) {
      if (liveCheck.runtimeStatus === "banned") {
        checkStatus = "banned";

        if (account.active_card_id) {
          await setAccountCheckStatus(account.id, "banned");
        } else {
          await markAccountBanned(account.id);
          stockStatus = "disabled";
        }
      } else if (liveCheck.runtimeStatus === "invalid") {
        checkStatus = "unknown";
        await setAccountCheckStatus(account.id, "unknown");

        if (!account.active_card_id && stockStatus !== "disabled") {
          await disableAccount(account.id);
          stockStatus = "disabled";
        }
      } else {
        checkStatus = liveCheck.checkStatus;

        if (checkStatus !== account.check_status) {
          await setAccountCheckStatus(account.id, checkStatus);
        }
      }
    }

    return NextResponse.json({
      supported: liveCheck.supported,
      checkSource: liveCheck.supported ? "live" : "stored",
      runtimeStatus: liveCheck.runtimeStatus,
      checkStatus,
      stockStatus,
      statusDetail:
        liveCheck.message ??
        (liveCheck.supported
          ? "实时检测完成。"
          : "当前账号类型暂不支持实时检测。"),
      quota: liveCheck.quota,
      payloadRaw,
      refreshed: liveCheck.refreshed,
      checkedAt,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
