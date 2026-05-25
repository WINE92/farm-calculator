'use client'

import { useMemo } from 'react'

import { recommendBestCrop } from '@/lib/recommend'

import { isWeekendDouble } from '@/lib/weekend'

export default function BestRecommend() {
  const weekend = isWeekendDouble()

  const results = useMemo(() => {
    return recommendBestCrop({
      weekend,

      helperCount: 4,
    })
  }, [weekend])

  const best = results[0]

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-8">
      <div className="mb-3 text-slate-400">
        当前推荐方案
      </div>

      <div className="mb-6 text-5xl font-black text-emerald-400">
        {best.name}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl bg-slate-950 p-5">
          <div className="mb-2 text-slate-400">
            每小时收益
          </div>

          <div className="text-2xl font-black">
            {Math.floor(
              best.profitPerHour,
            ).toLocaleString()}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950 p-5">
          <div className="mb-2 text-slate-400">
            推荐成熟时间
          </div>

          <div className="text-2xl font-black">
            {Math.floor(
              best.growMinutes / 60,
            )}
            小时
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950 p-5">
          <div className="mb-2 text-slate-400">
            当前状态
          </div>

          <div className="text-2xl font-black text-orange-400">
            {weekend
              ? '双倍周'
              : '普通时间'}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 text-xl font-bold">
          收益排行
        </div>

        <div className="space-y-3">
          {results.map((item: any, index: number) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl bg-slate-950 p-4">
                {/* ... */}
              <div className="flex items-center gap-4">
                <div className="text-2xl font-black text-emerald-400">
                  #{index + 1}
                </div>

                <div>
                  <div className="font-bold">
                    {item.name}
                  </div>

                  <div className="text-sm text-slate-400">
                    {Math.floor(
                      item.growMinutes / 60,
                    )}
                    小时成熟
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-black text-yellow-400">
                  {Math.floor(
                    item.profitPerHour,
                  ).toLocaleString()}
                </div>

                <div className="text-sm text-slate-400">
                  每小时收益
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}