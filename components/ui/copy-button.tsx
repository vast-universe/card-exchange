"use client";

import { useState } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
  variant?: "default" | "ghost";
  size?: "sm" | "xs";
};

export function CopyButton({
  value,
  label = "复制",
  className = "",
  variant = "default",
  size = "sm",
}: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function handleClick() {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("clipboard unavailable");
      }

      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }

    window.setTimeout(() => setStatus("idle"), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-full transition ${
        variant === "ghost"
          ? "border border-transparent bg-transparent text-stone-500 hover:text-stone-950"
          : "border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:text-stone-950"
      } ${
        size === "xs"
          ? "px-2.5 py-1 text-xs font-semibold"
          : "px-3 py-1.5 text-sm font-medium"
      } ${className}`}
    >
      {status === "copied" ? "已复制" : status === "failed" ? "复制失败" : label}
    </button>
  );
}
