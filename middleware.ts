import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ADMIN_API_BASE,
  ADMIN_BASE,
  INTERNAL_ADMIN_API_PATH,
  INTERNAL_ADMIN_PATH,
  adminPath,
} from "@/lib/admin-paths";

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function notFoundResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return new NextResponse("Not Found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    matchesPrefix(pathname, INTERNAL_ADMIN_PATH) ||
    matchesPrefix(pathname, INTERNAL_ADMIN_API_PATH)
  ) {
    return notFoundResponse(request);
  }

  if (pathname === ADMIN_BASE) {
    return NextResponse.redirect(new URL(adminPath("/login"), request.url));
  }

  if (pathname === ADMIN_API_BASE) {
    return notFoundResponse(request);
  }

  if (matchesPrefix(pathname, ADMIN_BASE)) {
    const url = request.nextUrl.clone();
    const suffix = pathname.slice(ADMIN_BASE.length);
    url.pathname = `${INTERNAL_ADMIN_PATH}${suffix || ""}`;
    return NextResponse.rewrite(url);
  }

  if (matchesPrefix(pathname, ADMIN_API_BASE)) {
    const url = request.nextUrl.clone();
    const suffix = pathname.slice(ADMIN_API_BASE.length);
    url.pathname = `${INTERNAL_ADMIN_API_PATH}${suffix || ""}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
