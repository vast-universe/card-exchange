import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { adminPath } from "@/lib/admin-paths";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "@/lib/crypto";
import { getSecret } from "@/lib/env";

const COOKIE_NAME = "card_admin_session";

export async function validateAdminPassword(password: string) {
  const expected = await getSecret("ADMIN_PASSWORD");
  return password === expected;
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

export async function requireAdminSession() {
  if (!(await hasAdminSession())) {
    redirect(adminPath("/login"));
  }
}

export async function withAdminSession(response: NextResponse) {
  const token = await createAdminSessionToken();

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
