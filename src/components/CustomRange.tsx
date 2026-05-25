'use client'

import { useRef, useEffect } from 'react'

interface CustomRangeProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  label?: string
  unit?: string
  className?: string
}

export default function CustomRange({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  unit = '',
  className = '',
}: CustomRangeProps) {
  const rangeRef = useRef<HTMLInputElement>(null)

  // 更新滑块的背景渐变（已激活部分高亮）
  useEffect(() => {
    if (rangeRef.current) {
      const percent = ((value - min) / (max - min)) * 100
      rangeRef.current.style.background = `linear-gradient(to right, #10b981 0%, #10b981 ${percent}%, #334155 ${percent}%, #334155 100%)`
    }
  }, [value, min, max])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <div className="text-sm text-slate-400">{label}</div>}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">{min}</span>
        <input
          ref={rangeRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${((value - min) / (max - min)) * 100}%, #334155 ${((value - min) / (max - min)) * 100}%, #334155 100%)`,
          }}
        />
        <span className="text-sm text-slate-500">{max}</span>
      </div>
      <div className="text-sm text-emerald-400">
        {unit ? `${value} ${unit}` : value}（加成 {Math.round(((value - min) / (max - min)) * 100)}%）
      </div>
    </div>
  )
}