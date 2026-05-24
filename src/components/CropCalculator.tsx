'use client'

import { useMemo, useState } from 'react'
import LiveTimer from './LiveTimer'
import WeekendStatus from './WeekendStatus'
import BestRecommend from './BestRecommend'
import StrategyPlanner from './StrategyPlanner'

import { farmRules } from '@/lib/farmRules'

import {
  calculateExtremeTime,
  calculateHelperReduce,
  calculateProfit,
  calculateRemainingTime,
  calculateTwoWaterTime,
  formatMinutes,
} from '@/lib/farmCalculator'

const cropPrices = [
  {
    id: 'yanxia',
    name: '炎霞辣椒',
    price: 100,
    icon: '🌶️',
  },

  {
    id: 'canjin',
    name: '灿金云棉',
    price: 120,
    icon: '☁️',
  },

  {
    id: 'yezi',
    name: '曳紫云棉',
    price: 160,
    icon: '🪻',
  },

  {
    id: 'xuri',
    name: '旭日辣椒',
    price: 193.9,
    icon: '🔥',
  },
]

export default function CropCalculator() {
  const [selectedRule, setSelectedRule] =
    useState('20h')

  const [helperCount, setHelperCount] =
    useState(4)

  const [remainingMinutes, setRemainingMinutes] =
    useState(1200)

  const [selectedCrop, setSelectedCrop] =
    useState('xuri')

  const [amount, setAmount] = useState(1920)

  const [stallLevel, setStallLevel] =
    useState(20)

  const [merchantMultiplier, setMerchantMultiplier] =
    useState(2)

  const [baijiaBonus, setBaijiaBonus] =
    useState(true)

  const currentRule = useMemo(() => {
    return farmRules.find(
      (r) => r.id === selectedRule,
    )!
  }, [selectedRule])

  const selectedCropData = useMemo(() => {
    return cropPrices.find(
      (c) => c.id === selectedCrop,
    )!
  }, [selectedCrop])

  const extremeTime = useMemo(() => {
    return calculateExtremeTime(selectedRule)
  }, [selectedRule])

  const twoWaterTime = useMemo(() => {
    return calculateTwoWaterTime(selectedRule)
  }, [selectedRule])

  const remainingTime = useMemo(() => {
    return calculateRemainingTime(
      selectedRule,

      remainingMinutes,

      helperCount,
    )
  }, [
    selectedRule,

    remainingMinutes,

    helperCount,
  ])

  const helperReduce = useMemo(() => {
    return calculateHelperReduce(
      selectedRule,

      helperCount,
    )
  }, [selectedRule, helperCount])

  const profitData = useMemo(() => {
    return calculateProfit({
      basePrice: selectedCropData.price,

      amount,

      stallLevel,

      merchantMultiplier,

      baijiaBonus,
    })
  }, [
    selectedCropData,

    amount,

    stallLevel,

    merchantMultiplier,

    baijiaBonus,
  ])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-8">
          <h2 className="mb-8 text-3xl font-black">
            浇水时间计算
          </h2>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-slate-400">
                作物类型
              </label>

              <select
                value={selectedRule}
                onChange={(e) =>
                  setSelectedRule(e.target.value)
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4"
              >
                {farmRules.map((rule) => (
                  <option
                    key={rule.id}
                    value={rule.id}
                  >
                    {rule.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-slate-400">
                当前剩余时间（分钟）
              </label>

              <input
                type="number"
                value={remainingMinutes}
                onChange={(e) =>
                  setRemainingMinutes(
                    Number(e.target.value),
                  )
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4"
              />
            </div>

            <div>
              <label className="mb-2 block text-slate-400">
                他人浇水次数
              </label>

              <input
                type="number"
                value={helperCount}
                onChange={(e) =>
                  setHelperCount(
                    Number(e.target.value),
                  )
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-950 p-5">
                <div className="mb-2 text-slate-400">
                  极限成熟
                </div>

                <div className="text-2xl font-black text-emerald-400">
                  {formatMinutes(extremeTime)}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950 p-5">
                <div className="mb-2 text-slate-400">
                  双浇水成熟
                </div>

                <div className="text-2xl font-black text-blue-400">
                  {formatMinutes(twoWaterTime)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-8">
          <h2 className="mb-8 text-3xl font-black">
            商人收益计算
          </h2>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-slate-400">
                作物
              </label>

              <select
                value={selectedCrop}
                onChange={(e) =>
                  setSelectedCrop(e.target.value)
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4"
              >
                {cropPrices.map((crop) => (
                  <option
                    key={crop.id}
                    value={crop.id}
                  >
                    {crop.icon} {crop.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-slate-400">
                菜摊等级
              </label>

              <input
                type="number"
                value={stallLevel}
                onChange={(e) =>
                  setStallLevel(
                    Number(e.target.value),
                  )
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4"
              />
            </div>

            <div>
              <label className="mb-2 block text-slate-400">
                收购倍率
              </label>

              <input
                type="number"
                step="0.1"
                value={merchantMultiplier}
                onChange={(e) =>
                  setMerchantMultiplier(
                    Number(e.target.value),
                  )
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4"
              />
            </div>

            <div>
              <label className="mb-2 block text-slate-400">
                数量
              </label>

              <input
                type="number"
                value={amount}
                onChange={(e) =>
                  setAmount(Number(e.target.value))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <span>百家满级加成</span>

              <input
                type="checkbox"
                checked={baijiaBonus}
                onChange={(e) =>
                  setBaijiaBonus(
                    e.target.checked,
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-8">
          <div className="mb-3 text-slate-400">
            当前预计剩余时间
          </div>

          <div className="text-5xl font-black text-emerald-400">
            {formatMinutes(remainingTime)}
          </div>
        </div>

        <div className="rounded-3xl border border-blue-500/20 bg-slate-900/70 p-8">
          <div className="mb-3 text-slate-400">
            他人浇水总减时
          </div>

          <div className="text-5xl font-black text-blue-400">
            {helperReduce.toFixed(1)} 分钟
          </div>
        </div>

        <div className="rounded-3xl border border-yellow-500/20 bg-slate-900/70 p-8">
          <div className="mb-3 text-slate-400">
            商人最终收益
          </div>

          <div className="text-5xl font-black text-yellow-400">
            {Math.floor(
              profitData.final,
            ).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-8">
        <h2 className="mb-8 text-3xl font-black">
          当前作物规则
        </h2>

        <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-950 p-5">
            <div className="mb-2 text-slate-400">
              最小浇水间隔
            </div>

            <div className="text-2xl font-black">
              {currentRule.minWaterInterval}
              分钟
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-5">
            <div className="mb-2 text-slate-400">
              最大浇水间隔
            </div>

            <div className="text-2xl font-black">
              {currentRule.maxWaterInterval}
              分钟
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-5">
            <div className="mb-2 text-slate-400">
              最小减时
            </div>

            <div className="text-2xl font-black">
              {currentRule.minWaterReduce}
              分钟
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-5">
            <div className="mb-2 text-slate-400">
              最大减时
            </div>

            <div className="text-2xl font-black">
              {currentRule.maxWaterReduce}
              分钟
            </div>
          </div>
        </div>
      </div>
        <LiveTimer
         remainingMinutes={remainingTime}
      />

      <WeekendStatus />
        
      <BestRecommend />

      <StrategyPlanner />

    </div>
  )
}