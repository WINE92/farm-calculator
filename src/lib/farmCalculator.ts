import { farmRules } from './farmRules'

export function getFarmRule(id: string) {
  return farmRules.find((f) => f.id === id)!
}

export function calculateExtremeTime(
  id: string,
) {
  const rule = getFarmRule(id)

  return rule.extremeGrowTime
}

export function calculateTwoWaterTime(
  id: string,
) {
  const rule = getFarmRule(id)

  return rule.twoWaterGrowTime
}

export function calculateHelperReduce(
  id: string,

  helperCount: number,
) {
  const rule = getFarmRule(id)

  const total = Math.min(
    helperCount * rule.helperReduce,

    rule.helperMax,
  )

  return total
}

export function calculateRemainingTime(
  id: string,

  currentMinutes: number,

  helperCount: number,
) {
  const rule = getFarmRule(id)

  const helperReduce =
    calculateHelperReduce(
      id,

      helperCount,
    )

  const afterHelper =
    currentMinutes - helperReduce

  const finalTime =
    (afterHelper * 6) / 7.75

  return Math.max(
    finalTime,

    rule.minWaterReduce,
  )
}

export function formatMinutes(
  totalMinutes: number,
) {
  const hours = Math.floor(
    totalMinutes / 60,
  )

  const minutes = Math.floor(
    totalMinutes % 60,
  )

  return `${hours}小时 ${minutes}分钟`
}

export function calculateProfit({
  basePrice,

  amount,

  stallLevel,

  merchantMultiplier,

  baijiaBonus,

}: {
  basePrice: number

  amount: number

  stallLevel: number

  merchantMultiplier: number

  baijiaBonus: boolean
}) {
  const stallMultiplier =
    1 + (stallLevel - 1) * 0.05

  const final =
    basePrice *
    amount *
    stallMultiplier *
    merchantMultiplier *
    (baijiaBonus ? 1.2 : 1)

  return {
    stallMultiplier,

    final,
  }
}