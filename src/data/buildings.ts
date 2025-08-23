import { Building } from '@/types/game'

export const INITIAL_BUILDINGS: Building[] = [
  {
    id: 'click_enhancer',
    name: 'クリック強化装置',
    description: 'クリック報酬を+1コイン増加',
    basePrice: 10,
    baseCps: 0,
    clickValue: 1,
    icon: '🖱️',
    owned: 0,
    upgradeLevel: 0
    // クリック強化は最初から解放
  },
  {
    id: 'coin_maker',
    name: 'コイン製造機',
    description: '基本的なコイン製造装置',
    basePrice: 10,
    baseCps: 0.1,
    icon: '🏭',
    owned: 0,
    upgradeLevel: 0
    // 基本施設は最初から解放
  },
  {
    id: 'gold_mine',
    name: '金鉱',
    description: '地下からコインを採掘',
    basePrice: 100,
    baseCps: 1,
    icon: '⛏️',
    owned: 0,
    upgradeLevel: 0,
    unlockRequirement: 'coin_maker'
  },
  {
    id: 'bank',
    name: '銀行',
    description: 'コインを貯蓄・運用',
    basePrice: 1000,
    baseCps: 8,
    icon: '🏦',
    owned: 0,
    upgradeLevel: 0,
    unlockRequirement: 'gold_mine'
  },
  {
    id: 'mint',
    name: '造幣局',
    description: '公式なコイン製造施設',
    basePrice: 12000,
    baseCps: 47,
    icon: '🏛️',
    owned: 0,
    upgradeLevel: 0,
    unlockRequirement: 'bank'
  },
  {
    id: 'vault',
    name: '金庫',
    description: '大量のコインを保管・管理',
    basePrice: 130000,
    baseCps: 260,
    icon: '🏰',
    owned: 0,
    upgradeLevel: 0,
    unlockRequirement: 'mint'
  },
  {
    id: 'jewelry_store',
    name: '宝石店',
    description: '高価な宝石を販売してコイン獲得',
    basePrice: 1400000,
    baseCps: 1400,
    icon: '💎',
    owned: 0,
    upgradeLevel: 0,
    unlockRequirement: 'vault'
  }
]

// 施設の現在価格を計算（15%ずつ上昇）
export function getBuildingPrice(building: Building): number {
  return Math.floor(building.basePrice * Math.pow(1.15, building.owned))
}

// 施設の総CPS（Coins Per Second）を計算
export function getBuildingCps(building: Building): number {
  const baseProduction = building.baseCps * building.owned
  // アップグレードレベルに応じて倍率を適用（レベル1=2倍、レベル2=3倍...）
  const upgradeMultiplier = building.upgradeLevel ? building.upgradeLevel + 1 : 1
  return baseProduction * upgradeMultiplier
}

// 総クリック値を計算
export function getClickValue(buildings: Building[]): number {
  const baseClickValue = 1
  const bonusClickValue = buildings.reduce((total, building) => {
    if (building.clickValue) {
      return total + (building.clickValue * building.owned)
    }
    return total
  }, 0)
  return baseClickValue + bonusClickValue
}

// 施設が解放されているかチェック
export function isBuildingUnlocked(building: Building, buildings: Building[]): boolean {
  // 解放条件がない場合は最初から解放
  if (!building.unlockRequirement) {
    return true
  }
  
  // 前段階の施設を1つ以上所有している場合に解放
  const requiredBuilding = buildings.find(b => b.id === building.unlockRequirement)
  return requiredBuilding ? requiredBuilding.owned > 0 : false
}

// アップグレード価格を計算
export function getUpgradePrice(building: Building): number {
  if (!building.upgradeLevel || building.upgradeLevel >= 2) return -1 // 最大2レベルまで
  // アップグレード価格は基本価格の10倍 × (レベル + 1)
  return building.basePrice * 10 * (building.upgradeLevel + 1)
}

// アップグレード可能かチェック
export function canUpgradeBuilding(building: Building): boolean {
  return building.owned > 0 && (building.upgradeLevel || 0) < 2
}

// 解放条件のテキストを取得
export function getUnlockRequirementText(building: Building, buildings: Building[]): string {
  if (!building.unlockRequirement) return ''
  
  const requiredBuilding = buildings.find(b => b.id === building.unlockRequirement)
  return requiredBuilding ? `${requiredBuilding.name}を1つ購入で解放` : '解放条件不明'
}

// 次の施設（前段階が購入済み）かどうかチェック
export function isNextBuilding(building: Building, buildings: Building[]): boolean {
  // 解放条件がない場合はfalse
  if (!building.unlockRequirement) return false
  
  // 前段階の施設を1つ以上所有している場合のみ「次の施設」
  const requiredBuilding = buildings.find(b => b.id === building.unlockRequirement)
  if (!requiredBuilding) return false
  
  return requiredBuilding.owned > 0
}

// 施設の表示状態を取得
export function getBuildingDisplayState(building: Building, buildings: Building[]): 'unlocked' | 'next' | 'silhouette' {
  if (isBuildingUnlocked(building, buildings)) {
    return 'unlocked' // 解放済み
  }
  
  if (isNextBuilding(building, buildings)) {
    return 'next' // 次の施設（非活性）
  }
  
  return 'silhouette' // シルエット
}