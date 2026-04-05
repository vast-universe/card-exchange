import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { AppError } from "@/lib/utils";

const DEV_DEFAULTS = {
  ADMIN_PASSWORD: "change-me-admin",
  SESSION_SECRET: "dev-session-secret",
  CARD_HASH_SECRET: "dev-card-hash-secret",
  SUPPLY_API_TOKEN: "change-me-supply-token",
  TURNSTILE_SECRET_KEY: "",
} as const;

type SecretKey =
  | "ADMIN_PASSWORD"
  | "SESSION_SECRET"
  | "CARD_HASH_SECRET"
  | "SUPPLY_API_TOKEN"
  | "TURNSTILE_SECRET_KEY";

export async function getTurnstileSiteKey() {
  if (!(await isTurnstileEnabled())) {
    return "";
  }

  const env = await getRuntimeEnv();

  return (
    env.TURNSTILE_SITE_KEY ??
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
    process.env.TURNSTILE_SITE_KEY ??
    "1x00000000000000000000AA"
  );
}

export async function isTurnstileEnabled() {
  const env = await getRuntimeEnv();
  const rawValue = env.TURNSTILE_ENABLED ?? process.env.TURNSTILE_ENABLED;

  if (typeof rawValue !== "string") {
    return true;
  }

  const normalized = rawValue.trim().toLowerCase();
  return !(
    normalized === "0" ||
    normalized === "false" ||
    normalized === "off" ||
    normalized === "no"
  );
}

export async function getRuntimeEnv(): Promise<Partial<CloudflareEnv>> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env as Partial<CloudflareEnv>;
  } catch {
    return process.env as unknown as Partial<CloudflareEnv>;
  }
}

export async function getDb() {
  const env = await getRuntimeEnv();

  if (!env.DB) {
    throw new AppError(
      "D1 绑定 DB 未配置，请先在 wrangler.jsonc 里填好数据库信息。",
      500,
    );
  }

  return env.DB;
}

export async function getSecret(name: SecretKey) {
  const env = await getRuntimeEnv();
  const value = env[name] ?? process.env[name];

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEV_DEFAULTS[name];
  }

  throw new AppError(`${name} 未配置`, 500);
}
