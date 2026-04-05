"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { adminApiPath, adminPath } from "@/lib/admin-paths";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await fetch(adminApiPath("/login"), {
        method: "DELETE",
      });
      router.push(adminPath("/login"));
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="rounded-full border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "退出中..." : "退出登录"}
    </button>
  );
}
