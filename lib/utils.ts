import { NextResponse } from "next/server";

export class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export function nowIso() {
  return new Date().toISOString();
}

export function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export function getRequestIp(request: Request) {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;

  return null;
}

export function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export function clampInt(
  value: number,
  min: number,
  max: number,
  fallback: number,
) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function escapeSqlLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function getSingleSearchParam(
  value: string | string[] | undefined,
  fallback = "",
) {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AppError("请求内容不是合法 JSON。");
  }
}

export async function readFormData(request: Request) {
  try {
    return await request.formData();
  } catch {
    throw new AppError("表单内容格式不正确。");
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json(
    { error: "服务暂时不可用，请稍后再试。" },
    { status: 500 },
  );
}
