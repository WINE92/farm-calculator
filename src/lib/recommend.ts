import { farmRules } from './farmRules'

// 高价值作物（四种具体作物）及其对应的生长时长规则（根据游戏设定，高价值作物均为20小时）
export const highValueCrops = [
  { id: 'yanxia', name: '炎霞辣椒', basePrice: 100, growKey: '20h' },
  { id: 'canjin', name: '灿金云棉', basePrice: 120, growKey: '20h' },
  { id: 'yezi', name: '曳紫云棉', basePrice: 160, growKey: '20h' },
  { id: 'xuri', name: '旭日辣椒', basePrice: 194, growKey: '20h' },
]

export interface CropRecommendation {
  id: string
  name: string
  profitPerHour: number
  growMinutes: number
}

/**
 * 推荐最佳作物（基于每小时收益）
 * @param weekend 是否为双倍周（周五12:00 ~ 周日23:59）
 * @param helperCount 预期他人浇水次数（影响减时效率）
 */
export function recommendBestCrop({ weekend, helperCount }: { weekend: boolean; helperCount: number }): CropRecommendation[] {
  const results: CropRecommendation[] = highValueCrops.map(crop => {
    const rule = farmRules.find(r => r.key === crop.growKey)!
    const growHours = rule.totalMinutes / 60
    // 基础每小时收益 = 价格 / 生长小时数
    let profitPerHour = crop.basePrice / growHours
    if (weekend) profitPerHour *= 2                     // 双倍周收益翻倍
    profitPerHour = profitPerHour * (1 + helperCount * 0.02) // 求助提高效率（每求助一次增加2%效率）
    return {
      id: crop.id,
      name: crop.name,
      profitPerHour: Math.round(profitPerHour),
      growMinutes: rule.totalMinutes,
    }
  })
  // 按收益降序排序
  return results.sort((a, b) => b.profitPerHour - a.profitPerHour)
}