'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  className?: string
}

export default function CustomSelect({ value, onChange, options, className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedLabel = options.find(opt => opt.value === value)?.label || value

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 p-2 text-white transition-all duration-200 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`absolute left-0 right-0 top-full mt-2 z-10 origin-top overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-xl transition-all duration-200 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value)
              setIsOpen(false)
            }}
            className={`w-full px-4 py-2 text-left text-white transition-colors hover:bg-emerald-500/20 ${option.value === value ? 'bg-emerald-500/10 text-emerald-400' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}