export interface CropData {
  id: string
  name: string
  growTime: number
  basePrice: number
  icon: string
}

export const crops: CropData[] = [
  {
    id: 'carrot',
    name: '胡萝卜',
    growTime: 300,
    basePrice: 120,
    icon: '🥕',
  },

  {
    id: 'pumpkin',
    name: '南瓜',
    growTime: 960,
    basePrice: 450,
    icon: '🎃',
  },

  {
    id: 'tomato',
    name: '番茄',
    growTime: 1200,
    basePrice: 700,
    icon: '🍅',
  },

  {
    id: 'golden',
    name: '黄金麦穗',
    growTime: 1680,
    basePrice: 1400,
    icon: '🌾',
  },
]