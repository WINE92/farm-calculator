export interface FarmRule {
  id: string

  name: string

  baseMinutes: number

  firstWaterReduce: number

  helperReduce: number

  helperMax: number

  minWaterInterval: number

  maxWaterInterval: number

  minWaterReduce: number

  maxWaterReduce: number

  extremeGrowTime: number

  twoWaterGrowTime: number
}

export const farmRules: FarmRule[] = [
  {
    id: '5h',

    name: '5小时作物',

    baseMinutes: 300,

    firstWaterReduce: 21,

    helperReduce: 7.5,

    helperMax: 30,

    minWaterInterval: 18,

    maxWaterInterval: 72,

    minWaterReduce: 5.25,

    maxWaterReduce: 21,

    extremeGrowTime: 193,

    twoWaterGrowTime: 228,
  },

  {
    id: '16h',

    name: '16小时作物',

    baseMinutes: 960,

    firstWaterReduce: 67.2,

    helperReduce: 24,

    helperMax: 96,

    minWaterInterval: 57.6,

    maxWaterInterval: 230.4,

    minWaterReduce: 16.8,

    maxWaterReduce: 67.2,

    extremeGrowTime: 617,

    twoWaterGrowTime: 730,
  },

  {
    id: '20h',

    name: '20小时作物',

    baseMinutes: 1200,

    firstWaterReduce: 84,

    helperReduce: 30,

    helperMax: 120,

    minWaterInterval: 72,

    maxWaterInterval: 288,

    minWaterReduce: 21,

    maxWaterReduce: 84,

    extremeGrowTime: 772,

    twoWaterGrowTime: 912,
  },

  {
    id: '28h',

    name: '28小时作物',

    baseMinutes: 1680,

    firstWaterReduce: 117.06,

    helperReduce: 42,

    helperMax: 168,

    minWaterInterval: 100.8,

    maxWaterInterval: 403.2,

    minWaterReduce: 29.4,

    maxWaterReduce: 117.06,

    extremeGrowTime: 1080,

    twoWaterGrowTime: 1277,
  },
]