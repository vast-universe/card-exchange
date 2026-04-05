import { NextResponse } from "next/server";

import { issueCardsForExternal } from "@/lib/cards";
import { getSecret } from "@/lib/env";
import {
  AppError,
  readFormData,
  readJsonBody,
} from "@/lib/utils";

type SupplyRequestInput = {
  poolCode?: string;
  pool?: string;
  type?: string;
  productType?: string;
  sku?: string;
  pool_code?: string;
  product_code?: string;
  productCode?: string;
  product_type?: string;
  goodsCode?: string;
  goods_code?: string;
  count?: number | string;
  quantity?: number | string;
  qty?: number | string;
  num?: number | string;
  amount?: number | string;
  order_quantity?: number | string;
  warrantyHours?: number | string;
  warranty_hours?: number | string;
  warranty?: number | string;
  deliveryRef?: string;
  requestId?: string;
  orderId?: string;
  orderNo?: string;
  outTradeNo?: string;
  tradeNo?: string;
  delivery_ref?: string;
  request_id?: string;
  order_id?: string;
  order_no?: string;
  out_trade_no?: string;
  trade_no?: string;
  order_amount?: number | string;
  responseMode?: string;
  response_mode?: string;
  format?: string;
};

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return (
    request.headers.get("x-api-key")?.trim() ??
    request.headers.get("x-supply-token")?.trim() ??
    ""
  );
}

async function ensureSupplyApiAuthorized(request: Request) {
  const providedToken = getBearerToken(request);
  const expectedToken = await getSecret("SUPPLY_API_TOKEN");

  if (!providedToken || providedToken !== expectedToken) {
    throw new AppError("未授权。", 401);
  }
}

