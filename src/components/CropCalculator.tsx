'use client'

import { useMemo, useState } from 'react'
import LiveTimer from './LiveTimer'
import WeekendStatus from './WeekendStatus'
import BestRecommend from './BestRecommend'
import StrategyPlanner from './StrategyPlanner'
import CustomSelect from './CustomSelect'
import { farmRules } from '@/lib/farmRules'
import {
  calculateExtremeTime,
  calculateHelperReduce,
  calculateProfit,
  calculateRemainingTime,
  calculateTwoWaterTime,
  formatMinutes,
  getRuleByKey,
} from '@/lib/farmCalculator'
import CustomRange from './CustomRange'

// 高价值作物列表（只有名字，没有图标）
const cropPrices = [
  { id: 'yanxia', name: '炎霞辣椒', price: 100 },
  { id: 'canjin', name: '灿金云棉', price: 120 },
  { id: 'yezi', name: '曳紫云棉', price: 160 },
  { id: 'xuri', name: '旭日辣椒', price: 193.9 },
]

export default function CropCalculator() {
  // 浇水计算相关
  const [selectedRuleKey, setSelectedRuleKey] = useState('20h')
  const [helperCount, setHelperCount] = useState(4)
  const [remainingMinutes, setRemainingMinutes] = useState(1200)

  // 商人收益相关
  const [selectedCropId, setSelectedCropId] = useState('xuri')
  const [amount, setAmount] = useState(1920)
  const [stallLevel, setStallLevel] = useState(20)
  const [merchantMultiplier, setMerchantMultiplier] = useState(2)
  const [baijiaBonus, setBaijiaBonus] = useState(true)
  const [proficiencyLevel, setProficiencyLevel] = useState(1)   // 熟练度等级 1-10

  // 准备选项数组
  const ruleOptions = farmRules.map(rule => ({ value: rule.key, label: rule.name }))
  const cropOptions = cropPrices.map(crop => ({ value: crop.id, label: crop.name }))

  const currentRule = useMemo(() => getRuleByKey(selectedRuleKey)!, [selectedRuleKey])
  const selectedCrop = useMemo(() => cropPrices.find(c => c.id === selectedCropId)!, [selectedCropId])

  // 时间计算
  const extremeMatureTime = useMemo(() => calculateExtremeTime(currentRule.totalMinutes), [currentRule])
  const twoWaterMatureTime = useMemo(() => calculateTwoWaterTime(currentRule.totalMinutes), [currentRule])
  const helperReduce = useMemo(() => calculateHelperReduce(currentRule, helperCount), [currentRule, helperCount])
  const finalRemaining = useMemo(() => calculateRemainingTime(remainingMinutes, helperReduce), [remainingMinutes, helperReduce])

  // 收益计算
  const profit = useMemo(() => calculateProfit({
    basePrice: selectedCrop.price,
    amount,
    stallLevel,
    merchantMultiplier,
    baijiaBonus,
    proficiencyLevel,
  }), [selectedCrop, amount, stallLevel, merchantMultiplier, baijiaBonus, proficiencyLevel])

  return (
    <div className="space-y-8">
      {/* 浇水时间计算 + 商人收益计算 双栏布局 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* 左侧：浇水时间计算 */}
        <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-8">
          <h2 className="mb-8 text-3xl font-black">浇水时间计算</h2>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-slate-400">作物类型</label>
              <CustomSelect
                value={selectedRuleKey}
                onChange={setSelectedRuleKey}
                options={ruleOptions}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-2 block text-slate-400">当前剩余时间（分钟）</label>
              <input
                type="number"
                value={remainingMinutes}
                onChange={(e) => setRemainingMinutes(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4"
                title="可增减数值（支持键盘上下键）"
              />
            </div>
            <div>
              <label className="mb-2 block text-slate-400">他人浇水次数</label>
              <input
                type="number"
                value={helperCount}
                onChange={(e) => setHelperCount(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4"
                title="可增减数值（支持键盘上下键）"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-950 p-5">
                <div className="mb-2 text-slate-400">极限成熟（浇水拉满）</div>
                <div className="text-2xl font-black text-emerald-400">{formatMinutes(extremeMatureTime)}</div>
              </div>
              <div className="rounded-2xl bg-slate-950 p-5">
                <div className="mb-2 text-slate-400">只浇两次水</div>
                <div className="text-2xl font-black text-blue-400">{formatMinutes(twoWaterMatureTime)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：商人收益计算 */}
        <div id="profit" className="rounded-3xl border border-slate-700 bg-slate-900/70 p-8">
          <h2 className="mb-8 text-3xl font-black">商人收益计算</h2>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-slate-400">作物</label>
              <CustomSelect
                value={selectedCropId}
                onChange={setSelectedCropId}
                options={cropOptions}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-2 block text-slate-400">菜摊等级</label>
              <input
                type="number"
                value={stallLevel}
                onChange={(e) => setStallLevel(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4"
                title="可增减数值（支持键盘上下键）"
              />
            </div>
            <div>
              <label className="mb-2 block text-slate-400">收购倍率</label>
              <input
                type="number"
                step="0.1"
                value={merchantMultiplier}
                onChange={(e) => setMerchantMultiplier(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4"
                title="可增减数值（支持键盘上下键）"
              />
            </div>
            <div>
              <label className="mb-2 block text-slate-400">数量</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4"
                title="可增减数值（支持键盘上下键）"
              />
            </div>
            <div className="flex items-center justify-between">
              <span>百家满级加成</span>
              <input type="checkbox" checked={baijiaBonus} onChange={e => setBaijiaBonus(e.target.checked)} />
            </div>
            <CustomRange
             min={1}
             max={10}
             step={1}
             value={proficiencyLevel}
             onChange={setProficiencyLevel}
             label="熟练度等级（1-10级）"
             unit="级"
             className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* 三个核心指标卡片 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-8">
          <div className="mb-3 text-slate-400">当前预计剩余时间</div>
          <div className="text-5xl font-black text-emerald-400">{formatMinutes(finalRemaining)}</div>
        </div>
        <div className="rounded-3xl border border-blue-500/20 bg-slate-900/70 p-8">
          <div className="mb-3 text-slate-400">他人浇水总减时</div>
          <div className="text-5xl font-black text-blue-400">{helperReduce.toFixed(1)} 分钟</div>
        </div>
        <div className="rounded-3xl border border-yellow-500/20 bg-slate-900/70 p-8">
          <div className="mb-3 text-slate-400">商人最终收益</div>
          <div className="text-5xl font-black text-yellow-400">{Math.floor(profit).toLocaleString()}</div>
        </div>
      </div>

      {/* 作物规则详情 */}
      <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-8">
        <h2 className="mb-8 text-3xl font-black">当前作物规则</h2>
        <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-950 p-5">
            <div className="mb-2 text-slate-400">最小浇水间隔</div>
            <div className="text-2xl font-black">{currentRule.minInterval} 分钟</div>
          </div>
          <div className="rounded-2xl bg-slate-950 p-5">
            <div className="mb-2 text-slate-400">最大浇水间隔</div>
            <div className="text-2xl font-black">{currentRule.maxInterval} 分钟</div>
          </div>
          <div className="rounded-2xl bg-slate-950 p-5">
            <div className="mb-2 text-slate-400">一次浇水最少减时</div>
            <div className="text-2xl font-black">{currentRule.minReduce} 分钟</div>
          </div>
          <div className="rounded-2xl bg-slate-950 p-5">
            <div className="mb-2 text-slate-400">他人浇水上限减时</div>
            <div className="text-2xl font-black">{currentRule.helperMaxReduce} 分钟</div>
          </div>
        </div>
      </div>

      <LiveTimer remainingMinutes={finalRemaining} />
      <WeekendStatus />
      
      <div id="recommend">
        <BestRecommend />
      </div>
      
      <div id="strategy">
        <StrategyPlanner />
      </div>
    </div>
  )
}