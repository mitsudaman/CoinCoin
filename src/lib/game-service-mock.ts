import { DbPlayer } from './supabase'
import { Building } from '@/types/game'

// ローカル開発用のモックデータストレージ
class MockGameService {
  private players: DbPlayer[] = [
    {
      id: '1',
      username: 'TestPlayer1',
      coins: 15000,
      buildings: { coin_maker: 3, gold_mine: 2 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lifetime_coins: 800,
      prestige_points: 5,
      click_power_items: 2,
      production_boost_items: 1,
      price_reduction_items: 0,
      special_effects: 0,
    },
    {
      id: '2', 
      username: 'TestPlayer2',
      coins: 8500,
      buildings: { coin_maker: 2 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lifetime_coins: 300,
      prestige_points: 2,
      click_power_items: 1,
      production_boost_items: 0,
      price_reduction_items: 1,
      special_effects: 0,
    },
    {
      id: '3',
      username: 'TopPlayer',
      coins: 50000,
      buildings: { coin_maker: 5, gold_mine: 3, bank: 1 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lifetime_coins: 1500,
      prestige_points: 10,
      click_power_items: 3,
      production_boost_items: 2,
      price_reduction_items: 2,
      special_effects: 0,
    }
  ]

  // プレイヤーを作成または取得
  async getOrCreatePlayer(username: string): Promise<DbPlayer | null> {
    await this.delay(500) // リアルなレスポンス時間をシミュレート

    try {
      // 既存プレイヤーを検索
      const existingPlayer = this.players.find(p => p.username === username)
      
      if (existingPlayer) {
        return existingPlayer
      }

      // プレイヤーが存在しない場合は新規作成
      const newPlayer: DbPlayer = {
        id: Math.random().toString(36).substring(2, 11),
        username,
        coins: 0,
        buildings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        lifetime_coins: 0,
        prestige_points: 0,
        click_power_items: 0,
        production_boost_items: 0,
        price_reduction_items: 0,
        special_effects: 0,
      }

      this.players.push(newPlayer)
      return newPlayer
    } catch (error) {
      console.error('Mock service error:', error)
      return null
    }
  }

  // ゲームデータを保存
  async saveGameData(
    playerId: string,
    coins: number,
    buildings: Building[]
  ): Promise<boolean> {
    await this.delay(300)

    try {
      const playerIndex = this.players.findIndex(p => p.id === playerId)
      if (playerIndex === -1) return false

      const buildingsData: { [key: string]: number } = {}
      buildings.forEach(building => {
        if (building.owned > 0) {
          buildingsData[building.id] = building.owned
        }
      })

      this.players[playerIndex] = {
        ...this.players[playerIndex],
        coins: Math.floor(coins),
        buildings: buildingsData,
        updated_at: new Date().toISOString(),
      }

      console.log('🎮 Mock: Game data saved for', this.players[playerIndex].username)
      return true
    } catch (error) {
      console.error('Mock save error:', error)
      return false
    }
  }

  // ランキング取得（上位10位）
  async getLeaderboard(): Promise<DbPlayer[]> {
    await this.delay(200)

    try {
      return [...this.players]
        .sort((a, b) => b.coins - a.coins)
        .slice(0, 10)
    } catch (error) {
      console.error('Mock leaderboard error:', error)
      return []
    }
  }

  // 特定プレイヤーの順位を取得
  async getPlayerRank(playerId: string): Promise<number> {
    await this.delay(100)

    try {
      const player = this.players.find(p => p.id === playerId)
      if (!player) return -1

      const sorted = [...this.players].sort((a, b) => b.coins - a.coins)
      return sorted.findIndex(p => p.id === playerId) + 1
    } catch (error) {
      console.error('Mock rank error:', error)
      return -1
    }
  }

  // プレステージ実行
  async executePrestige(playerId: string, currentCoins: number): Promise<{ success: boolean; prestigePoints: number }> {
    console.log('🎮 Mock.executePrestige called with:', { playerId, currentCoins })
    console.log('🎮 Mock: Current players count:', this.players.length)
    console.log('🎮 Mock: Available player IDs:', this.players.map(p => ({ id: p.id, username: p.username })))
    
    await this.delay(400)

    try {
      const playerIndex = this.players.findIndex(p => p.id === playerId)
      console.log('🎮 Mock: Player found at index:', playerIndex)
      
      if (playerIndex === -1) {
        console.log('❌ Mock: Player not found with ID:', playerId)
        return { success: false, prestigePoints: 0 }
      }

      const player = this.players[playerIndex]
      console.log('🎮 Mock: Found player:', {
        id: player.id,
        username: player.username,
        currentCoins: player.coins,
        lifetimeCoins: player.lifetime_coins,
        prestigePoints: player.prestige_points
      })
      
      const lifetimeCoins = (player.lifetime_coins || 0) + currentCoins
      const newPrestigePoints = Math.floor(lifetimeCoins / 100)
      const earnedPoints = newPrestigePoints - (player.prestige_points || 0)

      console.log('🎮 Mock: Prestige calculations:', {
        oldLifetimeCoins: player.lifetime_coins || 0,
        addingCoins: currentCoins,
        newLifetimeCoins: lifetimeCoins,
        oldPrestigePoints: player.prestige_points || 0,
        newPrestigePoints,
        earnedPoints
      })

      // プレステージ実行: データをリセットして新しいポイントを付与
      this.players[playerIndex] = {
        ...player,
        coins: 0,
        buildings: {},
        lifetime_coins: lifetimeCoins,
        prestige_points: newPrestigePoints,
        updated_at: new Date().toISOString()
      }

      console.log('✅ Mock: Prestige executed for', player.username, 'earned:', earnedPoints, 'points')
      console.log('🎮 Mock: Updated player:', this.players[playerIndex])
      return { success: true, prestigePoints: earnedPoints }
    } catch (error) {
      console.error('❌ Mock prestige error:', error)
      return { success: false, prestigePoints: 0 }
    }
  }

  // プレステージアイテム購入
  async buyPrestigeItem(playerId: string, itemType: string): Promise<boolean> {
    await this.delay(300)

    try {
      const playerIndex = this.players.findIndex(p => p.id === playerId)
      if (playerIndex === -1) return false

      const player = this.players[playerIndex]
      let cost = 0
      const updateData: Partial<DbPlayer> = {}

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

      // プレイヤーデータを更新
      this.players[playerIndex] = {
        ...player,
        ...updateData
      }

      console.log('🎮 Mock: Prestige item purchased:', itemType, 'by', player.username)
      return true
    } catch (error) {
      console.error('Mock prestige item purchase error:', error)
      return false
    }
  }

  // レスポンス時間をシミュレート
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const MockGameServiceInstance = new MockGameService()