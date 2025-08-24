'use client'

import React, { useState, useEffect } from 'react'
import { Building } from '@/types/game'
import { INITIAL_BUILDINGS, getBuildingPrice, getBuildingCps, getClickValue, getUnlockRequirementText, getBuildingDisplayState } from '@/data/buildings'
import { GameService } from '@/lib/game-service'
import { DbPlayer } from '@/lib/supabase'
import { CoinClickEffect, clickEffectStyles } from '@/components/CoinClickEffect'
import { useAudio, usePurchaseSound } from '@/hooks/useAudio'
import { useGameTheme } from '@/hooks/useGameTheme'
import { usePrestige } from '@/hooks/usePrestige'
import { useRealtimeLeaderboard } from '@/hooks/useRealtimeLeaderboard'
import PrestigeButton from '@/components/PrestigeButton'
import PrestigeShop from '@/components/PrestigeShop'

export default function Home() {
  const [coins, setCoins] = useState(0)
  const [coinsPerSecond, setCoinsPerSecond] = useState(0)
  const [clickValue, setClickValue] = useState(1)
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS)
  
  // プレイヤー関連の状態
  const [player, setPlayer] = useState<DbPlayer | null>(null)
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showUsernameInput, setShowUsernameInput] = useState(true)
  const [saveMessage, setSaveMessage] = useState('')
  
  // ランキング関連の状態（リアルタイム購読）
  const realtimeLeaderboard = useRealtimeLeaderboard(player?.id)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  
  // エフェクト関連の状態
  const [clickEffects, setClickEffects] = useState<Array<{id: string, x: number, y: number, value: number}>>([])
  
  // 音声フック
  const clickSound = useAudio('/sounds/mixkit-money-bag-drop-1989.wav')
  const purchaseSound = usePurchaseSound()
  
  // シンプルなテーマシステム
  const { currentTheme, stageUpMessage } = useGameTheme()
  
  // プレステージシステム
  const prestige = usePrestige(player, coins)
  const [showPrestigeShop, setShowPrestigeShop] = useState(false)


  // コインクリック処理
  const handleCoinClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const totalClickValue = clickValue + prestige.prestigeEffect.clickBonus
    setCoins(prev => prev + totalClickValue)
    
    // クリック音を再生
    clickSound.play()
    
    // クリックエフェクトを追加（クリックした位置から）
    const newEffect = {
      id: Date.now().toString() + Math.random(),
      x: event.clientX, // クリックした位置のX座標
      y: event.clientY, // クリックした位置のY座標
      value: totalClickValue
    }
    
    setClickEffects(prev => [...prev, newEffect])
  }
  
  // エフェクト完了時の処理
  const handleEffectComplete = (id: string) => {
    setClickEffects(prev => prev.filter(effect => effect.id !== id))
  }

  // プレイヤー登録/ロード処理
  const handlePlayerLogin = async () => {
    if (!username.trim()) return

    setIsLoading(true)
    try {
      const playerData = await GameService.getOrCreatePlayer(username.trim())
      if (playerData) {
        setPlayer(playerData)
        setCoins(playerData.coins)
        
        // 建物データを復元
        const savedBuildings: Record<string, number> = { ...playerData.buildings }
        setBuildings(prev =>
          prev.map(building => ({
            ...building,
            owned: savedBuildings[building.id] || 0
          }))
        )
        
        setShowUsernameInput(false)
      }
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // プレステージ完了後の処理
  const handlePrestigeCompleted = async () => {
    console.log('🎯 handlePrestigeCompleted called')
    
    if (!player) return
    
    try {
      // ゲーム状態をリセット
      setCoins(0)
      setBuildings(INITIAL_BUILDINGS)
      setClickValue(1)
      setCoinsPerSecond(0)
      
      // プレイヤーデータを再取得してプレステージ情報を更新
      const updatedPlayerData = await GameService.getOrCreatePlayer(player.username)
      if (updatedPlayerData) {
        setPlayer(updatedPlayerData)
        console.log('🎯 Player data refreshed after prestige:', updatedPlayerData)
      }
      
      console.log('🎯 Game state reset completed')
    } catch (error) {
      console.error('🎯 Error in handlePrestigeCompleted:', error)
    }
  }

  // データ保存処理
  const handleSaveGame = async () => {
    if (!player) return

    setIsLoading(true)
    setSaveMessage('')
    
    try {
      const success = await GameService.saveGameData(player.id, coins, buildings)
      if (success) {
        setSaveMessage('保存完了！')
        setTimeout(() => setSaveMessage(''), 2000)
        // リアルタイム購読により自動でランキング更新される
      } else {
        setSaveMessage('保存に失敗しました')
      }
    } catch (error) {
      console.error('Save failed:', error)
      setSaveMessage('保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 施設購入処理
  const handleBuyBuilding = async (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId)
    if (!building) return

    const price = getBuildingPrice(building, prestige.prestigeEffect.priceDiscount)
    if (coins >= price) {
      setCoins(prev => prev - price)
      setBuildings(prev => 
        prev.map(b => 
          b.id === buildingId 
            ? { ...b, owned: b.owned + 1 }
            : b
        )
      )

      // 購入音を再生
      purchaseSound.play()

      // 施設購入時は自動保存
      if (player) {
        const updatedBuildings = buildings.map(b => 
          b.id === buildingId 
            ? { ...b, owned: b.owned + 1 }
            : b
        )
        await GameService.saveGameData(player.id, coins - price, updatedBuildings)
      }
    }
  }

  // 毎秒コイン生成量とクリック値を計算
  useEffect(() => {
    const totalCps = buildings.reduce((sum, building) => {
      return sum + getBuildingCps(building, prestige.prestigeEffect.productionMultiplier)
    }, 0)
    setCoinsPerSecond(totalCps)
    
    // クリック値を動的に計算
    const currentClickValue = getClickValue(buildings)
    setClickValue(currentClickValue)
  }, [buildings, prestige.prestigeEffect.productionMultiplier])

  // 自動生成処理（毎秒実行）
  useEffect(() => {
    if (coinsPerSecond > 0) {
      const interval = setInterval(() => {
        setCoins(prev => prev + coinsPerSecond)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [coinsPerSecond])


  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="game-container bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600" style={{color: 'var(--text-primary)'}}>
      {/* カスタムアニメーション用のスタイル */}
      <style dangerouslySetInnerHTML={{ __html: clickEffectStyles }} />
      
      {/* クリックエフェクト */}
      <CoinClickEffect effects={clickEffects} onEffectComplete={handleEffectComplete} />
      
      {/* ユーザー名入力画面 */}
      {showUsernameInput && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel-strong p-8 max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💰</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                CoinCoin へようこそ！
              </h2>
              <p className="text-gray-300 text-lg">
                ユーザー名を入力してゲームを開始しましょう
              </p>
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名を入力"
              className="w-full px-4 py-4 bg-black/30 border-2 border-yellow-500/30 rounded-xl 
                       text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none
                       focus:ring-2 focus:ring-yellow-400/20 transition-all text-lg backdrop-blur-sm"
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && handlePlayerLogin()}
            />
            <button
              onClick={handlePlayerLogin}
              disabled={!username.trim() || isLoading}
              className="w-full mt-6 button-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '🔄 読み込み中...' : '🎮 ゲーム開始'}
            </button>
            
            {/* 音声設定 */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={clickSound.toggleSound}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  clickSound.isEnabled 
                    ? 'bg-green-600 hover:bg-green-500 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                } transform hover:scale-105`}
              >
                {clickSound.isEnabled ? '🔊 音声 ON' : '🔇 音声 OFF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー - スコア表示 */}
      <header className="text-center px-6 py-8">
        <div className="mb-6">
          <h1 className="text-5xl font-black text-black mb-3" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>
            CoinCoin
          </h1>
          {player && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/20 rounded-full backdrop-blur-sm border border-black/30">
              <span className="text-black font-semibold">👤</span>
              <span className="text-black font-medium">{player.username}</span>
            </div>
          )}
        </div>
        <div className="glass-panel p-6 mb-4 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl">💰</span>
            <span className="text-3xl font-bold text-black">
              {Math.floor(coins).toLocaleString()}
            </span>
            <span className="text-xl text-black">コイン</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-lg">
            <span className="text-black">⚡</span>
            <span className="text-black font-semibold">
              {coinsPerSecond.toFixed(1)} コイン/秒
            </span>
          </div>
        </div>
        
        {/* アクションボタン群 */}
        {player && (
          <div className="flex justify-center items-center gap-3 flex-wrap px-4">
            <button
              onClick={handleSaveGame}
              disabled={isLoading}
              className="button-secondary text-sm px-4 py-2 disabled:opacity-50"
            >
              {isLoading ? '🔄 保存中...' : '💾 保存'}
            </button>
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="button-secondary text-sm px-4 py-2 relative"
            >
              🏆 ランキング
              {realtimeLeaderboard.isConnected && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
              )}
            </button>
            <PrestigeButton
              canPrestige={prestige.canPrestigeNow}
              prestigePoints={prestige.prestigePoints}
              isLoading={prestige.isLoading}
              onPrestige={prestige.executePrestige}
              onPrestigeCompleted={handlePrestigeCompleted}
            />
            {prestige.prestigeData.prestigePoints > 0 && (
              <button
                onClick={() => setShowPrestigeShop(true)}
                className="button-prestige text-sm px-4 py-2 relative"
              >
                <span className="flex items-center gap-1">
                  🛒 ショップ
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                    {prestige.prestigeData.prestigePoints}P
                  </span>
                </span>
              </button>
            )}
            {saveMessage && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                saveMessage.includes('完了') 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {saveMessage.includes('完了') ? '✓ ' : '⚠ '}{saveMessage}
              </div>
            )}
            {realtimeLeaderboard.playerRank > 0 && (
              <div className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-medium border border-yellow-500/30">
                🏅 {realtimeLeaderboard.playerRank}位
              </div>
            )}
          </div>
        )}
      </header>

      {/* ランキング表示 */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40" onClick={() => setShowLeaderboard(false)}>
          <div className="bg-gradient-to-br from-blue-800 to-purple-800 p-6 rounded-2xl border border-yellow-500 max-w-md mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-yellow-400">
                🏆 ランキング
              </h2>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            
            {realtimeLeaderboard.isLoading ? (
              <div className="text-center py-8 text-gray-400">
                <p>ランキングを読み込み中...</p>
              </div>
            ) : realtimeLeaderboard.leaderboard.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>ランキングデータがありません</p>
                <p className="text-sm mt-2">保存ボタンを押してデータを保存しましょう！</p>
              </div>
            ) : (
              <div className="space-y-2">
                {realtimeLeaderboard.leaderboard.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index < 3 
                        ? 'bg-yellow-600/20 border border-yellow-500/30' 
                        : 'bg-black/20 border border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-lg ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-300' :
                        index === 2 ? 'text-orange-400' :
                        'text-gray-400'
                      }`}>
                        {index === 0 ? '🥇' : 
                         index === 1 ? '🥈' : 
                         index === 2 ? '🥉' : 
                         `${index + 1}位`}
                      </span>
                      <span className="text-white font-semibold">
                        {player.username}
                      </span>
                    </div>
                    <span className="text-yellow-300 font-bold">
                      {player.coins.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm">
                <div className={`flex items-center gap-1 ${
                  realtimeLeaderboard.isConnected ? 'text-green-400' : 'text-red-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    realtimeLeaderboard.isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`}></span>
                  {realtimeLeaderboard.isConnected ? 'リアルタイム接続中' : '接続エラー'}
                </div>
                {realtimeLeaderboard.lastUpdated && (
                  <span className="text-gray-400">
                    最終更新: {realtimeLeaderboard.lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* メインゲームエリア */}
      <main className="w-full px-6 py-4 space-y-6">
        {/* メインコイン */}
        <div className="flex justify-center">
          <button
            onClick={handleCoinClick}
            className="relative group cursor-pointer select-none"
          >
            <div className={`w-[40vw] max-w-[192px] min-w-[120px] aspect-square bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full 
                          shadow-2xl transform transition-all duration-200 ease-out
                          group-hover:scale-105 group-active:scale-95 
                          border-8 border-yellow-300
                          flex items-center justify-center relative overflow-hidden ${currentTheme.coinClass}`}>
              {/* コイン中央の模様 */}
              <div className="text-[clamp(2.5rem,6vw,4rem)] font-black text-yellow-900 drop-shadow-lg relative z-10">¥</div>
              
              {/* グラデーションオーバーレイ */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-200/40 via-transparent to-yellow-200/40"></div>
              
              {/* 光エフェクト */}
              <div className="absolute top-4 left-4 w-8 h-8 bg-white/60 rounded-full blur-md"></div>
              <div className="absolute top-6 left-6 w-4 h-4 bg-white/80 rounded-full blur-sm"></div>
            </div>
            
            {/* ホバーエフェクト */}
            <div className="absolute inset-0 rounded-full bg-yellow-300/20 
                          transform scale-0 group-hover:scale-110 
                          transition-transform duration-300 ease-out pointer-events-none"></div>
            
            {/* クリック時のリップル効果 */}
            <div className="absolute inset-0 rounded-full bg-yellow-400/40 
                          transform scale-0 group-active:scale-125 
                          transition-transform duration-150 ease-out pointer-events-none"></div>
          </button>
        </div>

        {/* ゲーム統計 */}
        <div className="bg-white/50 backdrop-blur-lg border border-black/10 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📊</span>
            <h2 className="text-xl font-bold text-black">統計</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between items-center py-3 px-4 bg-white/70 backdrop-blur-md border border-black/20 rounded-lg">
              <span className="font-medium flex items-center gap-2 text-black">
                <span>💆</span> クリック値
              </span>
              <span className="text-black font-bold">{clickValue + prestige.prestigeEffect.clickBonus} コイン</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-white/70 backdrop-blur-md border border-black/20 rounded-lg">
              <span className="font-medium flex items-center gap-2 text-black">
                <span>💰</span> 総コイン数
              </span>
              <span className="text-black font-bold">{Math.floor(coins).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-white/70 backdrop-blur-md border border-black/20 rounded-lg">
              <span className="font-medium flex items-center gap-2 text-black">
                <span>⚡</span> 毎秒獲得
              </span>
              <span className="text-black font-bold">{coinsPerSecond.toFixed(1)}</span>
            </div>
            {prestige.prestigeData.prestigePoints > 0 && (
              <>
                <div className="border-t border-white/20 mt-4 pt-4">
                  <div className="text-sm text-purple-600 font-bold mb-3 flex items-center gap-2">
                    <span>✨</span> プレステージ効果
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between items-center py-1 px-3 bg-white/70 backdrop-blur-md border border-black/20 rounded">
                      <span>クリックボーナス:</span>
                      <span className="text-purple-600 font-semibold">+{prestige.prestigeEffect.clickBonus}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 px-3 bg-white/70 backdrop-blur-md border border-black/20 rounded">
                      <span>生産効率:</span>
                      <span className="text-purple-600 font-semibold">{(prestige.prestigeEffect.productionMultiplier * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center py-1 px-3 bg-white/70 backdrop-blur-md border border-black/20 rounded">
                      <span>価格割引:</span>
                      <span className="text-purple-300 font-semibold">{(prestige.prestigeEffect.priceDiscount * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 施設セクション */}
        <div className="bg-white/50 backdrop-blur-lg border border-black/10 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🏭</span>
            <h2 className="text-xl font-bold text-black">施設</h2>
          </div>
          <div className="space-y-4">
            {buildings.map((building) => {
              const price = getBuildingPrice(building, prestige.prestigeEffect.priceDiscount)
              const cps = getBuildingCps(building, prestige.prestigeEffect.productionMultiplier)
              const canAfford = coins >= price
              const displayState = getBuildingDisplayState(building, buildings)
              const unlockText = getUnlockRequirementText(building, buildings)
              
              return (
                <React.Fragment key={building.id}>
                  <div
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      displayState === 'unlocked'
                        ? canAfford 
                          ? building.clickValue 
                            ? 'border-yellow-400/50 bg-white/60 hover:bg-white/75 hover:border-yellow-400/70 hover:shadow-lg hover:shadow-yellow-400/20'
                            : 'border-yellow-400/50 bg-white/70 hover:bg-white/80 hover:border-yellow-400/70 hover:shadow-lg hover:shadow-yellow-400/20'
                          : 'border-gray-400/50 bg-white/50'
                        : displayState === 'next'
                        ? 'border-yellow-600/40 bg-white/40 opacity-80'
                        : 'border-gray-400/40 bg-gray-200/80 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">
                            {displayState === 'silhouette' ? '❓' : building.icon}
                          </span>
                          <span className={`font-bold ${
                            displayState === 'unlocked' ? 'text-black' :
                            displayState === 'next' ? 'text-gray-700' : 'text-gray-400'
                          }`}>
                            {displayState === 'silhouette' ? '???????' : building.name}
                          </span>
                          {building.owned > 0 && (
                            <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full font-bold">
                              {building.owned}
                            </span>
                          )}
                        </div>
                        <div className={`text-sm mb-1 ${
                          displayState === 'unlocked' ? 'text-gray-700' :
                          displayState === 'next' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {displayState === 'unlocked' 
                            ? building.description 
                            : displayState === 'next'
                            ? unlockText
                            : building.description
                          }
                        </div>
                        {(displayState === 'unlocked' || displayState === 'next') && (
                          <div className="text-xs text-gray-600 font-medium">
                            {building.clickValue ? (
                              <>
                                +{building.clickValue} クリック報酬
                                {building.owned > 0 && (
                                  <span className="ml-2">
                                    (現在: +{building.clickValue * building.owned} クリック報酬)
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                {building.baseCps} コイン/秒
                                {building.owned > 0 && (
                                  <span className="ml-2">
                                    (現在: {cps.toFixed(1)} コイン/秒)
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => displayState === 'unlocked' && handleBuyBuilding(building.id)}
                        disabled={displayState !== 'unlocked' || !canAfford}
                        className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 transform ${
                          displayState === 'silhouette'
                            ? 'bg-gray-500/70 text-gray-700 cursor-not-allowed'
                            : displayState === 'next'
                            ? 'bg-amber-700/70 text-amber-200 cursor-not-allowed'
                            : canAfford
                            ? 'button-primary hover:scale-105 active:scale-95'
                            : 'bg-gray-500/70 text-gray-700 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-xs opacity-70">購入</span>
                          <span className="text-sm font-black">
                            {displayState === 'silhouette' ? '???' : price.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {/* 所有施設アイコン表示 */}
                  {building.owned > 0 && building.baseCps > 0 && (
                    <div className="mt-3 p-4 bg-white/70 backdrop-blur-md border border-black/20 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-black">所有中:</span>
                          <span className="px-2 py-1 bg-white/80 border border-black/20 rounded text-xs font-bold text-black">{building.owned}個</span>
                        </div>
                        <span className="text-xs text-gray-600">
                          生産中: {cps.toFixed(1)} コイン/秒
                        </span>
                      </div>
                      <div className="grid grid-cols-8 gap-2">
                        {Array.from({ length: Math.min(building.owned, 24) }, (_, index) => (
                          <div 
                            key={`${building.id}-icon-${index}`}
                            className="text-xl flex items-center justify-center p-1 bg-white/70 border border-black/10 rounded hover:bg-white/80 transition-colors cursor-pointer"
                            title={`${building.name} #${index + 1}`}
                          >
                            {building.icon}
                          </div>
                        ))}
                        {building.owned > 24 && (
                          <div className="flex items-center justify-center p-1 bg-white/80 border border-black/20 rounded text-xs font-bold text-black">
                            +{building.owned - 24}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </main>

      {/* プレステージショップ */}
      {showPrestigeShop && (
        <PrestigeShop
          prestigeData={prestige.prestigeData}
          prestigeEffect={prestige.prestigeEffect}
          isLoading={prestige.isLoading}
          onBuyItem={prestige.buyPrestigeItem}
          onClose={() => setShowPrestigeShop(false)}
        />
      )}
      </div>
    </div>
  )
}