import { supabase, DbPlayer } from './supabase'
import { Building } from '@/types/game'

export class GameService {
  // プレイヤーを作成または取得
  static async getOrCreatePlayer(username: string): Promise<DbPlayer | null> {
    try {
      // 既存プレイヤーを検索
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('username', username)
        .single()

      if (existingPlayer) {
        return existingPlayer
      }

      // プレイヤーが存在しない場合は新規作成
      const { data: newPlayer, error: createError } = await supabase
        .from('players')
        .insert({
          username,
          coins: 0,
          buildings: {}
        })
        .select()
        .single()

      if (createError) throw createError
      return newPlayer
    } catch (error) {
      // Error in getOrCreatePlayer
      return null
    }
  }

  // ゲームデータを保存
  static async saveGameData(
    playerId: string,
    coins: number,
    buildings: Building[]
  ): Promise<boolean> {
    try {
      const buildingsData: { [key: string]: number } = {}
      buildings.forEach(building => {
        if (building.owned > 0) {
          buildingsData[building.id] = building.owned
        }
      })

      const { error } = await supabase
        .from('players')
        .update({
          coins: Math.floor(coins),
          buildings: buildingsData
        })
        .eq('id', playerId)

      if (error) throw error
      return true
    } catch (error) {
      // Error saving game data
      return false
    }
  }

  // ランキング取得（上位10位）
  static async getLeaderboard(): Promise<DbPlayer[]> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('coins', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []
    } catch (error) {
      // Error fetching leaderboard
      return []
    }
  }

  // 特定プレイヤーの順位を取得
  static async getPlayerRank(playerId: string): Promise<number> {
    try {
      // まず現在のプレイヤーのコイン数を取得
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('coins')
        .eq('id', playerId)
        .single()

      if (playerError || !player) return -1

      // より多くのコインを持つプレイヤーの数を数える
      const { count, error: countError } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .gt('coins', player.coins)

      if (countError) return -1
      return (count || 0) + 1
    } catch (error) {
      // Error getting player rank
      return -1
    }
  }

  // プレステージ実行
  static async executePrestige(playerId: string, currentCoins: number): Promise<{ success: boolean; prestigePoints: number }> {
    
    try {
      const { data: player } = await supabase
        .from('players')
        .select('prestige_points')
        .eq('id', playerId)
        .single()

      if (!player) return { success: false, prestigePoints: 0 }

      // 現在のコイン数からプレステージポイントを計算
      const newPrestigePoints = Math.floor(currentCoins / 100)
      const earnedPoints = newPrestigePoints

      // リセット実行（既存のプレステージポイントに追加）
      const { error } = await supabase
        .from('players')
        .update({
          coins: 0,
          buildings: {},
          prestige_points: (player.prestige_points || 0) + earnedPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', playerId)

      if (error) throw error
      return { success: true, prestigePoints: earnedPoints }
    } catch (error) {
      // Error executing prestige
      return { success: false, prestigePoints: 0 }
    }
  }


  // プレステージアイテム購入
  static async buyPrestigeItem(playerId: string, itemType: string): Promise<boolean> {
    try {
      const { data: player } = await supabase
        .from('players')
        .select('prestige_points, click_power_items, production_boost_items, price_reduction_items')
        .eq('id', playerId)
        .single()

      if (!player) return false

      const updateData: Record<string, number | string> = {}
      let cost = 0

      switch (itemType) {
        case 'click_power':
          cost = 1
          updateData.click_power_items = (player.click_power_items || 0) + 1
          break
        case 'production_boost':
          cost = 2
          updateData.production_boost_items = (player.production_boost_items || 0) + 1
          break
        case 'price_reduction':
          cost = 3
          updateData.price_reduction_items = (player.price_reduction_items || 0) + 1
          break
        default:
          return false
      }

      if ((player.prestige_points || 0) < cost) return false

      updateData.prestige_points = (player.prestige_points || 0) - cost
      updateData.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', playerId)

      if (error) throw error
      return true
    } catch (error) {
      // Error buying prestige item
      return false
    }
  }
}