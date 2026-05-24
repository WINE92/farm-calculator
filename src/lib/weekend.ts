export function isWeekendDouble() {
  const now = new Date()

  const day = now.getDay()

  const hour = now.getHours()

  if (day === 5 && hour >= 12) {
    return true
  }

  if (day === 6) {
    return true
  }

  if (day === 0) {
    return true
  }

  return false
}

export function getWeekendEndTime() {
  const now = new Date()

  const end = new Date(now)

  end.setDate(
    now.getDate() + ((7 - now.getDay()) % 7),
  )

  end.setHours(23)

  end.setMinutes(59)

  end.setSeconds(59)

  return end
}

export function getWeekendRemaining() {
  const end = getWeekendEndTime()

  const diff =
    end.getTime() - Date.now()

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

  return {
    hours,

    minutes,
  }
}