function firstNonEmpty(values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function normalizeSupplyInput(
  inputs: SupplyRequestInput[],
  request: Request,
) {
  const inputValues = <K extends keyof SupplyRequestInput>(key: K) =>
    inputs.map((item) => item[key]);

  const deliveryRef = firstNonEmpty([
    ...inputValues("deliveryRef"),
    ...inputValues("requestId"),
    ...inputValues("orderId"),
    ...inputValues("orderNo"),
    ...inputValues("outTradeNo"),
    ...inputValues("tradeNo"),
    ...inputValues("delivery_ref"),
    ...inputValues("request_id"),
    ...inputValues("order_id"),
    ...inputValues("order_no"),
    ...inputValues("out_trade_no"),
    ...inputValues("trade_no"),
    request.headers.get("idempotency-key"),
    request.headers.get("x-request-id"),
    request.headers.get("x-order-id"),
    request.headers.get("x-delivery-ref"),
    request.headers.get("x-out-trade-no"),
  ]);

  return {
    poolCode: firstNonEmpty([
      ...inputValues("poolCode"),
      ...inputValues("pool"),
      ...inputValues("type"),
      ...inputValues("productType"),
      ...inputValues("sku"),
      ...inputValues("pool_code"),
      ...inputValues("productCode"),
      ...inputValues("product_code"),
      ...inputValues("product_type"),
      ...inputValues("goodsCode"),
      ...inputValues("goods_code"),
    ]),
    count: Number(
      firstNonEmpty([
        ...inputValues("order_quantity").map((value) =>
          value == null ? "" : String(value),
        ),
        ...inputValues("count").map((value) =>
          value == null ? "" : String(value),
        ),
        ...inputValues("quantity").map((value) =>
          value == null ? "" : String(value),
        ),
        ...inputValues("qty").map((value) =>
          value == null ? "" : String(value),
        ),
        ...inputValues("num").map((value) =>
          value == null ? "" : String(value),
        ),
        ...inputValues("amount").map((value) =>
          value == null ? "" : String(value),
        ),
        "1",
      ]),
    ),
    warrantyHours: Number(
      firstNonEmpty([
        ...inputValues("warrantyHours").map((value) =>
          value == null ? "" : String(value),
        ),
        ...inputValues("warranty_hours").map((value) =>
          value == null ? "" : String(value),
        ),
        ...inputValues("warranty").map((value) =>
          value == null ? "" : String(value),
        ),
        "168",
      ]),
    ),
    deliveryRef,
    responseMode: firstNonEmpty([
      ...inputValues("responseMode"),
      ...inputValues("response_mode"),
      ...inputValues("format"),
      request.headers.get("x-response-mode"),
      request.headers.get("x-response-format"),
    ]).toLowerCase(),
  };
}

function getQueryInput(request: Request): SupplyRequestInput {
  const url = new URL(request.url);

  return {
    poolCode: url.searchParams.get("poolCode") ?? undefined,
    pool: url.searchParams.get("pool") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    productType: url.searchParams.get("productType") ?? undefined,
    sku: url.searchParams.get("sku") ?? undefined,
    pool_code: url.searchParams.get("pool_code") ?? undefined,
    productCode: url.searchParams.get("productCode") ?? undefined,
    product_code: url.searchParams.get("product_code") ?? undefined,
    product_type: url.searchParams.get("product_type") ?? undefined,
    goodsCode: url.searchParams.get("goodsCode") ?? undefined,
    goods_code: url.searchParams.get("goods_code") ?? undefined,
    count: url.searchParams.get("count") ?? undefined,
    quantity: url.searchParams.get("quantity") ?? undefined,
    qty: url.searchParams.get("qty") ?? undefined,
    num: url.searchParams.get("num") ?? undefined,
    amount: url.searchParams.get("amount") ?? undefined,
    order_quantity: url.searchParams.get("order_quantity") ?? undefined,
    warrantyHours: url.searchParams.get("warrantyHours") ?? undefined,
    warranty_hours: url.searchParams.get("warranty_hours") ?? undefined,
    warranty: url.searchParams.get("warranty") ?? undefined,
    deliveryRef: url.searchParams.get("deliveryRef") ?? undefined,
    requestId: url.searchParams.get("requestId") ?? undefined,
    orderId: url.searchParams.get("orderId") ?? undefined,
    orderNo: url.searchParams.get("orderNo") ?? undefined,
    outTradeNo: url.searchParams.get("outTradeNo") ?? undefined,
    tradeNo: url.searchParams.get("tradeNo") ?? undefined,
    delivery_ref: url.searchParams.get("delivery_ref") ?? undefined,
    request_id: url.searchParams.get("request_id") ?? undefined,
    order_id: url.searchParams.get("order_id") ?? undefined,
    order_no: url.searchParams.get("order_no") ?? undefined,
    out_trade_no: url.searchParams.get("out_trade_no") ?? undefined,
    trade_no: url.searchParams.get("trade_no") ?? undefined,
    order_amount: url.searchParams.get("order_amount") ?? undefined,
    responseMode: url.searchParams.get("responseMode") ?? undefined,
    response_mode: url.searchParams.get("response_mode") ?? undefined,
    format: url.searchParams.get("format") ?? undefined,
  };
}

function formDataToInput(formData: FormData): SupplyRequestInput {
  return {
    poolCode: formData.get("poolCode")?.toString(),
    pool: formData.get("pool")?.toString(),
    type: formData.get("type")?.toString(),
    productType: formData.get("productType")?.toString(),
    sku: formData.get("sku")?.toString(),
    pool_code: formData.get("pool_code")?.toString(),
    productCode: formData.get("productCode")?.toString(),
    product_code: formData.get("product_code")?.toString(),
    product_type: formData.get("product_type")?.toString(),
    goodsCode: formData.get("goodsCode")?.toString(),
    goods_code: formData.get("goods_code")?.toString(),
    count: formData.get("count")?.toString(),
    quantity: formData.get("quantity")?.toString(),
    qty: formData.get("qty")?.toString(),
    num: formData.get("num")?.toString(),
    amount: formData.get("amount")?.toString(),
    order_quantity: formData.get("order_quantity")?.toString(),
    warrantyHours: formData.get("warrantyHours")?.toString(),
    warranty_hours: formData.get("warranty_hours")?.toString(),
    warranty: formData.get("warranty")?.toString(),
    deliveryRef: formData.get("deliveryRef")?.toString(),
    requestId: formData.get("requestId")?.toString(),
    orderId: formData.get("orderId")?.toString(),
    orderNo: formData.get("orderNo")?.toString(),
    outTradeNo: formData.get("outTradeNo")?.toString(),
    tradeNo: formData.get("tradeNo")?.toString(),
    delivery_ref: formData.get("delivery_ref")?.toString(),
    request_id: formData.get("request_id")?.toString(),
    order_id: formData.get("order_id")?.toString(),
    order_no: formData.get("order_no")?.toString(),
    out_trade_no: formData.get("out_trade_no")?.toString(),
    trade_no: formData.get("trade_no")?.toString(),
    order_amount: formData.get("order_amount")?.toString(),
    responseMode: formData.get("responseMode")?.toString(),
    response_mode: formData.get("response_mode")?.toString(),
    format: formData.get("format")?.toString(),
  };
}

async function readSupplyInput(request: Request) {
  if (request.method === "GET") {
    return getQueryInput(request);
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    return readJsonBody<SupplyRequestInput>(request);
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await readFormData(request);
    return formDataToInput(formData);
  }

  const rawText = await request.text();
  const trimmed = rawText.trim();

  if (!trimmed) {
    return {};
  }

  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed) as SupplyRequestInput;
    } catch {
      throw new AppError("请求内容不是合法 JSON。");
    }
  }

  const formData = new URLSearchParams(trimmed);
  return formDataToInput(formData as unknown as FormData);
}

