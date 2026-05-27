'use client'

import { useEffect, useState } from 'react'

export default function LiveTimer({ remainingMinutes }: { remainingMinutes: number }) {
  const [secondsLeft, setSecondsLeft] = useState(remainingMinutes * 60)

  useEffect(() => {
    setSecondsLeft(remainingMinutes * 60)
  }, [remainingMinutes])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => {
      setSecondsLeft(prev => Math.max(prev - 1, 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  const totalSeconds = Math.floor(secondsLeft)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-8">
      <div className="mb-3 text-slate-400">实时成熟倒计时</div>
      <div className="mb-6 text-5xl font-black text-emerald-400">
        {hours}h {minutes}m {seconds}s
      </div>
    </div>
  )
}