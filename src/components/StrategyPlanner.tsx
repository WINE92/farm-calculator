'use client'

import { strategyPlans } from '@/lib/strategy'

export default function StrategyPlanner() {
  return (
    <div className="rounded-3xl border border-purple-500/20 bg-slate-900/70 p-6 md:p-8">
      <div className="mb-6">
        <div className="mb-1 text-sm text-slate-400">双倍周自动规划</div>
        <div className="text-2xl md:text-3xl font-black text-purple-400">智能种植路线</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategyPlans.map((plan) => (
          <div
            key={plan.title}
            className="rounded-2xl bg-slate-950 p-4 flex flex-col"
          >
            <div className="mb-1 text-xl font-black">{plan.title}</div>
            <div className="mb-4 text-xs text-slate-400">{plan.description}</div>
            <div className="space-y-2">
              {plan.schedule.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-xl bg-slate-900 p-2 text-sm"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500 text-xs font-black">
                    {index + 1}
                  </div>
                  <div className="leading-tight">{item}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}