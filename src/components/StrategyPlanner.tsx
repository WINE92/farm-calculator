'use client'

import { useMemo, useState, useEffect } from 'react'
import LiveTimer from './LiveTimer'
import CustomSelect from './CustomSelect'
import CustomRange from './CustomRange'
import { farmRules } from '@/lib/farmRules'
import {
  calculateProfit,
  getRuleByKey,
} from '@/lib/farmCalculator'

const cropPrices = [
  { id: 'yanxia', name: '炎霞辣椒', price: 50 },
  { id: 'canjin', name: '灿金云棉', price: 60 },
  { id: 'yezi', name: '曳紫云棉', price: 80 },
  { id: 'xuri', name: '旭日辣椒', price: 96.95 },
]

// ---------- 辅助函数 ----------
function formatDurationShort(hours: number): string {
  const totalMin = Math.round(hours * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}小时${m}分钟`
}

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

// ---------- 种植日程表（从零开始，含首次浇水）----------
interface PlantEvent {
  type: 'plant' | 'friend' | 'water' | 'harvest'
  timeOffsetHours: number
  reductionHours?: number
  remainingHours?: number
  waitHours?: number
  friendCount?: number
}

function simulatePlantSchedule(
  totalMaturityHours: number,
  waitHours: number,
  friendCount: number
) {
  const minWait = totalMaturityHours * 0.06
  const maxWait = totalMaturityHours * 0.24
  const effectiveWait = Math.min(Math.max(waitHours, minWait), maxWait)
  const maxReduction = totalMaturityHours * 0.07
  const reductionPerWait = (w: number) => Math.min(w * (7 / 24), maxReduction)

  let remaining = totalMaturityHours
  let currentTime = 0
  const events: PlantEvent[] = []

  events.push({ type: 'plant', timeOffsetHours: 0, remainingHours: remaining })

  const friendTotal = Math.min(friendCount, 4) * totalMaturityHours * 0.025
  if (friendTotal > 0) {
    remaining = Math.max(0, remaining - friendTotal)
    events.push({ type: 'friend', timeOffsetHours: 0, reductionHours: friendTotal, remainingHours: remaining, friendCount: Math.min(friendCount, 4) })
  }

  remaining = Math.max(0, remaining - maxReduction)
  events.push({ type: 'water', timeOffsetHours: 0, reductionHours: maxReduction, remainingHours: remaining, waitHours: 0 })

  let wateringCount = 1

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
      events.push({ type: 'harvest', timeOffsetHours: currentTime, remainingHours: 0 })
      break
    }
    const reduce = reductionPerWait(w)
    remaining -= reduce
    wateringCount++
    events.push({ type: 'water', timeOffsetHours: currentTime, reductionHours: reduce, remainingHours: Math.max(0, remaining), waitHours: w })
    if (remaining <= 0.001) {
      events.push({ type: 'harvest', timeOffsetHours: currentTime, remainingHours: 0 })
      break
    }
  }

  return { events, harvestTimeHours: events.find(e => e.type === 'harvest')?.timeOffsetHours ?? currentTime, totalWaterings: wateringCount }
}

// ---------- 实时浇水（当前状态，不含首次浇水）----------
interface RealEvent {
  type: 'friend' | 'water' | 'harvest'
  timeOffsetMinutes: number
  reductionMinutes?: number
  remainingMinutes?: number
  waitMinutes?: number
  friendCount?: number
}

function simulateRealTime(
  totalMaturityMinutes: number,
  remainingMinutes: number,
  nextWaterRemainingMinutes: number,
  waitMinutes: number,
  friendCount: number
) {
  const minWait = totalMaturityMinutes * 0.06
  const maxWait = totalMaturityMinutes * 0.24
  const effectiveWait = Math.min(Math.max(waitMinutes, minWait), maxWait)
  const maxReduction = totalMaturityMinutes * 0.07
  const reductionPerWait = (w: number) => Math.min(w * (7 / 24), maxReduction)

  let remaining = remainingMinutes
  let currentTime = 0
  const events: RealEvent[] = []

  const friendTotal = Math.min(friendCount, 4) * totalMaturityMinutes * 0.025
  if (friendTotal > 0) {
    remaining = Math.max(0, remaining - friendTotal)
    events.push({ type: 'friend', timeOffsetMinutes: 0, reductionMinutes: friendTotal, remainingMinutes: remaining, friendCount: Math.min(friendCount, 4) })
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
    events.push({ type: 'water', timeOffsetMinutes: currentTime, reductionMinutes: reduction, remainingMinutes: remaining, waitMinutes: firstWait })
  }

  let wateringCount = events.filter(e => e.type === 'water').length

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
      events.push({ type: 'harvest', timeOffsetMinutes: currentTime, remainingMinutes: 0 })
      break
    }
    const reduce = reductionPerWait(w)
    remaining -= reduce
    wateringCount++
    events.push({ type: 'water', timeOffsetMinutes: currentTime, reductionMinutes: reduce, remainingMinutes: Math.max(0, remaining), waitMinutes: w })
    if (remaining <= 0.001) {
      events.push({ type: 'harvest', timeOffsetMinutes: currentTime, remainingMinutes: 0 })
      break
    }
  }

  return { events, harvestTimeOffsetMinutes: events.find(e => e.type === 'harvest')?.timeOffsetMinutes ?? currentTime, totalWaterings: wateringCount }
}

const waitOptions = [
  { value: 'min', label: '最短等待 (6%)' },
  { value: 'best', label: '最佳等待 (24%)' },
  { value: 'manual', label: '手动设置' },
]

// ========== 紧凑型时间轴组件 ==========
function TimelineCardPlant({ event, index, totalEvents }: { event: PlantEvent; index: number; totalEvents: number }) {
  const isLast = index === totalEvents - 1
  let dotColor = "bg-emerald-500"
  let eventIcon = ""
  let eventLabel = ""
  let extraInfo = ""

  switch (event.type) {
    case 'plant':
      dotColor = "bg-emerald-400"
      eventIcon = "🌱"
      eventLabel = "种植"
      extraInfo = `初始 ${formatDurationShort(event.remainingHours!)}`
      break
    case 'friend':
      dotColor = "bg-purple-500"
      eventIcon = "👥"
      eventLabel = `好友浇水 ×${event.friendCount}`
      extraInfo = `-${formatDurationShort(event.reductionHours!)}`
      break
    case 'water':
      dotColor = "bg-blue-500"
      eventIcon = event.waitHours === 0 ? "🚀" : "💧"
      eventLabel = event.waitHours === 0 ? "首次浇水" : "浇水"
      extraInfo = `等待 ${formatDurationShort(event.waitHours!)} / 减少 ${formatDurationShort(event.reductionHours!)}`
      break
    case 'harvest':
      dotColor = "bg-yellow-500"
      eventIcon = "🍀"
      eventLabel = "收获"
      extraInfo = ""
      break
  }

  const timeStr = event.timeOffsetHours === 0 ? "开始" : formatDurationShort(event.timeOffsetHours)

  return (
    <div className="relative flex items-center gap-3 py-1.5 group">
      <div className="w-20 text-right text-xs font-mono text-slate-400 shrink-0">{timeStr}</div>
      <div className="relative flex flex-col items-center w-4 shrink-0">
        <div className={`relative z-10 w-2 h-2 rounded-full ${dotColor} ring-1 ring-slate-800`}></div>
        {!isLast && <div className="absolute top-2 bottom-0 w-px bg-slate-600"></div>}
      </div>
      <div className="flex-1 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-all duration-200 hover:scale-[1.01] p-2">
        <div className="flex items-center justify-between flex-wrap gap-x-2 text-xs">
          <div className="flex items-center flex-wrap gap-x-2">
            <span className="font-medium text-white">{eventIcon} {eventLabel}</span>
            {extraInfo && <span className="text-slate-300">{extraInfo}</span>}
          </div>
          {event.remainingHours !== undefined && event.type !== 'harvest' && (
            <span className="text-slate-400 ml-auto">剩余 {formatDurationShort(event.remainingHours)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function TimelineCardReal({ event, index, totalEvents, currentHour, currentMinute }: { event: RealEvent; index: number; totalEvents: number; currentHour: number; currentMinute: number }) {
  const isLast = index === totalEvents - 1
  let dotColor = "bg-blue-500"
  let eventIcon = ""
  let eventLabel = ""
  let extraInfo = ""
  const absoluteTime = formatAbsoluteTime(event.timeOffsetMinutes, currentHour, currentMinute)

  switch (event.type) {
    case 'friend':
      dotColor = "bg-purple-500"
      eventIcon = "👥"
      eventLabel = `好友浇水 ×${event.friendCount}`
      extraInfo = `-${formatDurationShort(event.reductionMinutes! / 60)}`
      break
    case 'water':
      dotColor = "bg-blue-500"
      eventIcon = "💧"
      eventLabel = "浇水"
      extraInfo = `等待 ${formatDurationShort(event.waitMinutes! / 60)} / 减少 ${formatDurationShort(event.reductionMinutes! / 60)}`
      break
    case 'harvest':
      dotColor = "bg-yellow-500"
      eventIcon = "🍀"
      eventLabel = "收获"
      extraInfo = ""
      break
  }

  return (
    <div className="relative flex items-center gap-3 py-1.5 group">
      <div className="w-24 text-right text-xs font-mono text-slate-400 shrink-0">{absoluteTime}</div>
      <div className="relative flex flex-col items-center w-4 shrink-0">
        <div className={`relative z-10 w-2 h-2 rounded-full ${dotColor} ring-1 ring-slate-800`}></div>
        {!isLast && <div className="absolute top-2 bottom-0 w-px bg-slate-600"></div>}
      </div>
      <div className="flex-1 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-all duration-200 hover:scale-[1.01] p-2">
        <div className="flex items-center justify-between flex-wrap gap-x-2 text-xs">
          <div className="flex items-center flex-wrap gap-x-2">
            <span className="font-medium text-white">{eventIcon} {eventLabel}</span>
            {extraInfo && <span className="text-slate-300">{extraInfo}</span>}
          </div>
          {event.remainingMinutes !== undefined && event.type !== 'harvest' && (
            <span className="text-slate-400 ml-auto">剩余 {formatDurationShort(event.remainingMinutes / 60)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ========== 主组件 ==========
export default function CropCalculator() {
  // 实时浇水（左侧）
  const [realCropKey, setRealCropKey] = useState('20h')
  const [realFriendCount, setRealFriendCount] = useState(4)
  const [realWaitMode, setRealWaitMode] = useState<'min' | 'best' | 'manual'>('best')
  const [realManualPercent, setRealManualPercent] = useState(15)
  const [nextWaterMinutes, setNextWaterMinutes] = useState(65)
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours())
  const [currentMinute, setCurrentMinute] = useState(() => new Date().getMinutes())
  const [remainingHours, setRemainingHours] = useState(7)
  const [remainingMins, setRemainingMins] = useState(15)

  // 种植日程表（右侧）
  const [plantCropKey, setPlantCropKey] = useState('20h')
  const [plantFriendCount, setPlantFriendCount] = useState(4)
  const [plantWaitMode, setPlantWaitMode] = useState<'min' | 'best' | 'manual'>('best')
  const [plantManualPercent, setPlantManualPercent] = useState(15)

  // 商人收益
  const [selectedCropId, setSelectedCropId] = useState('xuri')
  const [amount, setAmount] = useState(1920)
  const [stallLevel, setStallLevel] = useState(40)
  const [merchantMultiplier, setMerchantMultiplier] = useState(2)
  const [baijiaBonus, setBaijiaBonus] = useState(true)
  const [proficiencyLevel, setProficiencyLevel] = useState(10)

  // 实时计算
  const realRule = useMemo(() => getRuleByKey(realCropKey)!, [realCropKey])
  const totalMaturityMinutes = realRule.totalMinutes
  const remainingMinutes = remainingHours * 60 + remainingMins
  const maxRemainingMinutes = totalMaturityMinutes

  useEffect(() => {
    const currentTotal = remainingHours * 60 + remainingMins
    if (currentTotal > maxRemainingMinutes) {
      const newHours = Math.floor(maxRemainingMinutes / 60)
      const newMins = maxRemainingMinutes % 60
      setRemainingHours(newHours)
      setRemainingMins(newMins)
    }
  }, [realCropKey, remainingHours, remainingMins, maxRemainingMinutes])

  const realWaitMinutes = useMemo(() => {
    let percent = 0.24
    if (realWaitMode === 'min') percent = 0.06
    else if (realWaitMode === 'manual') percent = Math.min(Math.max(realManualPercent, 6), 24) / 100
    return totalMaturityMinutes * percent
  }, [realWaitMode, realManualPercent, totalMaturityMinutes])

  const realTimeSimulation = useMemo(() => {
    if (remainingMinutes <= 0) return null
    return simulateRealTime(totalMaturityMinutes, remainingMinutes, nextWaterMinutes, realWaitMinutes, realFriendCount)
  }, [totalMaturityMinutes, remainingMinutes, nextWaterMinutes, realWaitMinutes, realFriendCount])

  // 种植日程表
  const plantRule = useMemo(() => getRuleByKey(plantCropKey)!, [plantCropKey])
  const totalMaturityHours = plantRule.totalMinutes / 60
  const plantWaitHours = useMemo(() => {
    let percent = 0.24
    if (plantWaitMode === 'min') percent = 0.06
    else if (plantWaitMode === 'manual') percent = Math.min(Math.max(plantManualPercent, 6), 24) / 100
    return totalMaturityHours * percent
  }, [plantWaitMode, plantManualPercent, totalMaturityHours])
  const plantSchedule = useMemo(() => simulatePlantSchedule(totalMaturityHours, plantWaitHours, plantFriendCount), [totalMaturityHours, plantWaitHours, plantFriendCount])

  // 商人收益
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

  // 时间轴渲染函数（修改了最大高度）
  const renderPlantTimeline = () => (
    <div className="mt-4 max-h-full overflow-y-auto pr-2 custom-scrollbar">
      {plantSchedule.events.map((event, idx) => (
        <TimelineCardPlant key={idx} event={event} index={idx} totalEvents={plantSchedule.events.length} />
      ))}
    </div>
  )

  const renderRealTimeline = () => {
    if (!realTimeSimulation) return null
    return (
      <div className="mt-4 max-h-135px overflow-y-auto pr-2 custom-scrollbar">
        {realTimeSimulation.events.map((event, idx) => (
          <TimelineCardReal key={idx} event={event} index={idx} totalEvents={realTimeSimulation.events.length} currentHour={currentHour} currentMinute={currentMinute} />
        ))}
      </div>
    )
  }

  const handleNextWaterChange = (val: number) => {
    if (isNaN(val)) val = 0
    val = Math.min(totalMaturityMinutes * 0.06, Math.max(0, val))
    setNextWaterMinutes(val)
  }

  // 浇水收益表格数据（根据文档）
  const wateringRules = [
    { crop: '5小时作物', firstReduce: '21分', friendWater: '7分30秒', friendMax: '30分', waterInterval: '18分', maxInterval: '1时12分', minReduce: '5分15秒' },
    { crop: '16小时作物', firstReduce: '1时7分12秒', friendWater: '24分', friendMax: '1时36分', waterInterval: '57分36秒', maxInterval: '3时50分24秒', minReduce: '16分48秒' },
    { crop: '20小时作物', firstReduce: '1时24分', friendWater: '30分', friendMax: '2时', waterInterval: '1时12分', maxInterval: '4时48分', minReduce: '21分' },
    { crop: '28小时作物', firstReduce: '1时57分4秒', friendWater: '42分', friendMax: '2时48分', waterInterval: '1时40分48秒', maxInterval: '6时43分12秒', minReduce: '29分24秒' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* 左侧：实时浇水时间计算 */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="text-3xl font-black text-blue-400 mb-1">⏱️ 实时浇水时间计算</h2>
          <p className="text-xs text-slate-400 mb-4">基于当前作物状态（不含首次浇水）</p>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="w-[30%]">
                <label className="text-sm text-slate-400 mb-1 block">作物类型</label>
                <CustomSelect value={realCropKey} onChange={setRealCropKey} options={ruleOptions} className="w-full" />
              </div>
              <div className="w-[20%]">
                <label className="text-sm text-slate-400 mb-1 block">协助浇水次数</label>
                <input type="number" value={realFriendCount} onChange={(e) => setRealFriendCount(Math.min(4, Math.max(0, Number(e.target.value))))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" />
              </div>
              <div className="w-[50%]">
                <label className="text-sm text-slate-400 mb-1 block">每次等待时间</label>
                <div className="flex gap-1">
                  <div className="flex-1">
                    <CustomSelect value={realWaitMode} onChange={(val: string) => setRealWaitMode(val as 'min' | 'best' | 'manual')} options={waitOptions} className="w-full" />
                  </div>
                  {realWaitMode === 'manual' && (
                    <div className="flex items-center gap-1 w-20">
                      <input type="number" step="1" min="6" max="24" value={realManualPercent} onChange={(e) => setRealManualPercent(Math.min(24, Math.max(6, Number(e.target.value))))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-center" />
                      <span className="text-slate-400 text-xs">%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-sm text-slate-400 mb-1 block">当前时间(时/分)</label><div className="flex gap-1"><input type="number" value={currentHour} onChange={(e) => setCurrentHour(Math.min(23, Math.max(0, Number(e.target.value))))} className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center" placeholder="时" /><span className="text-slate-500">:</span><input type="number" value={currentMinute} onChange={(e) => setCurrentMinute(Math.min(59, Math.max(0, Number(e.target.value))))} className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center" placeholder="分" /></div></div>
              <div><label className="text-sm text-slate-400 mb-1 block">成熟剩余(时/分)</label><div className="flex gap-1"><input type="number" value={remainingHours} onChange={(e) => setRemainingHours(Math.max(0, Math.min(Number(e.target.value), Math.floor(maxRemainingMinutes / 60))))} className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center" placeholder="时" /><span className="self-center text-slate-500">:</span><input type="number" value={remainingMins} onChange={(e) => setRemainingMins(Math.min(59, Math.max(0, Number(e.target.value))))} className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center" placeholder="分" /></div></div>
              <div><label className="text-sm text-slate-400 mb-1 block">下次浇水(分)</label><input type="number" value={nextWaterMinutes} onChange={(e) => handleNextWaterChange(Number(e.target.value))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" /></div>
            </div>
            <div className="flex justify-start"><button onClick={() => { const now = new Date(); setCurrentHour(now.getHours()); setCurrentMinute(now.getMinutes()); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500 transition">获取当前时间</button></div>
            {realTimeSimulation && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="rounded-xl bg-slate-950 p-2 text-center"><div className="text-xs text-slate-400">预计收获</div><div className="text-sm font-bold text-emerald-400">{formatAbsoluteTime(realTimeSimulation.harvestTimeOffsetMinutes, currentHour, currentMinute)}</div></div>
                <div className="rounded-xl bg-slate-950 p-2 text-center"><div className="text-xs text-slate-400">剩余浇水次数</div><div className="text-sm font-bold text-yellow-400">{realTimeSimulation.totalWaterings} 次</div></div>
              </div>
            )}
            {renderRealTimeline()}
            <LiveTimer remainingMinutes={realTimeSimulation ? realTimeSimulation.harvestTimeOffsetMinutes : 0} />
          </div>
        </div>

        {/* 右侧：种植日程表 */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="text-3xl font-black text-emerald-400 mb-1">🌱 种植日程表</h2>
          <p className="text-xs text-slate-400 mb-4">从零开始种植，已包含首次浇水减少7%</p>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="w-[30%]">
                <label className="text-sm text-slate-400 mb-1 block">作物类型</label>
                <CustomSelect value={plantCropKey} onChange={setPlantCropKey} options={ruleOptions} className="w-full" />
              </div>
              <div className="w-[20%]">
                <label className="text-sm text-slate-400 mb-1 block">协助浇水次数</label>
                <input type="number" value={plantFriendCount} onChange={(e) => setPlantFriendCount(Math.min(4, Math.max(0, Number(e.target.value))))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" />
              </div>
              <div className="w-[50%]">
                <label className="text-sm text-slate-400 mb-1 block">每次等待时间</label>
                <div className="flex gap-1">
                  <div className="flex-1">
                    <CustomSelect value={plantWaitMode} onChange={(val) => setPlantWaitMode(val as any)} options={waitOptions} className="w-full" />
                  </div>
                  {plantWaitMode === 'manual' && (
                    <div className="flex items-center gap-1 w-20">
                      <input type="number" step="1" min="6" max="24" value={plantManualPercent} onChange={(e) => setPlantManualPercent(Math.min(24, Math.max(6, Number(e.target.value))))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-center" />
                      <span className="text-slate-400 text-xs">%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="rounded-xl bg-slate-950 p-2 text-center"><div className="text-xs text-slate-400">收获时间</div><div className="text-md font-bold text-emerald-400">{formatDurationShort(plantSchedule.harvestTimeHours)}</div></div>
              <div className="rounded-xl bg-slate-950 p-2 text-center"><div className="text-xs text-slate-400">浇水次数</div><div className="text-md font-bold text-yellow-400">{plantSchedule.totalWaterings} 次</div></div>
            </div>
            {renderPlantTimeline()}
          </div>
        </div>
      </div>

      {/* 底部两列布局：商人收益 (30%) + 居所浇水收益细则 (70%) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[30%_70%]">
        {/* 商人收益模块 */}
        <div id="profit" className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="text-3xl font-black text-yellow-400 mb-4">💰 商人收益计算</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-sm text-slate-400">菜摊等级</label>
                <input type="number" value={stallLevel} onChange={(e) => setStallLevel(Math.min(100, Math.max(1, Number(e.target.value))))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">收购倍率</label>
                <input type="number" step="0.1" value={merchantMultiplier} onChange={(e) => setMerchantMultiplier(Math.max(0, Number(e.target.value)))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">数量</label>
                <input type="number" value={amount} onChange={(e) => setAmount(Math.min(999999, Math.max(0, Number(e.target.value))))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2" />
              </div>
            </div>
            <div>
              <CustomRange min={1} max={10} step={1} value={proficiencyLevel} onChange={setProficiencyLevel} label="熟练度等级（1-10级）" unit="级" className="mt-1" />
            </div>
            <div className="flex justify-start">
              <div className="flex items-center gap-2">
                <span className="text-sm">百家满级加成</span>
                <input type="checkbox" checked={baijiaBonus} onChange={e => setBaijiaBonus(e.target.checked)} />
              </div>
            </div>
            <div className="rounded-xl bg-slate-950 p-3">
              <div className="text-xs text-slate-400">商人最终收益</div>
              <div className="text-lg font-black text-yellow-400">{Math.floor(profit).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* 居所浇水收益细则 */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="text-3xl font-black text-purple-400 mb-4">📋 居所浇水收益细则</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-2 px-1">作物</th>
                  <th className="text-left py-2 px-1">首次/最大浇水减少</th>
                  <th className="text-left py-2 px-1">他人浇水(次)</th>
                  <th className="text-left py-2 px-1">他人浇水上限</th>
                  <th className="text-left py-2 px-1">浇水间隔</th>
                  <th className="text-left py-2 px-1">最大浇水间隔</th>
                  <th className="text-left py-2 px-1">最少浇水减少</th>
                </tr>
              </thead>
              <tbody>
                {wateringRules.map((rule, idx) => (
                  <tr key={idx} className="border-b border-slate-700">
                    <td className="py-1.5 px-1 font-medium text-emerald-300">{rule.crop}</td>
                    <td className="py-1.5 px-1">{rule.firstReduce}</td>
                    <td className="py-1.5 px-1">{rule.friendWater}</td>
                    <td className="py-1.5 px-1">{rule.friendMax}</td>
                    <td className="py-1.5 px-1">{rule.waterInterval}</td>
                    <td className="py-1.5 px-1">{rule.maxInterval}</td>
                    <td className="py-1.5 px-1">{rule.minReduce}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-3">* 低等级5小时内作物不适用此规则</p>
        </div>
      </div>
    </div>
  )
}