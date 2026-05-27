'use client'

import { useMemo, useState, useEffect } from 'react'
import LiveTimer from './LiveTimer'
import WeekendStatus from './WeekendStatus'
import StrategyPlanner from './StrategyPlanner'
import CustomSelect from './CustomSelect'
import CustomRange from './CustomRange'
import { farmRules } from '@/lib/farmRules'
import {
  calculateProfit,
  calculateTwoWaterTime,
  getRuleByKey,
} from '@/lib/farmCalculator'

const cropPrices = [
  { id: 'yanxia', name: '炎霞辣椒', price: 50 },
  { id: 'canjin', name: '灿金云棉', price: 60 },
  { id: 'yezi', name: '曳紫云棉', price: 80 },
  { id: 'xuri', name: '旭日辣椒', price: 96.95 },
]

// 辅助：格式化时长（X小时Y分钟）
function formatDurationShort(hours: number): string {
  const totalMin = Math.round(hours * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}小时${m}分钟`
}

// 绝对时间格式化（基于当前时间 + 偏移分钟，精确到分）
function formatAbsoluteTime(offsetMinutes: number, currentHour: number, currentMinute: number): string {
  let totalMinutes = currentHour * 60 + currentMinute + Math.round(offsetMinutes)
  let dayOffset = 0
  while (totalMinutes >= 1440) {
    totalMinutes -= 1440
    dayOffset++
  }
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  const prefix = dayOffset === 0 ? '今天' : dayOffset === 1 ? '明天' : `${dayOffset}天后`
  return `${prefix} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// 模拟算法（支持是否包含首次浇水）
interface WaterEvent {
  type: 'friend' | 'water' | 'harvest'
  timeOffsetMinutes: number
  reductionMinutes?: number
  remainingMinutes?: number
  waitMinutes?: number
  friendCount?: number
}

function simulateFromCurrentState(
  totalMaturityMinutes: number,
  remainingMinutes: number,
  nextWaterRemainingMinutes: number,
  waitMinutes: number,
  friendCount: number,
  includeFirstWater: boolean
): {
  schedule: WaterEvent[]
  harvestTimeOffsetMinutes: number
  totalWaterings: number
} {
  const minWait = totalMaturityMinutes * 0.06
  const maxWait = totalMaturityMinutes * 0.24
  const effectiveWait = Math.min(Math.max(waitMinutes, minWait), maxWait)
  const maxReduction = totalMaturityMinutes * 0.07
  const reductionPerWait = (w: number) => Math.min(w * (7 / 24), maxReduction)

  let remaining = remainingMinutes
  let currentTime = 0
  const schedule: WaterEvent[] = []

  // 好友浇水减时（一次性）
  const friendTotal = Math.min(friendCount, 4) * totalMaturityMinutes * 0.025
  if (friendTotal > 0) {
    remaining = Math.max(0, remaining - friendTotal)
    schedule.push({ type: 'friend', timeOffsetMinutes: 0, reductionMinutes: friendTotal, remainingMinutes: remaining, friendCount: Math.min(friendCount, 4) })
  }

  if (includeFirstWater) {
    schedule.push({ type: 'water', timeOffsetMinutes: 0, reductionMinutes: maxReduction, remainingMinutes: remaining, waitMinutes: 0 })
  }

  let firstWait = nextWaterRemainingMinutes > 0 ? nextWaterRemainingMinutes : effectiveWait
  firstWait = Math.min(firstWait, remaining)

  if (firstWait > 0) {
    currentTime += firstWait
    remaining -= firstWait
  }

  if (remaining > 0) {
    const reduction = reductionPerWait(effectiveWait)
    remaining = Math.max(0, remaining - reduction)
    schedule.push({ type: 'water', timeOffsetMinutes: currentTime, reductionMinutes: reduction, remainingMinutes: remaining, waitMinutes: firstWait })
  }

  let wateringCount = schedule.filter(e => e.type === 'water').length

  while (remaining > 0.001) {
    const sp = effectiveWait + reductionPerWait(effectiveWait)
    let w: number
    if (remaining <= minWait) {
      w = remaining
    } else if (remaining <= sp) {
      let opt = (24 / 31) * remaining
      if (opt * (7 / 24) > maxReduction) opt = remaining - maxReduction
      w = Math.min(Math.max(opt, minWait), effectiveWait)
    } else {
      w = effectiveWait
    }
    const naturalPass = Math.min(w, remaining)
    currentTime += naturalPass
    remaining -= naturalPass
    if (remaining <= 0.001) {
      schedule.push({ type: 'harvest', timeOffsetMinutes: currentTime, remainingMinutes: 0 })
      break
    }
    const reduce = reductionPerWait(w)
    remaining -= reduce
    wateringCount++
    schedule.push({ type: 'water', timeOffsetMinutes: currentTime, reductionMinutes: reduce, remainingMinutes: Math.max(0, remaining), waitMinutes: w })
    if (remaining <= 0.001) {
      schedule.push({ type: 'harvest', timeOffsetMinutes: currentTime, remainingMinutes: 0 })
      break
    }
  }

  const harvestTimeOffsetMinutes = schedule.find(e => e.type === 'harvest')?.timeOffsetMinutes ?? currentTime
  return { schedule, harvestTimeOffsetMinutes, totalWaterings: wateringCount }
}

// 等待选项配置（增加两个预设）
const waitOptions = [
  { value: 'min', label: '最短等待 (6%)' },
  { value: 'best', label: '最佳等待 (24%)' },
  { value: 'manual', label: '手动设置' },
  { value: 'extreme', label: '极限浇水（不浪费浇水时间）' },
  { value: 'twice', label: '只浇两次（种下和收获前各浇水一次）' },
]

export default function CropCalculator() {
  const [selectedRuleKey, setSelectedRuleKey] = useState('20h')
  const [helperCount, setHelperCount] = useState(4)
  const [nextWaterMinutes, setNextWaterMinutes] = useState(65)
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours())
  const [currentMinute, setCurrentMinute] = useState(() => new Date().getMinutes())
  const [cropRemainingHours, setCropRemainingHours] = useState(7)
  const [cropRemainingMins, setCropRemainingMins] = useState(15)

  const [waitMode, setWaitMode] = useState<'min' | 'best' | 'manual' | 'extreme' | 'twice'>('best')
  const [manualWaitPercent, setManualWaitPercent] = useState(15)

  const [includeFirstWater, setIncludeFirstWater] = useState(true)

  const [selectedCropId, setSelectedCropId] = useState('xuri')
  const [amount, setAmount] = useState(1920)
  const [stallLevel, setStallLevel] = useState(40)
  const [merchantMultiplier, setMerchantMultiplier] = useState(2)
  const [baijiaBonus, setBaijiaBonus] = useState(true)
  const [proficiencyLevel, setProficiencyLevel] = useState(10)

  const currentRule = useMemo(() => getRuleByKey(selectedRuleKey)!, [selectedRuleKey])
  const totalMaturityMinutes = currentRule.totalMinutes

  // 未包含首次浇水时，剩余时间上限为总时间的93%
  const maxRemainingMinutes = useMemo(() => {
    return includeFirstWater ? totalMaturityMinutes : totalMaturityMinutes * 0.93
  }, [includeFirstWater, totalMaturityMinutes])

  const maxRemainingHours = Math.floor(maxRemainingMinutes / 60)

  // 当 includeFirstWater 变化时，调整剩余时间
  useEffect(() => {
    const currentTotal = cropRemainingHours * 60 + cropRemainingMins
    if (currentTotal > maxRemainingMinutes) {
      const newHours = Math.floor(maxRemainingMinutes / 60)
      const newMins = Math.round(maxRemainingMinutes % 60)
      setCropRemainingHours(newHours)
      setCropRemainingMins(newMins)
    }
  }, [includeFirstWater, maxRemainingMinutes])

  const remainingMinutes = Math.min(cropRemainingHours * 60 + cropRemainingMins, maxRemainingMinutes)
  const maxNextWaterMinutes = totalMaturityMinutes * 0.06

  // 处理等待模式选择（预设动作）
  const handleWaitModeChange = (val: string) => {
    if (val === 'extreme') {
      setWaitMode('best')
      setHelperCount(4)
      alert('已启用“极限浇水”预设：等待时间设为最佳等待(24%)，协助浇水次数设为4。')
    } else if (val === 'twice') {
      alert('“只浇两次”策略的成熟时间请参考右侧“只浇两次水”卡片。如需精确模拟，请手动设置等待百分比和浇水次数。')
    } else {
      setWaitMode(val as any)
    }
  }

  const userWaitMinutes = useMemo(() => {
    let percent = 0.24
    if (waitMode === 'min') percent = 0.06
    else if (waitMode === 'manual') percent = Math.min(Math.max(manualWaitPercent, 6), 24) / 100
    else if (waitMode === 'best') percent = 0.24
    else percent = 0.24
    return totalMaturityMinutes * percent
  }, [waitMode, manualWaitPercent, totalMaturityMinutes])

  const simulation = useMemo(() => {
    if (!remainingMinutes || remainingMinutes <= 0) return null
    return simulateFromCurrentState(
      totalMaturityMinutes,
      remainingMinutes,
      nextWaterMinutes,
      userWaitMinutes,
      helperCount,
      includeFirstWater
    )
  }, [totalMaturityMinutes, remainingMinutes, nextWaterMinutes, userWaitMinutes, helperCount, includeFirstWater])

  const extremeMatureHours = useMemo(() => {
    const extreme = simulateFromCurrentState(totalMaturityMinutes, totalMaturityMinutes, 0, totalMaturityMinutes * 0.24, 4, true)
    return extreme.harvestTimeOffsetMinutes / 60
  }, [totalMaturityMinutes])
  const twoWaterHours = calculateTwoWaterTime(currentRule.totalMinutes) / 60

  const savedHours = simulation ? (remainingMinutes / 60 - simulation.harvestTimeOffsetMinutes / 60) : 0

  const profit = calculateProfit({
    basePrice: cropPrices.find(c => c.id === selectedCropId)!.price,
    amount,
    stallLevel,
    merchantMultiplier,
    baijiaBonus,
    proficiencyLevel,
  })

  const ruleOptions = farmRules.map(rule => ({ value: rule.key, label: rule.name }))
  const cropOptions = cropPrices.map(crop => ({ value: crop.id, label: crop.name }))

  const renderSchedule = () => {
    if (!simulation) return null
    return (
      <div className="mt-4">
        <h4 className="text-md font-bold text-slate-200 mb-2">📋 浇水日程表（时间轴）</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-slate-400 border-b border-slate-700">
              <tr>
                <th className="text-left py-1">时间</th>
                <th className="text-left py-1">事件</th>
                <th className="text-left py-1">等待时长</th>
                <th className="text-left py-1">减少时长</th>
                <th className="text-left py-1">剩余时长</th>
              </tr>
            </thead>
            <tbody>
              {simulation.schedule.map((ev, idx) => {
                const absTime = formatAbsoluteTime(ev.timeOffsetMinutes, currentHour, currentMinute)
                let eventStr = ''
                let waitStr = ev.waitMinutes !== undefined ? formatDurationShort(ev.waitMinutes / 60) : '-'
                let reduceStr = ev.reductionMinutes !== undefined ? formatDurationShort(ev.reductionMinutes / 60) : '-'
                let remainStr = ev.remainingMinutes !== undefined ? formatDurationShort(ev.remainingMinutes / 60) : '-'
                if (ev.type === 'friend') eventStr = `💖 好友浇水 ×${ev.friendCount}`
                else if (ev.type === 'water') eventStr = ev.waitMinutes === 0 ? '🚀 种植浇水 (首次)' : '💧 浇水'
                else if (ev.type === 'harvest') eventStr = '🍀 收获'
                return (
                  <tr key={idx} className="border-b border-slate-800">
                    <td className="py-1">{absTime}</td>
                    <td className="py-1">{eventStr}</td>
                    <td className="py-1">{waitStr}</td>
                    <td className="py-1">{reduceStr}</td>
                    <td className="py-1">{remainStr}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // 输入处理函数
  const handleRemainingHoursChange = (val: number) => {
    if (isNaN(val)) val = 0
    val = Math.max(0, Math.min(val, maxRemainingHours))
    let total = val * 60 + cropRemainingMins
    if (total > maxRemainingMinutes) {
      const newMins = Math.max(0, maxRemainingMinutes - val * 60)
      setCropRemainingMins(newMins)
      setCropRemainingHours(val)
    } else {
      setCropRemainingHours(val)
    }
  }

  const handleRemainingMinsChange = (val: number) => {
    if (isNaN(val)) val = 0
    val = Math.min(59, Math.max(0, val))
    let total = cropRemainingHours * 60 + val
    if (total > maxRemainingMinutes) {
      const newHours = Math.floor(maxRemainingMinutes / 60)
      const newMins = maxRemainingMinutes % 60
      setCropRemainingHours(newHours)
      setCropRemainingMins(newMins)
    } else {
      setCropRemainingMins(val)
    }
  }

  const handleNextWaterChange = (val: number) => {
    if (isNaN(val)) val = 0
    val = Math.min(maxNextWaterMinutes, Math.max(0, val))
    setNextWaterMinutes(val)
  }

  const handleHelperCountChange = (val: number) => {
    if (isNaN(val)) val = 0
    val = Math.min(4, Math.max(0, val))
    setHelperCount(val)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* 左侧浇水计算 */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="mb-5 text-4xl font-black">浇水时间计算</h2>
          <h2 className="text-1xl font-black">基础信息</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-sm text-slate-400 mb-1">作物类型(基础成熟时间)</div>
                <CustomSelect value={selectedRuleKey} onChange={setSelectedRuleKey} options={ruleOptions} className="w-full" />
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">下次浇水需要时间(分)</div>
                <input type="number" value={nextWaterMinutes} onChange={(e) => handleNextWaterChange(Number(e.target.value))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" />
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">协助浇水次数</div>
                <input type="number" value={helperCount} onChange={(e) => handleHelperCountChange(Number(e.target.value))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-slate-400 mb-1">当前时间(时/分)</div>
                <div className="flex items-center gap-1">
                  <input type="number" value={currentHour} onChange={(e) => setCurrentHour(Math.min(23, Math.max(0, Number(e.target.value))))} className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center" placeholder="时" />
                  <span className="text-slate-500">:</span>
                  <input type="number" value={currentMinute} onChange={(e) => setCurrentMinute(Math.min(59, Math.max(0, Number(e.target.value))))} className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center" placeholder="分" />
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">成熟剩余时间(时/分)</div>
                <div className="flex gap-1">
                  <input type="number" value={cropRemainingHours} onChange={(e) => handleRemainingHoursChange(Number(e.target.value))} className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center" placeholder="时" />
                  <span className="self-center text-slate-500">:</span>
                  <input type="number" value={cropRemainingMins} onChange={(e) => handleRemainingMinsChange(Number(e.target.value))} className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center" placeholder="分" />
                </div>
              </div>
            </div>

            {/* 按钮行 */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => { const now = new Date(); setCurrentHour(now.getHours()); setCurrentMinute(now.getMinutes()); }}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-center text-white whitespace-nowrap hover:bg-emerald-500 transition font-medium"
              >
                获取当前时间
              </button>
              <button
                onClick={() => setIncludeFirstWater(!includeFirstWater)}
                className={`rounded-lg px-4 py-1.5 text-center whitespace-nowrap transition font-medium ${
                  includeFirstWater
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                }`}
              >
                包含首次浇水
              </button>
            </div>

            {/* 等待时间选择 */}
            <div>
              <h2 className="text-1xl font-black">每次等待时间(浇水计划)</h2>
              <div className="text-sm text-slate-400 mb-1"> • 等待时间越接近24% 浇水次数越少 • 推荐等待24% 浇水次数最少。</div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <CustomSelect
                    value={waitMode}
                    onChange={handleWaitModeChange}
                    options={waitOptions}
                    className="w-full"
                  />
                </div>
                {waitMode === 'manual' && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="1"
                      min="6"
                      max="24"
                      value={manualWaitPercent}
                      onChange={(e) => setManualWaitPercent(Math.min(24, Math.max(6, Number(e.target.value))))}
                      className="w-20 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                )}
              </div>
            </div>

            {/* 结果展示 */}
            {simulation && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-950 p-3">
                    <div className="text-xs text-slate-400">收获时间（绝对）</div>
                    <div className="text-lg font-bold text-emerald-400">{formatAbsoluteTime(simulation.harvestTimeOffsetMinutes, currentHour, currentMinute)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-950 p-3">
                    <div className="text-xs text-slate-400">累积节省时间</div>
                    <div className="text-lg font-black text-blue-400">{formatDurationShort(savedHours)} ({((savedHours / (remainingMinutes / 60)) * 100).toFixed(2)}%)</div>
                  </div>
                  <div className="rounded-xl bg-slate-950 p-3">
                    <div className="text-xs text-slate-400">浇水每次等待</div>
                    <div className="text-lg font-black text-purple-400">{formatDurationShort(userWaitMinutes / 60)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-950 p-3">
                    <div className="text-xs text-slate-400">需要浇水次数</div>
                    <div className="text-lg font-black text-yellow-400">{simulation.totalWaterings} 次</div>
                  </div>
                </div>
                {renderSchedule()}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <LiveTimer remainingMinutes={simulation ? simulation.harvestTimeOffsetMinutes : 0} />
                  <WeekendStatus />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧商人收益 */}
        <div id="profit" className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="mb-5 text-4xl font-black">商人收益计算</h2>
          <div className="space-y-4">
            <CustomSelect value={selectedCropId} onChange={setSelectedCropId} options={cropOptions} className="w-full" />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-sm text-slate-400">菜摊等级</label><input type="number" value={stallLevel} onChange={(e) => setStallLevel(Math.min(100, Math.max(1, Number(e.target.value))))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" /></div>
              <div><label className="mb-1 block text-sm text-slate-400">收购倍率</label><input type="number" step="0.1" value={merchantMultiplier} onChange={(e) => setMerchantMultiplier(Math.max(0, Number(e.target.value)))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" /></div>
            </div>
            <div><label className="mb-1 block text-sm text-slate-400">数量</label><input type="number" value={amount} onChange={(e) => setAmount(Math.min(999999, Math.max(0, Number(e.target.value))))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" /></div>
            <div className="flex items-center justify-between"><span className="text-sm">百家满级加成</span><input type="checkbox" checked={baijiaBonus} onChange={e => setBaijiaBonus(e.target.checked)} /></div>
            <CustomRange min={1} max={10} step={1} value={proficiencyLevel} onChange={setProficiencyLevel} label="熟练度等级（1-10级）" unit="级" className="mt-1" />
            <div className="rounded-xl bg-slate-950 p-3"><div className="text-xs text-slate-400">商人最终收益</div><div className="text-lg font-black text-yellow-400">{Math.floor(profit).toLocaleString()}</div></div>
          </div>
        </div>
      </div>

      {/* 参考卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-center"><div className="text-xs text-slate-400">最快极限成熟（浇水拉满）</div><div className="text-lg font-black text-emerald-400">{formatDurationShort(extremeMatureHours)}</div></div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-center"><div className="text-xs text-slate-400">只浇两次水(开始/结束各一次)</div><div className="text-lg font-black text-blue-400">{formatDurationShort(twoWaterHours)}</div></div>
      </div>

      {/* 作物规则 */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h2 className="mb-4 text-xl font-black">当前作物规则</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-950 p-3"><div className="text-xs text-slate-400">最小浇水间隔</div><div className="text-lg font-black">{currentRule.minInterval} 分钟</div></div>
          <div className="rounded-xl bg-slate-950 p-3"><div className="text-xs text-slate-400">最大浇水间隔</div><div className="text-lg font-black">{currentRule.maxInterval} 分钟</div></div>
          <div className="rounded-xl bg-slate-950 p-3"><div className="text-xs text-slate-400">单次浇水最少减时</div><div className="text-lg font-black">{currentRule.minReduce} 分钟</div></div>
          <div className="rounded-xl bg-slate-950 p-3"><div className="text-xs text-slate-400">他人浇水上限减时</div><div className="text-lg font-black">{currentRule.helperMaxReduce} 分钟</div></div>
        </div>
      </div>
    </div>
  )
}