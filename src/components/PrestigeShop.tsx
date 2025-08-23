import { PrestigeData, PrestigeEffect, PRESTIGE_ITEMS } from '@/types/prestige'
import { useState } from 'react'

interface PrestigeShopProps {
  prestigeData: PrestigeData
  prestigeEffect: PrestigeEffect
  isLoading: boolean
  onBuyItem: (itemType: string) => Promise<boolean>
  onClose: () => void
}

export default function PrestigeShop({ prestigeData, prestigeEffect, isLoading, onBuyItem, onClose }: PrestigeShopProps) {
  // カート状態（各アイテムタイプの購入予定数）
  const [cart, setCart] = useState<Record<string, number>>({
    click_power: 0,
    production_boost: 0,
    price_reduction: 0
  })

  // カート内のアイテムをカウントアップ
  const addToCart = (itemType: string) => {
    setCart(prev => ({
      ...prev,
      [itemType]: prev[itemType] + 1
    }))
  }

  // カート内のアイテムをカウントダウン
  const removeFromCart = (itemType: string) => {
    setCart(prev => ({
      ...prev,
      [itemType]: Math.max(0, prev[itemType] - 1)
    }))
  }

  // カート内の総コスト計算
  const totalCost = PRESTIGE_ITEMS.reduce((sum, item) => {
    return sum + (item.cost * cart[item.id])
  }, 0)

  // カートが空かどうか
  const isCartEmpty = Object.values(cart).every(count => count === 0)

  // 購入可能かどうか
  const canAffordCart = prestigeData.prestigePoints >= totalCost

  // 実際の購入処理
  const handlePurchase = async () => {
    if (isLoading || isCartEmpty || !canAffordCart) return

    try {
      // カート内の各アイテムを順番に購入
      for (const [itemType, count] of Object.entries(cart)) {
        for (let i = 0; i < count; i++) {
          const success = await onBuyItem(itemType)
          if (!success) {
            alert(`${itemType} の購入に失敗しました。`)
            return
          }
        }
      }
      
      // 購入成功時はモーダルを閉じる
      onClose()
    } catch {
      alert('購入処理でエラーが発生しました。')
    }
  }

  const getOwnedCount = (itemType: string): number => {
    switch (itemType) {
      case 'click_power':
        return prestigeData.clickPowerItems
      case 'production_boost':
        return prestigeData.productionBoostItems
      case 'price_reduction':
        return prestigeData.priceReductionItems
      default:
        return 0
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-purple-800 to-pink-800 p-6 rounded-2xl border-2 border-yellow-500 max-w-md mx-4 max-h-[80vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-yellow-400">
            👑 プレステージショップ
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* 現在のポイント表示 */}
        <div className="mb-4 p-3 bg-black/20 rounded-lg">
          <div className="text-center text-lg font-bold text-yellow-400">
            💎 {prestigeData.prestigePoints} ポイント
          </div>
        </div>

        {/* 現在の効果表示 */}
        <div className="mb-4 p-3 bg-black/20 rounded-lg">
          <h3 className="text-lg font-bold text-green-400 mb-2">📊 現在の効果</h3>
          <div className="text-sm space-y-1">
            <div>クリックボーナス: +{prestigeEffect.clickBonus} コイン</div>
            <div>生産効率: {(prestigeEffect.productionMultiplier * 100).toFixed(0)}%</div>
            <div>価格割引: {(prestigeEffect.priceDiscount * 100).toFixed(0)}%</div>
          </div>
        </div>

        {/* アイテム一覧 */}
        <div className="space-y-3">
          {PRESTIGE_ITEMS.map((item) => {
            const owned = getOwnedCount(item.id)
            const canAfford = prestigeData.prestigePoints >= item.cost

            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition-all ${
                  canAfford
                    ? 'border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20'
                    : 'border-gray-600 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="font-bold text-white">{item.name}</span>
                      {owned > 0 && (
                        <span className="px-2 py-1 bg-purple-600 text-xs rounded-full">
                          {owned}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300 mb-1">
                      {item.description}
                    </div>
                    <div className="text-xs text-yellow-300">
                      {item.effect}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-400">{item.cost}P</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        disabled={cart[item.id] === 0}
                        className="w-8 h-8 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 
                                 text-white font-bold rounded transition-colors disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-white font-bold">
                        {cart[item.id]}
                      </span>
                      <button
                        onClick={() => addToCart(item.id)}
                        disabled={totalCost + item.cost > prestigeData.prestigePoints}
                        className="w-8 h-8 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 
                                 text-white font-bold rounded transition-colors disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* カート情報と購入ボタン */}
        <div className="mt-4">
          {!isCartEmpty && (
            <div className="mb-4 p-3 bg-black/30 rounded-lg">
              <div className="text-sm text-green-400 font-bold mb-2">📋 購入予定</div>
              <div className="text-xs space-y-1">
                {Object.entries(cart).map(([itemType, count]) => {
                  if (count === 0) return null
                  const item = PRESTIGE_ITEMS.find(i => i.id === itemType)
                  return (
                    <div key={itemType} className="flex justify-between text-gray-300">
                      <span>{item?.name} × {count}</span>
                      <span>{item ? item.cost * count : 0}P</span>
                    </div>
                  )
                })}
                <hr className="border-gray-600 my-2" />
                <div className="flex justify-between text-yellow-300 font-bold">
                  <span>合計</span>
                  <span>{totalCost}P</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors"
            >
              閉じる
            </button>
            <button
              onClick={handlePurchase}
              disabled={isCartEmpty || !canAffordCart || isLoading}
              className={`flex-1 px-4 py-2 font-bold rounded-lg transition-colors ${
                !isCartEmpty && canAffordCart && !isLoading
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? '購入中...' : '購入実行'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}