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
      console.log('🎯 usePrestige: Player data loaded:', {
        id: player.id,
        username: player.username,
        coins: player.coins,
        lifetime_coins: player.lifetime_coins,
        prestige_points: player.prestige_points,
        click_power_items: player.click_power_items,
        production_boost_items: player.production_boost_items,
        price_reduction_items: player.price_reduction_items
      })
      
      const newPrestigeData = {
        prestigePoints: player.prestige_points || 0,
        clickPowerItems: player.click_power_items || 0,
        productionBoostItems: player.production_boost_items || 0,
        priceReductionItems: player.price_reduction_items || 0,
        specialEffects: player.special_effects || 0
      }
      
      console.log('🎯 usePrestige: Setting prestige data:', newPrestigeData)
      setPrestigeData(newPrestigeData)
    } else {
      console.log('🎯 usePrestige: No player data')
    }
  }, [player])

  const prestigeEffect = calculatePrestigeEffect(prestigeData)
  const lifetimeCoins = (player?.lifetime_coins || 0) + currentCoins
  const canPrestigeNow = canPrestige(lifetimeCoins)
  const prestigePoints = calculatePrestigePoints(lifetimeCoins) - prestigeData.prestigePoints

  // プレステージ関連の計算値をログ出力（デバッグ用）
  useEffect(() => {
    console.log('🎯 usePrestige: Calculations updated:', {
      playerLifetimeCoins: player?.lifetime_coins || 0,
      currentCoins,
      totalLifetimeCoins: lifetimeCoins,
      canPrestigeNow,
      expectedPrestigePoints: prestigePoints,
      currentPrestigePoints: prestigeData.prestigePoints,
      prestigeEffect
    })
  }, [player, currentCoins, lifetimeCoins, canPrestigeNow, prestigePoints, prestigeData.prestigePoints, prestigeEffect])

  const executePrestige = async (): Promise<boolean> => {
    console.log('🎯 executePrestige called')
    console.log('🎯 Current state:', {
      hasPlayer: !!player,
      playerId: player?.id,
      playerUsername: player?.username,
      canPrestigeNow,
      currentCoins,
      lifetimeCoins,
      prestigePoints,
      isLoading
    })
    
    if (!player) {
      console.log('❌ executePrestige failed: No player')
      return false
    }
    
    if (!canPrestigeNow) {
      console.log('❌ executePrestige failed: Cannot prestige now')
      console.log('🔍 canPrestige check:', {
        lifetimeCoins,
        required: 500,
        canPrestige: canPrestige(lifetimeCoins)
      })
      return false
    }
    
    if (isLoading) {
      console.log('❌ executePrestige failed: Already loading')
      return false
    }

    console.log('✅ All conditions passed, executing prestige...')
    setIsLoading(true)
    try {
      console.log('🚀 Calling GameService.executePrestige with:', {
        playerId: player.id,
        currentCoins
      })
      const result = await GameService.executePrestige(player.id, currentCoins)
      console.log('📊 GameService.executePrestige result:', result)
      
      if (result.success) {
        console.log('✅ Prestige successful, updating local state')
        // プレステージデータを更新（プレステージポイント追加）
        setPrestigeData(prev => ({
          ...prev,
          prestigePoints: prev.prestigePoints + result.prestigePoints
        }))
        return true
      } else {
        console.log('❌ Prestige failed: GameService returned success=false')
        return false
      }
    } catch (error) {
      console.error('❌ Prestige execution failed with error:', error)
      return false
    } finally {
      setIsLoading(false)
      console.log('🎯 executePrestige completed')
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
      console.error('Prestige item purchase failed:', error)
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