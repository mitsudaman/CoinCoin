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
    },
    {
      id: '2', 
      username: 'TestPlayer2',
      coins: 8500,
      buildings: { coin_maker: 2 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      username: 'TopPlayer',
      coins: 50000,
      buildings: { coin_maker: 5, gold_mine: 3, bank: 1 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

  // レスポンス時間をシミュレート
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const MockGameServiceInstance = new MockGameService()