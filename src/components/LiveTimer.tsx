'use client'

import { useEffect, useState } from 'react'

export default function LiveTimer({
  remainingMinutes,
}: {
  remainingMinutes: number
}) {
  const [now, setNow] = useState(
    new Date(),
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const matureTime = new Date(
    now.getTime() +
      remainingMinutes * 60 * 1000,
  )

  const diff =
    matureTime.getTime() - now.getTime()

  const totalSeconds = Math.max(
    Math.floor(diff / 1000),
    0,
  )

  const hours = Math.floor(
    totalSeconds / 3600,
  )

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  )

  const seconds = totalSeconds % 60

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-8">
      <div className="mb-3 text-slate-400">
        实时成熟倒计时
      </div>

      <div className="mb-6 text-5xl font-black text-emerald-400">
        {hours}h {minutes}m {seconds}s
      </div>

      <div className="space-y-2 text-slate-400">
        <div>
          当前时间：
          {now.toLocaleString()}
        </div>

        <div>
          预计成熟：
          {matureTime.toLocaleString()}
        </div>
      </div>
    </div>
  )
}