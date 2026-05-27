'use client'

import { useMemo, useState } from 'react'
import LiveTimer from './LiveTimer'
import WeekendStatus from './WeekendStatus'
import BestRecommend from './BestRecommend'
import StrategyPlanner from './StrategyPlanner'
import CustomSelect from './CustomSelect'
import CustomRange from './CustomRange'
import { farmRules } from '@/lib/farmRules'
import {
  calculateExtremeTime,
  calculateHelperReduce,
  calculateProfit,
  calculateTwoWaterTime,
  formatMinutes,
  getRuleByKey,
  calculateExpectedRemainingTime,
  calculateLatestWaterTime,
  formatTimeFromMinutes,
} from '@/lib/farmCalculator'

const cropPrices = [
  { id: 'yanxia', name: '炎霞辣椒', price: 50 },
  { id: 'canjin', name: '灿金云棉', price: 60 },
  { id: 'yezi', name: '曳紫云棉', price: 80 },
  { id: 'xuri', name: '旭日辣椒', price: 96.95 },
]

export default function CropCalculator() {
  const [selectedRuleKey, setSelectedRuleKey] = useState('20h')
  const [helperCount, setHelperCount] = useState(4)
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours())
  const [currentMinute, setCurrentMinute] = useState(() => new Date().getMinutes())
  const [cropRemainingHours, setCropRemainingHours] = useState(7)
  const [cropRemainingMins, setCropRemainingMins] = useState(15)
  const [nextWaterMinutes, setNextWaterMinutes] = useState(65)

  const [selectedCropId, setSelectedCropId] = useState('xuri')
  const [amount, setAmount] = useState(1920)
  const [stallLevel, setStallLevel] = useState(40)
  const [merchantMultiplier, setMerchantMultiplier] = useState(2)
  const [baijiaBonus, setBaijiaBonus] = useState(true)
  const [proficiencyLevel, setProficiencyLevel] = useState(10)

  const ruleOptions = farmRules.map(rule => ({ value: rule.key, label: rule.name }))
  const cropOptions = cropPrices.map(crop => ({ value: crop.id, label: crop.name }))

  const currentRule = useMemo(() => getRuleByKey(selectedRuleKey)!, [selectedRuleKey])
  const selectedCrop = useMemo(() => cropPrices.find(c => c.id === selectedCropId)!, [selectedCropId])

  const currentTimeMinutes = currentHour * 60 + currentMinute
  const cropTotalRemainingMinutes = cropRemainingHours * 60 + cropRemainingMins

  const expectedRemainingBase = useMemo(() => calculateExpectedRemainingTime({
    cropTotalRemainingMinutes,
    nextWaterMinutes,
    singleWaterReduce: currentRule.minReduce,
    minInterval: currentRule.minInterval,
  }), [cropTotalRemainingMinutes, nextWaterMinutes, currentRule])

  const helperReduce = calculateHelperReduce(currentRule, helperCount)
  const finalRemaining = useMemo(() => Math.max(0, expectedRemainingBase - helperReduce), [expectedRemainingBase, helperReduce])
  const expectedMatureAbsolute = currentTimeMinutes + finalRemaining
  const latestWaterAbsolute = calculateLatestWaterTime({
    currentTimeMinutes,
    cropTotalRemainingMinutes,
    nextWaterMinutes,
    maxInterval: currentRule.maxInterval,
    minInterval: currentRule.minInterval,
  })

  const extremeMatureTime = calculateExtremeTime(currentRule.totalMinutes)
  const twoWaterMatureTime = calculateTwoWaterTime(currentRule.totalMinutes)

  const profit = calculateProfit({
    basePrice: selectedCrop.price,
    amount,
    stallLevel,
    merchantMultiplier,
    baijiaBonus,
    proficiencyLevel,
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* 左侧浇水计算 */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="mb-5 text-2xl font-black">浇水时间计算</h2>
          <div className="space-y-4">
            {/* 第一行：作物类型、下次浇水、他人浇水 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-sm text-slate-400 mb-1">作物类型</div>
                <CustomSelect value={selectedRuleKey} onChange={setSelectedRuleKey} options={ruleOptions} className="w-full" />
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">下次浇水(分)</div>
                <input type="number" value={nextWaterMinutes} onChange={(e) => setNextWaterMinutes(Math.max(0, Number(e.target.value)))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" />
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">他人浇水次数</div>
                <input type="number" value={helperCount} onChange={(e) => setHelperCount(Math.max(0, Number(e.target.value)))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" />
              </div>
            </div>

            {/* 第二行：当前时间（标签+按钮+输入框）与作物剩余（标签+输入框）等宽两列 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 左侧：当前时间区域 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-400">当前时间</span>
                  <button
                    onClick={() => {
                      const now = new Date()
                      setCurrentHour(now.getHours())
                      setCurrentMinute(now.getMinutes())
                    }}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-500 transition"
                  >
                    现在时间
                  </button>
                </div>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={currentHour}
                    onChange={(e) => setCurrentHour(Math.min(23, Math.max(0, Number(e.target.value))))}
                    className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center"
                    placeholder="时"
                  />
                  <span className="self-center text-slate-500">:</span>
                  <input
                    type="number"
                    value={currentMinute}
                    onChange={(e) => setCurrentMinute(Math.min(59, Math.max(0, Number(e.target.value))))}
                    className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center"
                    placeholder="分"
                  />
                </div>
              </div>

              {/* 右侧：作物剩余区域 */}
              <div>
                <div className="text-sm text-slate-400 mb-1">作物剩余</div>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={cropRemainingHours}
                    onChange={(e) => setCropRemainingHours(Math.max(0, Number(e.target.value)))}
                    className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center"
                    placeholder="时"
                  />
                  <span className="self-center text-slate-500">:</span>
                  <input
                    type="number"
                    value={cropRemainingMins}
                    onChange={(e) => setCropRemainingMins(Math.min(59, Math.max(0, Number(e.target.value))))}
                    className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center"
                    placeholder="分"
                  />
                </div>
              </div>
            </div>

            {/* 以下结果展示保持不变 */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="rounded-xl bg-slate-950 p-3">
                <div className="text-xs text-slate-400">预计剩余(含他人浇水)</div>
                <div className="text-lg font-black text-emerald-400">{formatMinutes(finalRemaining)}</div>
              </div>
              <div className="rounded-xl bg-slate-950 p-3">
                <div className="text-xs text-slate-400">预计成熟时间</div>
                <div className="text-lg font-black text-blue-400">{formatTimeFromMinutes(expectedMatureAbsolute)}</div>
              </div>
            </div>

            {latestWaterAbsolute !== null && (
              <div className="rounded-xl bg-slate-950 p-3">
                <div className="text-xs text-slate-400">下次最晚浇水时间</div>
                <div className="text-lg font-black text-purple-400">{formatTimeFromMinutes(latestWaterAbsolute)}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-950 p-3">
                <div className="text-xs text-slate-400">极限成熟(浇水拉满)</div>
                <div className="text-lg font-black text-emerald-400">{formatMinutes(extremeMatureTime)}</div>
              </div>
              <div className="rounded-xl bg-slate-950 p-3">
                <div className="text-xs text-slate-400">只浇两次水</div>
                <div className="text-lg font-black text-blue-400">{formatMinutes(twoWaterMatureTime)}</div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-3">
              <div className="text-xs text-slate-400">他人浇水总减时</div>
              <div className="text-lg font-black text-blue-400">{helperReduce.toFixed(1)} 分钟</div>
            </div>
          </div>
        </div>

        {/* 右侧商人收益保持不变 */}
        <div id="profit" className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="mb-5 text-2xl font-black">商人收益计算</h2>
          <div className="space-y-4">
            <CustomSelect value={selectedCropId} onChange={setSelectedCropId} options={cropOptions} className="w-full" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-slate-400">菜摊等级</label>
                <input type="number" value={stallLevel} onChange={(e) => setStallLevel(Number(e.target.value))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">收购倍率</label>
                <input type="number" step="0.1" value={merchantMultiplier} onChange={(e) => setMerchantMultiplier(Number(e.target.value))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">数量</label>
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">百家满级加成</span>
              <input type="checkbox" checked={baijiaBonus} onChange={e => setBaijiaBonus(e.target.checked)} />
            </div>
            <CustomRange min={1} max={10} step={1} value={proficiencyLevel} onChange={setProficiencyLevel} label="熟练度等级（1-10级）" unit="级" className="mt-1" />
            <div className="rounded-xl bg-slate-950 p-3">
              <div className="text-xs text-slate-400">商人最终收益</div>
              <div className="text-lg font-black text-yellow-400">{Math.floor(profit).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h2 className="mb-4 text-xl font-black">当前作物规则</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-950 p-3"><div className="text-xs text-slate-400">最小浇水间隔</div><div className="text-lg font-black">{currentRule.minInterval} 分钟</div></div>
          <div className="rounded-xl bg-slate-950 p-3"><div className="text-xs text-slate-400">最大浇水间隔</div><div className="text-lg font-black">{currentRule.maxInterval} 分钟</div></div>
          <div className="rounded-xl bg-slate-950 p-3"><div className="text-xs text-slate-400">单次浇水最少减时</div><div className="text-lg font-black">{currentRule.minReduce} 分钟</div></div>
          <div className="rounded-xl bg-slate-950 p-3"><div className="text-xs text-slate-400">他人浇水上限减时</div><div className="text-lg font-black">{currentRule.helperMaxReduce} 分钟</div></div>
        </div>
      </div>

      <LiveTimer remainingMinutes={finalRemaining} />
      <WeekendStatus />
      <div id="recommend"><BestRecommend /></div>
      <div id="strategy"><StrategyPlanner /></div>
    </div>
  )
}