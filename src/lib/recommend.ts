import { farmRules } from './farmRules'

export interface RecommendResult {
  id: string

  name: string

  score: number

  profitPerHour: number

  growMinutes: number
}

const cropValues = {
  '5h': 120,

  '16h': 450,

  '20h': 700,

  '28h': 1100,
}

export function recommendBestCrop({
  weekend,

  helperCount,
}: {
  weekend: boolean

  helperCount: number
}) {
  const results: RecommendResult[] =
    farmRules.map((rule) => {
      const baseValue =
        cropValues[
          rule.id as keyof typeof cropValues
        ]

      const helperBonus =
        Math.min(helperCount * 0.025, 0.1)

      const growTime =
        rule.baseMinutes *
        (1 - 0.07 - helperBonus) *
        (6 / 7.75)

      const finalValue = weekend
        ? baseValue * 2
        : baseValue

      const profitPerHour =
        finalValue / (growTime / 60)

      return {
        id: rule.id,

        name: rule.name,

        score: profitPerHour,

        profitPerHour,

        growMinutes: growTime,
      }
    })

  results.sort(
    (a, b) =>
      b.profitPerHour - a.profitPerHour,
  )

  return results
}