'use client'

import { strategyPlans } from '@/lib/strategy'

export default function StrategyPlanner() {
  return (
    <div className="rounded-3xl border border-purple-500/20 bg-slate-900/70 p-8">
      <div className="mb-8">
        <div className="mb-3 text-slate-400">
          双倍周自动规划
        </div>

        <div className="text-5xl font-black text-purple-400">
          智能种植路线
        </div>
      </div>

      <div className="space-y-8">
        {strategyPlans.map((plan) => (
          <div
            key={plan.title}
            className="rounded-3xl bg-slate-950 p-6"
          >
            <div className="mb-2 text-2xl font-black">
              {plan.title}
            </div>

            <div className="mb-6 text-slate-400">
              {plan.description}
            </div>

            <div className="space-y-3">
              {plan.schedule.map(
                (item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 rounded-2xl bg-slate-900 p-4"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 font-black">
                      {index + 1}
                    </div>

                    <div>{item}</div>
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}