"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

type SideDrawerProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
};

export function SideDrawer({
  open,
  title,
  description,
  onClose,
  children,
  widthClassName = "max-w-3xl",
}: SideDrawerProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 transition ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="关闭抽屉"
        onClick={onClose}
        className={`absolute inset-0 bg-stone-950/30 transition ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute right-0 top-0 h-full w-full ${widthClassName} transform overflow-hidden border-l border-stone-200 bg-stone-50 shadow-[-24px_0_80px_-44px_rgba(28,25,23,0.48)] transition duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-stone-200 bg-white px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl text-stone-950">
                  {title}
                </h2>
                {description ? (
                  <p className="text-sm leading-6 text-stone-600">
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                关闭
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        </div>
      </aside>
    </div>
  );
}
