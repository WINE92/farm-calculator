'use client'

import { useEffect, useState } from 'react'

import {
  getWeekendRemaining,
  isWeekendDouble,
} from '@/lib/weekend'

export default function WeekendStatus() {
  const [enabled, setEnabled] =
    useState(false)

  const [remaining, setRemaining] =
    useState({
      hours: 0,

      minutes: 0,
    })

  useEffect(() => {
    const update = () => {
      setEnabled(isWeekendDouble())

      setRemaining(
        getWeekendRemaining(),
      )
    }

    update()

    const timer = setInterval(update, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="rounded-3xl border border-orange-500/20 bg-slate-900/70 p-8">
      <div className="mb-3 text-slate-400">
        周末双倍状态
      </div>

      <div
        className={`mb-4 text-2xl font-black ${
          enabled
            ? 'text-orange-400'
            : 'text-slate-500'
        }`}
      >
        {enabled
          ? '双倍进行中'
          : '当前非双倍时间'}
      </div>

      {enabled && (
        <div className="text-slate-300">
          距离结束：
          {remaining.hours}小时{' '}
          {remaining.minutes}分钟
        </div>
      )}
    </div>
  )
}