// src/lib/weekend.ts
export function isWeekendDouble() {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  if (day === 5 && hour >= 12) return true
  if (day === 6) return true
  if (day === 0) return true
  return false
}

export function getWeekendRemaining() {
  const now = new Date()
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const diffMs = end.getTime() - now.getTime()
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return { hours, minutes }
}