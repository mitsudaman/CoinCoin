interface PrestigeButtonProps {
  canPrestige: boolean
  prestigePoints: number
  isLoading: boolean
  onPrestige: () => Promise<boolean>
  onPrestigeCompleted?: () => void
}

export default function PrestigeButton({ canPrestige, prestigePoints, isLoading, onPrestige, onPrestigeCompleted }: PrestigeButtonProps) {
  if (!canPrestige) return null

  const handlePrestige = async () => {
    if (isLoading) return

    const confirmed = window.confirm(
      `プレステージを実行しますか？\n\n獲得予定: ${prestigePoints}プレステージポイント\nリセット: 全コイン・施設\n\nこの操作は取り消せません。`
    )

    if (confirmed) {
      const success = await onPrestige()
      if (success) {
        alert(`プレステージ完了！\n${prestigePoints}ポイントを獲得しました！`)
        // プレステージ完了後の処理を親コンポーネントに通知
        onPrestigeCompleted?.()
      } else {
        alert('プレステージに失敗しました。')
      }
    }
  }

  return (
    <button
      onClick={handlePrestige}
      disabled={isLoading}
      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 
                 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-lg 
                 transition-all text-sm border-2 border-yellow-400 shadow-lg"
    >
      {isLoading ? (
        '転生中...'
      ) : (
        <>
          👑 プレステージ ({prestigePoints}P)
        </>
      )}
    </button>
  )
}