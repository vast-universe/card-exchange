import { StatCard } from "@/components/admin/stat-card";
import { getDashboardStats } from "@/lib/dashboard";

// 管理后台使用短时间缓存，10 秒重新验证
export const revalidate = 10;

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="总账号数" value={stats.accounts.total} tone="accent" />
        <StatCard label="可发放账号" value={stats.accounts.available} />
        <StatCard label="使用中账号" value={stats.accounts.bound} />
        <StatCard label="待确认账号" value={stats.accounts.unknown} />
        <StatCard label="已停用库存" value={stats.accounts.disabled} />
        <StatCard label="封禁标记数" value={stats.accounts.banned} />
        <StatCard label="总卡密数" value={stats.cards.total} />
        <StatCard label="库存卡密" value={stats.cards.inventory} />
        <StatCard label="已发货待兑换" value={stats.cards.issued} />
        <StatCard label="已使用卡密" value={stats.cards.used} />
        <StatCard label="今日外发" value={stats.today.externalDeliveryCount} />
        <StatCard label="今日兑换" value={stats.today.redeemCount} />
        <StatCard label="今日换号" value={stats.today.replaceCount} />
      </section>

      <p className="text-xs leading-6 text-stone-500">
        异常指标用于辅助排查，部分数据会交叉统计，例如封禁账号也可能同时计入已停用库存；卡密中的“已发货待兑换”表示外部平台已取走卡密，但用户端还没有真正绑定账号。
      </p>

      <section className="rounded-[2rem] border border-stone-200 bg-white/80 p-6 shadow-[0_24px_70px_-50px_rgba(41,37,36,0.42)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-[0.18em] text-stone-500">
            库存视图
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl text-stone-950">
            按账号类型查看库存
          </h2>
          <p className="text-sm leading-6 text-stone-600">
            同时看库存状态和异常标记，方便判断哪些类型缺货、待确认或待售后处理；异常列之间可能存在重叠。
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-stone-500">
                <th className="px-4 py-2 font-semibold">账号类型</th>
                <th className="px-4 py-2 font-semibold">总数</th>
                <th className="px-4 py-2 font-semibold">可发放</th>
                <th className="px-4 py-2 font-semibold">使用中</th>
                <th className="px-4 py-2 font-semibold">待确认</th>
                <th className="px-4 py-2 font-semibold">已停用</th>
                <th className="px-4 py-2 font-semibold">封禁标记</th>
              </tr>
            </thead>
            <tbody>
              {stats.pools.length > 0 ? (
                stats.pools.map((pool) => (
                  <tr key={pool.poolCode} className="rounded-2xl bg-stone-50">
                    <td className="rounded-l-2xl px-4 py-3 font-medium text-stone-900">
                      {pool.poolCode}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{pool.total}</td>
                    <td className="px-4 py-3 text-stone-700">{pool.available}</td>
                    <td className="px-4 py-3 text-stone-700">{pool.bound}</td>
                    <td className="px-4 py-3 text-stone-700">{pool.unknown}</td>
                    <td className="px-4 py-3 text-stone-700">{pool.disabled}</td>
                    <td className="rounded-r-2xl px-4 py-3 text-stone-700">
                      {pool.banned}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-500">
                    还没有账号数据，先去账号管理里导入一批。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
