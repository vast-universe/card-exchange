"use client";

import Link from "next/link";

type PaginationProps = {
  basePath?: string;
  page: number;
  pageSize: number;
  total: number;
  query?: Record<string, string | undefined>;
  onPageChange?: (page: number) => void;
};

export function Pagination({
  basePath,
  page,
  pageSize,
  total,
  query = {},
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  function createHref(nextPage: number) {
    if (!basePath) return "#";
    
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value) {
        params.set(key, value);
      }
    }

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }

    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  }

  function handlePageChange(nextPage: number, e: React.MouseEvent) {
    if (onPageChange) {
      e.preventDefault();
      onPageChange(nextPage);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-stone-600">
        第 {page} / {totalPages} 页，共 {total} 条
      </p>

      <div className="flex items-center gap-2">
        {onPageChange ? (
          <>
            <button
              type="button"
              onClick={(e) => page > 1 && handlePageChange(page - 1, e)}
              disabled={page <= 1}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                page <= 1
                  ? "cursor-not-allowed border-stone-200 text-stone-400"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:text-stone-950"
              }`}
            >
              上一页
            </button>
            <button
              type="button"
              onClick={(e) => page < totalPages && handlePageChange(page + 1, e)}
              disabled={page >= totalPages}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                page >= totalPages
                  ? "cursor-not-allowed border-stone-200 text-stone-400"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:text-stone-950"
              }`}
            >
              下一页
            </button>
          </>
        ) : (
          <>
            <Link
              href={createHref(page - 1)}
              onClick={(e) => page > 1 && handlePageChange(page - 1, e)}
              aria-disabled={page <= 1}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                page <= 1
                  ? "pointer-events-none border-stone-200 text-stone-400"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:text-stone-950"
              }`}
            >
              上一页
            </Link>
            <Link
              href={createHref(page + 1)}
              onClick={(e) => page < totalPages && handlePageChange(page + 1, e)}
              aria-disabled={page >= totalPages}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                page >= totalPages
                  ? "pointer-events-none border-stone-200 text-stone-400"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:text-stone-950"
              }`}
            >
              下一页
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
