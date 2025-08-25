import { useState, useEffect, useCallback } from 'react'
import { supabase, DbPlayer } from '@/lib/supabase'
import { GameService } from '@/lib/game-service'

interface RealtimeLeaderboardState {
  leaderboard: DbPlayer[]
  playerRank: number
  isConnected: boolean
  isLoading: boolean
  lastUpdated: Date | null
}

export function useRealtimeLeaderboard(playerId?: string) {
  const [state, setState] = useState<RealtimeLeaderboardState>({
    leaderboard: [],
    playerRank: -1,
    isConnected: false,
    isLoading: true,
    lastUpdated: null
  })

  // ランキングデータを取得する関数
  const fetchLeaderboard = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      const leaderboardData = await GameService.getLeaderboard()
      let playerRank = -1

      if (playerId) {
        playerRank = await GameService.getPlayerRank(playerId)
      }

      setState(prev => ({
        ...prev,
        leaderboard: leaderboardData,
        playerRank,
        isLoading: false,
        lastUpdated: new Date()
      }))

    } catch (error) {
      // Error fetching data
      setState(prev => ({
        ...prev,
        isLoading: false
      }))
    }
  }, [playerId])

  // 初回データ読み込み
  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  // Supabase Realtime購読の設定
  useEffect(() => {

    // Realtimeチャンネルを作成
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE全てを購読
          schema: 'public',
          table: 'players'
        },
        (payload) => {

          // データベース変更を受信したらランキングを再取得
          fetchLeaderboard()
        }
      )
      .subscribe((status) => {
        setState(prev => ({ 
          ...prev, 
          isConnected: status === 'SUBSCRIBED' 
        }))
      })

    // クリーンアップ関数
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLeaderboard]) // fetchLeaderboardに依存

  return {
    leaderboard: state.leaderboard,
    playerRank: state.playerRank,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    lastUpdated: state.lastUpdated,
    refresh: fetchLeaderboard // 手動リフレッシュ用（デバッグ目的）
  }
}