"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/",
    label: "卡密兑换",
  },
  {
    href: "/support",
    label: "卡密售后",
  },
] as const;

export function PublicNav() {
  const pathname = usePathname();

  return (
    <nav className="inline-flex items-center gap-3 text-sm">
      {ITEMS.map((item, index) => {
        const isActive = pathname === item.href;

        return (
          <div key={item.href} className="flex items-center gap-3">
            <Link
              href={item.href}
              className={[
                "border-b pb-1 font-medium transition",
                isActive
                  ? "border-amber-600 text-stone-950"
                  : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-900",
              ].join(" ")}
            >
              {item.label}
            </Link>

            {index < ITEMS.length - 1 ? (
              <span className="text-stone-300">/</span>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
