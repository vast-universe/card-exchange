import "server-only";

import { unstable_cache } from "next/cache";

import { getDashboardStats } from "@/lib/dashboard";
import { listAccountTypes } from "@/lib/account-types";

/**
 * 缓存仪表板统计数据
 * 30 秒缓存，减少数据库查询压力
 */
export const getCachedDashboardStats = unstable_cache(
  async () => {
    return getDashboardStats();
  },
  ["dashboard-stats"],
  {
    revalidate: 30,
    tags: ["dashboard", "stats"],
  },
);

/**
 * 缓存账号类型列表
 * 5 分钟缓存，账号类型变化不频繁
 */
export const getCachedAccountTypes = unstable_cache(
  async () => {
    return listAccountTypes();
  },
  ["account-types"],
  {
    revalidate: 300,
    tags: ["account-types"],
  },
);

/**
 * 通用缓存包装器
 * 用于缓存任意异步函数的结果
 */
export function createCachedFunction<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  options: {
    revalidate?: number;
    tags?: string[];
  } = {},
) {
  return unstable_cache(fn, keyParts, {
    revalidate: options.revalidate ?? 60,
    tags: options.tags ?? [],
  });
}
