import { useState, useEffect } from 'react'
import { DbPlayer } from '@/lib/supabase'
import { PrestigeData, PrestigeEffect, calculatePrestigeEffect, calculatePrestigePoints, canPrestige } from '@/types/prestige'
import { GameService } from '@/lib/game-service'

export interface UsePrestigeReturn {
  prestigeData: PrestigeData
  prestigeEffect: PrestigeEffect
  canPrestigeNow: boolean
  prestigePoints: number
  isLoading: boolean
  executePrestige: () => Promise<boolean>
  buyPrestigeItem: (itemType: string) => Promise<boolean>
}

export function usePrestige(player: DbPlayer | null, currentCoins: number): UsePrestigeReturn {
  const [prestigeData, setPrestigeData] = useState<PrestigeData>({
    prestigePoints: 0,
    clickPowerItems: 0,
    productionBoostItems: 0,
    priceReductionItems: 0,
    specialEffects: 0
  })
  
  const [isLoading, setIsLoading] = useState(false)

  // プレイヤーデータからプレステージデータを更新
  useEffect(() => {
    if (player) {
      
      const newPrestigeData = {
        prestigePoints: player.prestige_points || 0,
        clickPowerItems: player.click_power_items || 0,
        productionBoostItems: player.production_boost_items || 0,
        priceReductionItems: player.price_reduction_items || 0,
        specialEffects: player.special_effects || 0
      }
      setPrestigeData(newPrestigeData)
    } else {
      // No player data
    }
  }, [player])

  const prestigeEffect = calculatePrestigeEffect(prestigeData)
  // 現在のコイン数ベースでプレステージ判定
  const canPrestigeNow = canPrestige(currentCoins)
  const prestigePoints = calculatePrestigePoints(currentCoins)

  // プレステージ関連の計算値をログ出力（デバッグ用）
  // Prestige calculations updated when dependencies change

  const executePrestige = async (): Promise<boolean> => {
    
    if (!player) {
      return false
    }
    
    if (!canPrestigeNow) {
      return false
    }
    
    if (isLoading) {
      return false
    }

    setIsLoading(true)
    try {
      const result = await GameService.executePrestige(player.id, currentCoins)
      
      if (result.success) {
        // プレステージデータを更新（プレステージポイント追加）
        setPrestigeData(prev => ({
          ...prev,
          prestigePoints: prev.prestigePoints + result.prestigePoints
        }))
        return true
      } else {
        return false
      }
    } catch (error) {
      // Prestige execution failed
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const buyPrestigeItem = async (itemType: string): Promise<boolean> => {
    if (!player || isLoading) return false

    let cost = 0
    switch (itemType) {
      case 'click_power':
        cost = 1
        break
      case 'production_boost':
        cost = 2
        break
      case 'price_reduction':
        cost = 3
        break
      default:
        return false
    }

    if (prestigeData.prestigePoints < cost) return false

    setIsLoading(true)
    try {
      const success = await GameService.buyPrestigeItem(player.id, itemType)
      if (success) {
        // ローカル状態を更新
        setPrestigeData(prev => {
          const newData = { ...prev, prestigePoints: prev.prestigePoints - cost }
          switch (itemType) {
            case 'click_power':
              newData.clickPowerItems += 1
              break
            case 'production_boost':
              newData.productionBoostItems += 1
              break
            case 'price_reduction':
              newData.priceReductionItems += 1
              break
          }
          return newData
        })
        return true
      }
      return false
    } catch (error) {
      // Prestige item purchase failed
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    prestigeData,
    prestigeEffect,
    canPrestigeNow,
    prestigePoints,
    isLoading,
    executePrestige,
    buyPrestigeItem
  }
}