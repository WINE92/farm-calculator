export interface FarmRule {
  key: string;
  name: string;
  totalMinutes: number;
  firstReduce: number;      // 首次浇水/最大单次减少(分钟)
  minInterval: number;      // 最小浇水间隔(分钟)
  maxInterval: number;      // 最大浇水间隔(分钟)
  minReduce: number;        // 一次浇水最少减少时间(分钟)
  helperReducePer: number;  // 他人每次浇水减少时间(分钟)
  helperMaxReduce: number;  // 他人浇水总减少上限(分钟)
}

export const farmRules: FarmRule[] = [
  {
    key: "5h",
    name: "5小时",
    totalMinutes: 300,
    firstReduce: 21,
    minInterval: 18,
    maxInterval: 72,
    minReduce: 5.25,
    helperReducePer: 7.5,
    helperMaxReduce: 30,
  },
  {
    key: "16h",
    name: "16小时",
    totalMinutes: 960,
    firstReduce: 67.2,
    minInterval: 57.6,
    maxInterval: 230.4,
    minReduce: 16.8,
    helperReducePer: 24,
    helperMaxReduce: 96,
  },
  {
    key: "20h",
    name: "20小时",
    totalMinutes: 1200,
    firstReduce: 84,
    minInterval: 72,
    maxInterval: 288,
    minReduce: 21,
    helperReducePer: 30,
    helperMaxReduce: 120,
  },
  {
    key: "28h",
    name: "28小时",
    totalMinutes: 1680,
    firstReduce: 117.067,
    minInterval: 100.8,
    maxInterval: 403.2,
    minReduce: 29.4,
    helperReducePer: 42,
    helperMaxReduce: 168,
  },
];