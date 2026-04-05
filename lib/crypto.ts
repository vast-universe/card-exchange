import "server-only";

import { getSecret } from "@/lib/env";

const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

async function hmacHex(secret: string, value: string) {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(value),
  );

  return bytesToHex(new Uint8Array(signature));
}

export function createRandomToken(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(
    bytes,
    (byte) => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length],
  ).join("");
}

function normalizeCardPrefix(prefix: string) {
  const normalized = prefix
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);

  return normalized || "CARD";
}

export function createCardCode(prefix = "CARD") {
  const raw = createRandomToken(16);
  const normalizedPrefix = normalizeCardPrefix(prefix);
  return `${normalizedPrefix}-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12)}`;
}

export function createQueryToken() {
  return `QTK-${createRandomToken(20)}`;
}

export async function hashCardCode(value: string) {
  return hmacHex(await getSecret("CARD_HASH_SECRET"), value.trim());
}

export async function signSessionPayload(value: string) {
  return hmacHex(await getSecret("SESSION_SECRET"), value);
}

export async function createAdminSessionToken() {
  const expiresAt = String(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const nonce = createRandomToken(12);
  const payload = `${expiresAt}.${nonce}`;
  const signature = await signSessionPayload(payload);
  return `${payload}.${signature}`;
}

export async function verifyAdminSessionToken(token: string | null | undefined) {
  if (!token) return false;

  const [expiresAt, nonce, signature] = token.split(".");
  if (!expiresAt || !nonce || !signature) return false;
  if (Number(expiresAt) < Date.now()) return false;

  const expected = await signSessionPayload(`${expiresAt}.${nonce}`);
  return expected === signature;
}
