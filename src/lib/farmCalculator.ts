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
  proficiencyLevel: number;
}) {
  const { basePrice, amount, stallLevel, merchantMultiplier, baijiaBonus, proficiencyLevel } = params;
  const stallRate = 1 + (stallLevel - 1) * 0.05;
  const buff = baijiaBonus ? 1.2 : 1;
  const proficiencyBonus = 1 + proficiencyLevel * 0.1;
  return basePrice * amount * merchantMultiplier * stallRate * buff * proficiencyBonus;
}

// 根据key获取规则
export function getRuleByKey(key: string): FarmRule | undefined {
  return farmRules.find(r => r.key === key);
}

// ========== 以下是新增的函数（用于浇水时间计算） ==========

/**
 * 根据 Excel 表“作物”中的公式计算预计剩余时间（分钟）
 */
export function calculateExpectedRemainingTime(params: {
  cropTotalRemainingMinutes: number;  // 作物剩余总分钟（当前距离成熟的总时间）
  nextWaterMinutes: number;           // 下次浇水时间（分钟）
  singleWaterReduce: number;          // 单次浇水减少量（分钟）
  minInterval: number;                // 最小浇水间隔（分钟）
}) {
  const { cropTotalRemainingMinutes, nextWaterMinutes, singleWaterReduce, minInterval } = params;
  const diff = cropTotalRemainingMinutes - nextWaterMinutes;
  
  if (diff < singleWaterReduce) {
    // 如果剩余时间少于浇水减少量，则直接返回下次浇水时间
    return nextWaterMinutes;
  } else if (diff > minInterval - 1) {
    // 否则按效率因子计算
    return (diff - singleWaterReduce) * (6 / 7.75) + nextWaterMinutes;
  } else {
    // 中间情况（极少）返回原剩余时间
    return cropTotalRemainingMinutes;
  }
}

/**
 * 计算下次最晚浇水时间（绝对分钟数，从午夜0点开始计算）
 */
export function calculateLatestWaterTime(params: {
  currentTimeMinutes: number;          // 当前时间距离午夜0点的分钟数
  cropTotalRemainingMinutes: number;   // 作物剩余总分钟
  nextWaterMinutes: number;            // 用户计划的下次浇水时间（分钟）
  maxInterval: number;                 // 最大浇水间隔（分钟）
  minInterval: number;                 // 最小浇水间隔（分钟）
}) {
  const { currentTimeMinutes, cropTotalRemainingMinutes, nextWaterMinutes, maxInterval, minInterval } = params;
  // 如果作物剩余时间小于下次浇水时间，则无法浇水
  if (cropTotalRemainingMinutes < nextWaterMinutes) {
    return null; // 无法浇水
  }
  // 计算最晚浇水时间（绝对分钟数），这里取计划时间与最大间隔的较小值，但不能小于最小间隔
  let latest = nextWaterMinutes;
  if (latest > maxInterval) latest = maxInterval;
  if (latest < minInterval) latest = minInterval;
  return currentTimeMinutes + latest;
}

/**
 * 将分钟数（从午夜0点开始）格式化成“今天/明天 X点X分”的字符串
 */
export function formatTimeFromMinutes(minutesSinceMidnight: number): string {
  const totalMinutes = Math.round(minutesSinceMidnight);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  let dayOffset = Math.floor(totalMinutes / 1440);
  let prefix = '';
  if (dayOffset === 1) prefix = '明天 ';
  else if (dayOffset === 2) prefix = '后天 ';
  else if (dayOffset > 0) prefix = `${dayOffset}天后 `;
  else prefix = '';
  return `${prefix}${hours}点${mins}分`;
}