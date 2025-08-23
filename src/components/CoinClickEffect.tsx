'use client'

import { useEffect, useState } from 'react'

interface ClickEffect {
  id: string
  x: number
  y: number
  value: number
}

interface CoinClickEffectProps {
  effects: ClickEffect[]
  onEffectComplete: (id: string) => void
}

export function CoinClickEffect({ effects, onEffectComplete }: CoinClickEffectProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {effects.map((effect) => (
        <ClickEffectItem
          key={effect.id}
          effect={effect}
          onComplete={() => onEffectComplete(effect.id)}
        />
      ))}
    </div>
  )
}

interface ClickEffectItemProps {
  effect: ClickEffect
  onComplete: () => void
}

function ClickEffectItem({ effect, onComplete }: ClickEffectItemProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete()
    }, 1000) // 1秒後に消える

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div
      className="absolute text-yellow-400 font-bold text-xl animate-bounce-up pointer-events-none"
      style={{
        left: effect.x - 20,
        top: effect.y - 30,
        transform: 'translate(-50%, -50%)',
      }}
    >
      +{effect.value}
    </div>
  )
}

// カスタムアニメーション用のCSS
export const clickEffectStyles = `
  @keyframes bounce-up {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -80px) scale(1.2);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -120px) scale(0.8);
    }
  }
  
  .animate-bounce-up {
    animation: bounce-up 1s ease-out forwards;
  }
`