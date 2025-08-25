'use client'

import { useRef, useCallback, useEffect, useState } from 'react'

interface UseAudioReturn {
  play: () => void
  isEnabled: boolean
  toggleSound: () => void
}

export function useAudio(audioSrc: string, volume: number = 0.3): UseAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isEnabled, setIsEnabled] = useState(true)

  useEffect(() => {
    // Web Audio APIで簡単な音を生成（fallback用）
    if (audioSrc === 'click') {
      // ブラウザサポートチェック
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext
      if (!AudioContext) return

      audioRef.current = new Audio()
      return
    }

    // 音声ファイル読み込み
    if (audioSrc && audioSrc.startsWith('/sounds/')) {
      audioRef.current = new Audio(audioSrc)
      audioRef.current.volume = volume
      audioRef.current.preload = 'auto'
      
      // 読み込みエラー時のハンドリング
      audioRef.current.onerror = () => {
        // Failed to load audio
        audioRef.current = null
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [audioSrc, volume])

  const play = useCallback(() => {
    if (!isEnabled) return

    if (audioRef.current && audioSrc.startsWith('/sounds/')) {
      // 音声ファイル再生
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // 再生失敗時はWeb Audio APIにfallback
        if (audioSrc.includes('money-bag-drop')) {
          playClickSound()
        }
      })
    } else if (audioSrc === 'click') {
      // Web Audio APIでクリック音を生成（fallback）
      playClickSound()
    }
  }, [audioSrc, isEnabled])

  const toggleSound = useCallback(() => {
    setIsEnabled(prev => !prev)
  }, [])

  return { play, isEnabled, toggleSound }
}

// Web Audio APIでコインらしいクリック音を生成
function playClickSound() {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext
    if (!AudioContext) return

    const audioContext = new AudioContext()
    
    // コインの「チャリン」音を作成（複数の音の合成）
    createCoinSound(audioContext, 0)
    
    // 少し遅れて第2の音（エコー効果）
    setTimeout(() => {
      createCoinSound(audioContext, 0.05)
    }, 50)
    
  } catch {
    // Audio not supported
  }
}

// リアルなコイン音を作成（改良版）
function createCoinSound(audioContext: AudioContext, delay: number = 0) {
  const now = audioContext.currentTime + delay
  
  // 【パート1: 瞬間的な金属衝突音「チン」】
  const impact = audioContext.createOscillator()
  const impactGain = audioContext.createGain()
  const impactFilter = audioContext.createBiquadFilter()
  
  impact.type = 'square' // より鋭い音
  impact.connect(impactFilter)
  impactFilter.connect(impactGain)
  impactGain.connect(audioContext.destination)
  
  impact.frequency.setValueAtTime(3000, now)
  impact.frequency.exponentialRampToValueAtTime(1500, now + 0.02)
  
  impactFilter.type = 'highpass'
  impactFilter.frequency.value = 800
  
  impactGain.gain.setValueAtTime(0.15, now)
  impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
  
  impact.start(now)
  impact.stop(now + 0.03)
  
  // 【パート2: 金属共鳴音「チャ」- 複数の倍音】
  const harmonics = [800, 1200, 1600, 2400] // 倍音系列
  
  harmonics.forEach((freq, index) => {
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()
    
    osc.type = 'sawtooth' // 倍音豊富な波形
    osc.connect(gain)
    gain.connect(audioContext.destination)
    
    const startTime = now + 0.01 + index * 0.005
    const duration = 0.15 - index * 0.02
    
    osc.frequency.setValueAtTime(freq, startTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, startTime + duration)
    
    const volume = 0.08 / (index + 1) // 上位倍音ほど小さく
    gain.gain.setValueAtTime(volume, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
    
    osc.start(startTime)
    osc.stop(startTime + duration)
  })
  
  // 【パート3: 低音の「リン」】
  const resonance = audioContext.createOscillator()
  const resonanceGain = audioContext.createGain()
  
  resonance.type = 'sine'
  resonance.connect(resonanceGain)
  resonanceGain.connect(audioContext.destination)
  
  resonance.frequency.setValueAtTime(150, now + 0.02)
  resonance.frequency.exponentialRampToValueAtTime(100, now + 0.25)
  
  resonanceGain.gain.setValueAtTime(0.06, now + 0.02)
  resonanceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
  
  resonance.start(now + 0.02)
  resonance.stop(now + 0.3)
  
  // 【パート4: 金属的ノイズ「ザッ」】
  const noiseLength = 0.08
  const bufferSize = audioContext.sampleRate * noiseLength
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const data = buffer.getChannelData(0)
  
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize
    // 減衰するメタリックノイズ
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.2 * 
              (1 + Math.sin(t * Math.PI * 50)) // 高周波変調
  }
  
  const noise = audioContext.createBufferSource()
  const noiseGain = audioContext.createGain()
  const noiseFilter = audioContext.createBiquadFilter()
  
  noise.buffer = buffer
  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(audioContext.destination)
  
  noiseFilter.type = 'highpass'
  noiseFilter.frequency.value = 1000
  noiseFilter.Q.value = 2
  
  noiseGain.gain.setValueAtTime(0.04, now + 0.01)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01 + noiseLength)
  
  noise.start(now + 0.01)
  noise.stop(now + 0.01 + noiseLength)
}

// 購入音用のフック
export function usePurchaseSound(): UseAudioReturn {
  return useAudio('/sounds/mixkit-gold-coin-prize-1999.wav', 0.4)
}

