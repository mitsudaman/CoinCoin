'use client'

import React, { useState, useEffect } from 'react'
import { Building } from '@/types/game'
import { INITIAL_BUILDINGS, getBuildingPrice, getBuildingCps, getClickValue, isBuildingUnlocked, getUnlockRequirementText, getBuildingDisplayState } from '@/data/buildings'
import { GameService } from '@/lib/game-service'
import { DbPlayer } from '@/lib/supabase'
import { CoinClickEffect, clickEffectStyles } from '@/components/CoinClickEffect'
import { useAudio, usePurchaseSound } from '@/hooks/useAudio'
import { useGameTheme } from '@/hooks/useGameTheme'

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
  
  // ランキング関連の状態
  const [leaderboard, setLeaderboard] = useState<DbPlayer[]>([])
  const [playerRank, setPlayerRank] = useState<number>(-1)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  
  // エフェクト関連の状態
  const [clickEffects, setClickEffects] = useState<Array<{id: string, x: number, y: number, value: number}>>([])
  
  // 音声フック
  const clickSound = useAudio('/sounds/mixkit-money-bag-drop-1989.wav')
  const purchaseSound = usePurchaseSound()
  
  // テーマシステム（毎秒獲得数ベース）
  const { currentTheme, stageUpMessage } = useGameTheme(coinsPerSecond)

  // コインクリック処理
  const handleCoinClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCoins(prev => prev + clickValue)
    
    // クリック音を再生
    clickSound.play()
    
    // クリックエフェクトを追加（クリックした位置から）
    const newEffect = {
      id: Date.now().toString() + Math.random(),
      x: event.clientX, // クリックした位置のX座標
      y: event.clientY, // クリックした位置のY座標
      value: clickValue
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
        const savedBuildings = { ...playerData.buildings }
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
        // 保存成功時にランキングも更新
        await loadLeaderboard()
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

  // ランキングデータ読み込み
  const loadLeaderboard = async () => {
    try {
      const data = await GameService.getLeaderboard()
      setLeaderboard(data)
      
      // プレイヤーの順位も取得
      if (player) {
        const rank = await GameService.getPlayerRank(player.id)
        setPlayerRank(rank)
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    }
  }

  // 施設購入処理
  const handleBuyBuilding = async (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId)
    if (!building) return

    const price = getBuildingPrice(building)
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
      return sum + getBuildingCps(building)
    }, 0)
    setCoinsPerSecond(totalCps)
    
    // クリック値を動的に計算
    const currentClickValue = getClickValue(buildings)
    setClickValue(currentClickValue)
  }, [buildings])

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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 text-white">
      {/* カスタムアニメーション用のスタイル */}
      <style dangerouslySetInnerHTML={{ __html: clickEffectStyles }} />
      
      {/* クリックエフェクト */}
      <CoinClickEffect effects={clickEffects} onEffectComplete={handleEffectComplete} />
      
      {/* ステージアップメッセージ */}
      {stageUpMessage && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-6 py-3 rounded-full shadow-2xl text-xl">
            {stageUpMessage}
          </div>
        </div>
      )}
      {/* ユーザー名入力画面 */}
      {showUsernameInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-blue-800 to-purple-800 p-8 rounded-2xl border border-yellow-500 max-w-md mx-4">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
              CoinCoin へようこそ！
            </h2>
            <p className="text-gray-300 mb-6 text-center">
              ユーザー名を入力してゲームを開始しましょう
            </p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名を入力"
              className="w-full px-4 py-3 bg-black/20 border border-yellow-500/50 rounded-lg 
                       text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
              maxLength={20}
              onKeyPress={(e) => e.key === 'Enter' && handlePlayerLogin()}
            />
            <button
              onClick={handlePlayerLogin}
              disabled={!username.trim() || isLoading}
              className="w-full mt-4 py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600
                       text-white font-bold rounded-lg transition-colors"
            >
              {isLoading ? '読み込み中...' : 'ゲーム開始'}
            </button>
            
            {/* 音声設定 */}
            <div className="mt-4 flex justify-center gap-4 text-sm">
              <button
                onClick={clickSound.toggleSound}
                className={`px-3 py-1 rounded ${
                  clickSound.isEnabled ? 'bg-green-600' : 'bg-gray-600'
                } text-white transition-colors`}
              >
                🔊 {clickSound.isEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー - スコア表示 */}
      <header className="text-center py-6">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">CoinCoin</h1>
        {player && (
          <p className="text-yellow-300 mb-2">プレイヤー: {player.username}</p>
        )}
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            💰 {Math.floor(coins).toLocaleString()} コイン
          </div>
          <div className="text-lg text-yellow-300">
            ⚡ {coinsPerSecond.toFixed(1)} コイン/秒
          </div>
        </div>
        
        {/* 保存ボタンとランキングボタン */}
        {player && (
          <div className="mt-4 flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={handleSaveGame}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600
                       text-white font-bold rounded-lg transition-colors text-sm"
            >
              {isLoading ? '保存中...' : '💾 保存'}
            </button>
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500
                       text-white font-bold rounded-lg transition-colors text-sm"
            >
              🏆 ランキング
            </button>
            <button
              onClick={loadLeaderboard}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500
                       text-white font-bold rounded-lg transition-colors text-sm"
            >
              🔄 更新
            </button>
            {saveMessage && (
              <span className={`text-sm ${
                saveMessage.includes('完了') ? 'text-green-400' : 'text-red-400'
              }`}>
                {saveMessage}
              </span>
            )}
            {playerRank > 0 && (
              <span className="text-sm text-yellow-300">
                あなたの順位: {playerRank}位
              </span>
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
            
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>ランキングデータがありません</p>
                <p className="text-sm mt-2">保存ボタンを押してデータを保存しましょう！</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((player, index) => (
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
              <button
                onClick={loadLeaderboard}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
              >
                🔄 最新データに更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* メインゲームエリア */}
      <main className="container mx-auto px-4 max-w-md">
        {/* メインコイン */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleCoinClick}
            className="relative group"
          >
            <div className={`w-48 h-48 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full 
                          shadow-2xl transform transition-all duration-150 
                          group-hover:scale-105 group-active:scale-95 
                          border-8 border-yellow-500
                          flex items-center justify-center ${currentTheme.coinClass}`}>
              {/* コイン中央の模様 */}
              <div className="text-6xl font-bold text-yellow-800">¥</div>
              
              {/* 光エフェクト */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent 
                            transform rotate-45"></div>
            </div>
            
            {/* クリック時のリップル効果 */}
            <div className="absolute inset-0 rounded-full bg-yellow-400/30 
                          transform scale-0 group-active:scale-110 
                          transition-transform duration-200"></div>
          </button>
        </div>

        {/* ゲーム統計 */}
        <div className="bg-black/20 rounded-lg p-4 mb-6 backdrop-blur-sm border border-white/10">
          <h2 className="text-xl font-bold text-yellow-400 mb-2">統計</h2>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span>クリック値:</span>
              <span className="text-yellow-300">{clickValue} コイン</span>
            </div>
            <div className="flex justify-between">
              <span>総コイン数:</span>
              <span className="text-yellow-300">{Math.floor(coins).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>毎秒獲得:</span>
              <span className="text-yellow-300">{coinsPerSecond.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* 施設セクション */}
        <div className="bg-black/20 rounded-lg p-4 backdrop-blur-sm border border-white/10">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">施設</h2>
          <div className="space-y-3">
            {buildings.map((building) => {
              const price = getBuildingPrice(building)
              const cps = getBuildingCps(building)
              const canAfford = coins >= price
              const displayState = getBuildingDisplayState(building, buildings)
              const unlockText = getUnlockRequirementText(building, buildings)
              
              return (
                <React.Fragment key={building.id}>
                  <div
                    className={`p-3 rounded-lg border transition-all ${
                      displayState === 'unlocked'
                        ? canAfford 
                          ? 'border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20' 
                          : 'border-gray-600 bg-gray-800/50'
                        : displayState === 'next'
                        ? 'border-yellow-700 bg-yellow-900/20 opacity-75'
                        : 'border-gray-700 bg-gray-900/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">
                            {displayState === 'silhouette' ? '❓' : building.icon}
                          </span>
                          <span className={`font-bold ${
                            displayState === 'unlocked' ? 'text-white' :
                            displayState === 'next' ? 'text-yellow-200' : 'text-gray-400'
                          }`}>
                            {displayState === 'silhouette' ? '???????' : building.name}
                          </span>
                          {building.owned > 0 && (
                            <span className="px-2 py-1 bg-yellow-600 text-xs rounded-full">
                              {building.owned}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-300 mb-1">
                          {displayState === 'unlocked' 
                            ? building.description 
                            : displayState === 'next'
                            ? unlockText
                            : building.description
                          }
                        </div>
                        {(displayState === 'unlocked' || displayState === 'next') && (
                          <div className="text-xs text-yellow-300">
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
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${
                          displayState === 'silhouette'
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : displayState === 'next'
                            ? 'bg-yellow-800 text-yellow-300 cursor-not-allowed'
                            : canAfford
                            ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {displayState === 'silhouette' ? '???' : price.toLocaleString()}
                      </button>
                    </div>
                  </div>
                  
                  {/* Cookie Clickerスタイル: 所有施設アイコン表示（クリック強化装置以外） */}
                  {building.owned > 0 && building.baseCps > 0 && (
                    <div className="mt-2 ml-4 p-3 bg-gradient-to-r from-black/10 to-transparent rounded-lg border-l-2 border-yellow-500/30">
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: building.owned }, (_, index) => (
                          <div 
                            key={`${building.id}-icon-${index}`}
                            className="text-xl owned-building-icon animate-fadeIn cursor-pointer"
                            title={`${building.name} #${index + 1}`}
                          >
                            {building.icon}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}