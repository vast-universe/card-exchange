import { NextResponse } from "next/server";

import { getDashboardStats } from "@/lib/dashboard";
import { hasAdminSession } from "@/lib/auth";

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  return NextResponse.json(await getDashboardStats());
}
