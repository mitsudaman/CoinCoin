export interface Building {
  id: string
  name: string
  description: string
  basePrice: number
  baseCps: number // Coins Per Second
  clickValue?: number // Coins Per Click (クリック強化用)
  icon: string
  owned: number
  unlockRequirement?: string // 解放に必要な前段階施設ID
  upgradeLevel?: number // 効率アップグレードレベル（0=未アップグレード, 1=2倍, 2=3倍...）
}

export interface GameState {
  coins: number
  coinsPerSecond: number
  clickValue: number
  buildings: Building[]
  totalClicks: number
  playTime: number
}

export interface Player {
  id?: string
  username: string
  coins: number
  buildings: { [key: string]: number }
  updatedAt: Date
}