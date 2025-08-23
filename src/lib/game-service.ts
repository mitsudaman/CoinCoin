import { supabase, DbPlayer } from './supabase'
import { Building } from '@/types/game'
import { MockGameServiceInstance } from './game-service-mock'

// 開発環境かどうかを判定
const isDev = process.env.NODE_ENV === 'development' && 
             (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
              process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co')

export class GameService {
  // プレイヤーを作成または取得
  static async getOrCreatePlayer(username: string): Promise<DbPlayer | null> {
    if (isDev) {
      return MockGameServiceInstance.getOrCreatePlayer(username)
    }

    try {
      // 既存プレイヤーを検索
      const { data: existingPlayer, error: fetchError } = await supabase
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
      console.error('Error in getOrCreatePlayer:', error)
      return null
    }
  }

  // ゲームデータを保存
  static async saveGameData(
    playerId: string,
    coins: number,
    buildings: Building[]
  ): Promise<boolean> {
    if (isDev) {
      return MockGameServiceInstance.saveGameData(playerId, coins, buildings)
    }

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
      console.error('Error saving game data:', error)
      return false
    }
  }

  // ランキング取得（上位10位）
  static async getLeaderboard(): Promise<DbPlayer[]> {
    if (isDev) {
      return MockGameServiceInstance.getLeaderboard()
    }

    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('coins', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      return []
    }
  }

  // 特定プレイヤーの順位を取得
  static async getPlayerRank(playerId: string): Promise<number> {
    if (isDev) {
      return MockGameServiceInstance.getPlayerRank(playerId)
    }

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
      console.error('Error getting player rank:', error)
      return -1
    }
  }
}