import CropCalculator from '@/components/CropCalculator'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0b1020]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-3xl font-black text-emerald-400">
              王者荣耀世界
            </div>

            <div className="text-sm text-slate-400">
              种植收益计算器 / 便捷平台
            </div>
          </div>

          <nav className="hidden gap-8 text-slate-300 xl:flex">
            <a
              href="#calculator"
              className="transition hover:text-white"
            >
              计算器
            </a>

            <a
              href="#recommend"
              className="transition hover:text-white"
            >
              智能推荐
            </a>

            <a
              href="#strategy"
              className="transition hover:text-white"
            >
              双倍周攻略
            </a>

            <a
              href="#profit"
              className="transition hover:text-white"
            >
              商人收益
            </a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_40%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-28">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              实时计算 · 双倍周种植规划 · 商人收益
            </div>

            <h1 className="mb-8 text-6xl font-black leading-tight">
              王者荣耀世界
              <br />
              <p className="max-w-3xl text-xl leading-tight text-slate-400">
              居所种植时间收益便捷查询工具
              </p>
            </h1>

            <p className="max-w-3xl text-xl leading-9 text-slate-400">
              实时计算浇水时间、双倍周路线、居所浇水收益细则
              <br />
              商人售价、最佳种植方案
              <br /> 
              Always free to use by WINE
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-4">
                <div className="text-sm text-slate-400">
                  实时计算
                </div>

                <div className="text-2xl font-black">
                  秒级刷新
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-4">
                <div className="text-sm text-slate-400">
                  智能推荐
                </div>

                <div className="text-2xl font-black">
                  自动路线
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-4">
                <div className="text-sm text-slate-400">
                  平台状态
                </div>

                <div className="text-2xl font-black text-emerald-400">
                  Online
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="calculator"
        className="mx-auto max-w-7xl px-6 py-16"
      >
        <CropCalculator />
      </section>

      <footer className="border-t border-slate-800 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-slate-500 xl:flex-row">
          <div>
            © 2026 王者荣耀世界种植工具站
          </div>

          <div className="flex gap-6">
            <div>实时计算系统</div>

            <div>双倍周规划</div>

            <div>收益模拟器</div>
          </div>
        </div>
      </footer>
    </main>
  )
}