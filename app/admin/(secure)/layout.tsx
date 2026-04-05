import Link from "next/link";

import { LogoutButton } from "@/components/admin/logout-button";
import { adminPath } from "@/lib/admin-paths";
import { requireAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminSecureLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1380px] px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-stone-200 bg-white/85 px-4 py-3 shadow-[0_20px_42px_-36px_rgba(41,37,36,0.45)]">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.22em] text-amber-700">
            运营后台
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-heading)] text-2xl text-stone-950">
            Card Exchange
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <nav className="flex flex-wrap items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50/90 p-1 shadow-sm">
            <Link
              href={adminPath("/dashboard")}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:bg-white hover:text-stone-950"
            >
              仪表盘
            </Link>
            <Link
              href={adminPath("/accounts")}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:bg-white hover:text-stone-950"
            >
              账号管理
            </Link>
            <Link
              href={adminPath("/cards")}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:bg-white hover:text-stone-950"
            >
              卡密管理
            </Link>
          </nav>
          <LogoutButton />
        </div>
      </header>

      <div className="py-5">{children}</div>
    </div>
  );
}
