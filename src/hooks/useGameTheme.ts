import { useState, useEffect } from 'react'
import { GameTheme, UI_THEMES } from '@/types/theme'

export const getCurrentTheme = (coinsPerSecond: number): GameTheme => {
  // 高い毎秒獲得数から順番にチェック（降順）
  return [...UI_THEMES]
    .reverse()
    .find(theme => coinsPerSecond >= theme.coinThreshold) || UI_THEMES[0]
}

export const useGameTheme = (coinsPerSecond: number) => {
  const [currentTheme, setCurrentTheme] = useState<GameTheme>(UI_THEMES[0])
  const [stageUpMessage, setStageUpMessage] = useState<string>('')

  useEffect(() => {
    const newTheme = getCurrentTheme(coinsPerSecond)
    if (newTheme.stage !== currentTheme.stage) {
      setCurrentTheme(newTheme)
      
      // ステージアップメッセージ表示
      if (newTheme.stage > currentTheme.stage) {
        const messages = {
          2: '🏭 生産ライン構築！',
          3: '💰 大規模生産達成！', 
          4: '👑 産業帝国完成！'
        }
        setStageUpMessage(messages[newTheme.stage as keyof typeof messages] || '')
        
        // 3秒後にメッセージを消す
        setTimeout(() => setStageUpMessage(''), 3000)
      }
    }
  }, [coinsPerSecond, currentTheme.stage])

  return { currentTheme, stageUpMessage }
}