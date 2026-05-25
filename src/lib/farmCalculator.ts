import { farmRules, FarmRule } from "./farmRules";

export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}小时${m}分钟`;
}

// 极限成熟时间（浇水拉满）
export function calculateExtremeTime(totalMinutes: number) {
  // 文档公式：总时间 * (1-0.1-0.07) * (6/7.75)
  return totalMinutes * (1 - 0.1 - 0.07) * (6 / 7.75);
}

// 只浇两次水的成熟时间（根据文档数据表）
export function calculateTwoWaterTime(totalMinutes: number): number {
  const map: Record<number, number> = {
    300: 228,   // 5h -> 3h48m
    960: 730,   // 16h -> 12h10m
    1200: 912,  // 20h -> 15h12m
    1680: 1277, // 28h -> 21h17m
  };
  return map[totalMinutes] || totalMinutes * 0.76;
}

// 计算他人浇水总减时（带上限）
export function calculateHelperReduce(
  rule: FarmRule,
  helperCount: number
): number {
  let reduce = helperCount * rule.helperReducePer;
  if (reduce > rule.helperMaxReduce) reduce = rule.helperMaxReduce;
  return reduce;
}

// 计算最终剩余时间（基于当前剩余时间、已获得的减时以及效率因子）
// 此函数为简化版，直接扣除总减时（不再乘效率因子，因为效率因子已经在极限公式中体现）
// 更好的实现：如果用户输入剩余时间，我们减去 helper 减时即可。
export function calculateRemainingTime(
  currentRemaining: number,
  totalHelperReduce: number
): number {
   const remaining = currentRemaining - totalHelperReduce;
   return remaining < 0 ? 0 : remaining;
}

// 商人收益（增加熟练度参数）
export function calculateProfit(params: {
  basePrice: number;
  amount: number;
  stallLevel: number;
  merchantMultiplier: number;
  baijiaBonus: boolean;
  proficiencyLevel: number;  // 1-10 级，10级满级加成100%
}) {
  const { basePrice, amount, stallLevel, merchantMultiplier, baijiaBonus, proficiencyLevel } = params;
  const stallRate = 1 + (stallLevel - 1) * 0.05;
  const buff = baijiaBonus ? 1.2 : 1;
  // 熟练度加成：等级1 -> 1倍，等级10 -> 2倍
  const proficiencyBonus = 1 + (proficiencyLevel - 1) / 9;
  return basePrice * amount * stallRate * merchantMultiplier * buff * proficiencyBonus;
}

// 根据key获取规则
export function getRuleByKey(key: string): FarmRule | undefined {
  return farmRules.find(r => r.key === key);
}