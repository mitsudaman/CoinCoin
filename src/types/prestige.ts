export interface PrestigeData {
  prestigePoints: number
  clickPowerItems: number
  productionBoostItems: number
  priceReductionItems: number
  specialEffects: number
}

export interface PrestigeItem {
  id: string
  name: string
  description: string
  icon: string
  cost: number
  effect: string
  maxPurchases?: number
}

export interface PrestigeEffect {
  clickBonus: number
  productionMultiplier: number
  priceDiscount: number
}

export const PRESTIGE_ITEMS: PrestigeItem[] = [
  {
    id: 'click_power',
    name: 'クリックパワー',
    description: 'クリック報酬+100コイン',
    icon: '🖱️',
    cost: 1,
    effect: '+100 クリック報酬'
  },
  {
    id: 'production_boost',
    name: '生産ブースト',
    description: '全施設の生産量+100%',
    icon: '🏭',
    cost: 2,
    effect: '+100% 生産効率'
  },
  {
    id: 'price_reduction',
    name: '価格削減',
    description: '全施設の価格-50%',
    icon: '💰',
    cost: 3,
    effect: '-50% 購入価格'
  }
]

// プレステージ効果計算関数
export function calculatePrestigeEffect(prestigeData: PrestigeData): PrestigeEffect {
  return {
    clickBonus: prestigeData.clickPowerItems * 100,
    productionMultiplier: 1 + (prestigeData.productionBoostItems * 1.0), // 100% = 1.0倍率
    priceDiscount: prestigeData.priceReductionItems * 0.5 // 50% = 0.5割引
  }
}

// プレステージポイント計算
export function calculatePrestigePoints(lifetimeCoins: number): number {
  return Math.floor(lifetimeCoins / 100)
}

// プレステージ解放条件チェック
export function canPrestige(lifetimeCoins: number): boolean {
  return lifetimeCoins >= 500
}