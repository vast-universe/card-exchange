import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { adminPath } from "@/lib/admin-paths";
import { hasAdminSession } from "@/lib/auth";
import { getTurnstileSiteKey } from "@/lib/env";

// 登录页面需要检查 session，使用短时间缓存
export const revalidate = 5;

export default async function AdminLoginPage() {
  if (await hasAdminSession()) {
    redirect(adminPath("/dashboard"));
  }

  const siteKey = await getTurnstileSiteKey();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
      <div className="w-full rounded-[2rem] border border-stone-200 bg-[rgba(255,253,250,0.94)] p-8 shadow-[0_30px_80px_-50px_rgba(41,37,36,0.42)]">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-stone-500">
            Admin
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl text-stone-950">
            后台登录
          </h1>
          <p className="text-sm leading-6 text-stone-600">
            后台只用于你自己管理账号池、卡密和售后状态。
          </p>
        </div>

        <div className="mt-8">
          <LoginForm siteKey={siteKey} />
        </div>
      </div>
    </main>
  );
}