function buildSuccessBody(payload: Awaited<ReturnType<typeof issueCardsForExternal>>) {
  const cards = payload.cards.map((card) => ({
    id: card.id,
    code: card.code_plain,
    poolCode: card.pool_code,
    deliveryRef: card.delivery_ref,
    deliveredAt: card.delivered_at,
    aftersaleLimit: card.aftersale_limit,
    warrantyHours: card.warranty_hours,
    accountQuantity: card.account_quantity,
  }));
  const codes = cards
    .map((card) => card.code)
    .filter((code): code is string => typeof code === "string" && code.length > 0);
  
  const accountQuantity = payload.accountQuantity ?? 1;
  
  // Build message with account quantity info
  let message: string;
  if (payload.reused) {
    message = accountQuantity > 1
      ? `已返回发货单 ${payload.deliveryRef} 的既有卡密（包含 ${accountQuantity} 个账号）`
      : `已返回发货单 ${payload.deliveryRef} 的既有卡密`;
  } else {
    message = accountQuantity > 1
      ? `已分配 1 张卡密（包含 ${accountQuantity} 个账号）`
      : `已分配 ${codes.length} 张卡密`;
  }
  
  const cardCode = codes[0] ?? null;
  
  // Build simple content for DELIVERY_CONTENT
  const content = `${message}

您的卡密：${cardCode}`;

  return {
    success: true,
    code: 0,
    message,
    data: {
      poolCode: payload.poolCode,
      deliveryRef: payload.deliveryRef,
      reused: payload.reused,
      accountQuantity,
      cardCode,
      codes,
      content,
      cards,
    },
  };
}

function buildSuccessResponse(
  payload: Awaited<ReturnType<typeof issueCardsForExternal>>,
  responseMode?: string,
) {
  const body = buildSuccessBody(payload);

  if (responseMode === "text" || responseMode === "plain") {
    return new NextResponse(body.data.content, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }

  // Default: return rich content as data for xianyu compatibility
  // xianyu will extract 'data' field as DELIVERY_CONTENT
  return NextResponse.json({
    success: body.success,
    code: body.code,
    message: body.message,
    data: body.data.content,  // Rich formatted content with card info
  });
}

function toSupplyErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        status: "error",
        code: error.status,
        errcode: error.status,
        message: error.message,
        msg: error.message,
        error: error.message,
        data: null,
      },
      { status: error.status },
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      success: false,
      status: "error",
      code: 500,
      errcode: 500,
      message: "服务暂时不可用，请稍后再试。",
      msg: "服务暂时不可用，请稍后再试。",
      error: "服务暂时不可用，请稍后再试。",
      data: null,
    },
    { status: 500 },
  );
}

async function handleSupplyRequest(request: Request) {
  await ensureSupplyApiAuthorized(request);

  const bodyInput = await readSupplyInput(request);
  const queryInput = getQueryInput(request);
  const normalizedInput = normalizeSupplyInput([bodyInput, queryInput], request);
  
  // Extract order_amount
  const orderAmount = bodyInput.order_amount || queryInput.order_amount;
  
  const payload = await issueCardsForExternal({
    ...normalizedInput,
    orderAmount: orderAmount ? Number(orderAmount) : undefined,
  });

  return buildSuccessResponse(payload, normalizedInput.responseMode);
}

export async function GET(request: Request) {
  try {
    return await handleSupplyRequest(request);
  } catch (error) {
    return toSupplyErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    return await handleSupplyRequest(request);
  } catch (error) {
    return toSupplyErrorResponse(error);
  }
}
