export const useGameTheme = () => {
  // シンプルな固定テーマのみ返す
  return {
    currentTheme: {
      stage: 1 as const,
      name: '標準',
      coinThreshold: 0,
      backgroundClass: '',
      coinClass: 'coin-basic',
      panelClass: ''
    },
    stageUpMessage: ''
  }
}