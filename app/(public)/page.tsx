import { ExchangeCenter } from "@/components/public/exchange-center";
import { getTurnstileSiteKey } from "@/lib/env";

// 禁用缓存，确保实时数据
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicHomePage() {
  const siteKey = await getTurnstileSiteKey();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="space-y-4 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight text-stone-950 sm:text-5xl">
          卡密兑换与售后
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
          输入一次卡密即可直接兑换，或检测当前绑定账号状态并处理售后。
        </p>
      </section>

      <ExchangeCenter siteKey={siteKey} />
    </div>
  );
}
