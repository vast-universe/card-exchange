/**
 * 使用说明组件 - 服务端组件
 * 纯静态内容，可以被 Next.js 优化和缓存
 */
export function ExchangeInstructions() {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/72 p-5 text-sm leading-7 text-stone-600 shadow-[0_20px_60px_-45px_rgba(41,37,36,0.45)] sm:p-6">
      <p className="font-semibold text-stone-900">使用说明</p>
      <div className="mt-3 space-y-1">
        <p>1. 新卡密提交后会直接返回当前账号原文。</p>
        <p>2. 已绑定账号的卡密提交后，会展示当前账号状态和剩余售后次数。</p>
        <p>3. 若账号异常且仍有次数，可在检测结果里直接换新账号。</p>
      </div>
    </section>
  );
}
