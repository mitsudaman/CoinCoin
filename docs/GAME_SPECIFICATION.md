# CoinCoin ゲーム仕様書

## ゲーム概要

**プロジェクト名**: CoinCoin  
**ジャンル**: インクリメンタル/アイドルゲーム（Cookie Clickerクローン）  
**コンセプト**: コインをクリックしてコインを集め、自動生成施設を購入して効率的にコインを稼ぐゲーム

## 基本ゲームプレイ

### メインアクション
- 画面中央の大きなコインをクリック/タップしてコインを獲得
- **基本獲得量**: 1クリック = 1コイン
- **通貨名**: コイン（またはゴールド）

### 進行フロー
1. 手動クリックでコインを集める
2. 貯めたコインで施設を購入
3. 施設が自動的にコインを生成
4. さらに高価な施設やアップグレードを購入
5. リアルタイムランキングで他プレイヤーと競争

## 施設システム（自動生成建物）

| 施設名 | 初期価格 | 生産量/秒 | 説明 |
|--------|----------|-----------|------|
| コイン製造機 | 10コイン | 0.1コイン | 基本的なコイン製造装置 |
| 金鉱 | 100コイン | 1コイン | 地下からコインを採掘 |
| 銀行 | 1,000コイン | 8コイン | コインを貯蓄・運用 |
| 造幣局 | 12,000コイン | 47コイン | 公式なコイン製造施設 |
| 金庫 | 130,000コイン | 260コイン | 大量のコインを保管・管理 |
| 宝石店 | 1,400,000コイン | 1,400コイン | 高価な宝石を販売してコイン獲得 |

### 施設の仕様
- **価格上昇**: 同じ施設を購入するたびに価格が15%上昇
- **購入可能条件**: 前の段階の施設を少なくとも1つ所有している場合に解放

## アップグレードシステム

### クリック強化
- クリック1回あたりの獲得コイン数を増加
- 段階的なアップグレード（2倍、5倍、10倍...）

### 施設効率向上
- 各施設の生産量を2倍、3倍にするアップグレード
- 施設ごとに複数段階のアップグレード可能

### 特殊効果
- **ゴールデンタイム**: 一定時間（30秒）コイン獲得量が5倍
- **連打ボーナス**: 短時間内の連続クリックでボーナス倍率

## UI/UXデザイン

### レイアウト構成
- **中央**: メインコイン（クリック可能）
- **上部**: 現在のコイン数、毎秒獲得量表示
- **右側/下部**: 施設購入パネル（スクロール可能）
- **左側**: リアルタイムランキング

### モバイル最適化
- **基準画面**: iPhone SE 2nd/3rd世代
- **タッチターゲット**: 最小44px四方
- **縦画面レイアウト**: メインコイン→ステータス→施設リスト→ランキング

## 視覚的演出

### アニメーション
- **コインクリック時**: 拡大縮小アニメーション + 光エフェクト
- **コイン獲得**: 数値ポップアップ（+1, +10等）
- **施設購入時**: 購入確認アニメーション
- **レベルアップ時**: 特別なエフェクト

### カラーパレット
- **メインカラー**: ゴールド（#FFD700）
- **アクセントカラー**: ダークゴールド（#B8860B）
- **背景**: 深いブルー〜パープルグラデーション
- **テキスト**: 白またはクリーム色

### サウンド効果（将来実装）
- コインクリック音
- 施設購入音
- レベルアップファンファーレ

## ゲームバランス

### 進行速度設計
- **初期段階**: 最初の施設（コイン製造機）まで約30秒
- **中期段階**: 銀行まで約5分
- **後期段階**: より長期的な目標設定

### 数値表示（技術課題では簡素化）
- **基本**: 数値そのまま表示
- **将来拡張**: 1K, 1M, 1B表記

### 放置時間対応（技術課題では省略）
- **MVP**: ページを開いている間のみカウント
- **将来拡張**: オフライン進行機能

## ランキングシステム（技術課題簡素版）

### 表示仕様
- **表示件数**: 上位10位
- **更新方式**: ページリロード時またはボタンクリック
- **自分の順位**: 簡易表示

### ランキング要素
- **現在のコイン数**: メイン指標のみ
- **ユーザー名**: 表示

## データ保存仕様（技術課題簡素版）

### 保存タイミング
- **手動保存**: 「保存」ボタンクリック時
- **施設購入時**: 自動保存

### 保存データ
- ユーザー名
- 現在のコイン数
- 所有施設とその数量（製造機、金鉱のみ）

## 技術仕様（技術課題用MVP）

### フロントエンド
- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS + CSS transitions
- **状態管理**: React useState + useContext
- **アニメーション**: CSS transition（シンプルなもののみ）

### バックエンド
- **データベース**: Supabase + PostgreSQL
- **リアルタイム通信**: Supabase Realtime
- **API**: Supabase Client

### デプロイメント
- **ホスティング**: Vercel（ワンクリックデプロイ）
- **データベース**: Supabase

## 実装優先度

### 技術課題MVP（2時間で実装）

**1時間目: 基本ゲーム機能**
1. ✅ Next.js + TypeScript プロジェクト初期化（10分）
2. ✅ コインクリック機能 + スコア表示（30分）
3. ✅ 基本的な施設システム（製造機、金鉱の2つ）（20分）

**2時間目: データ保存とランキング**
1. ✅ Supabase接続とテーブル設計（15分）
2. ✅ ユーザー名入力 + データ保存（15分）
3. ✅ シンプルなランキング表示（20分）
4. ✅ 最終調整 + Vercelデプロイ（10分）

### 技術課題で不要な機能
- ❌ セキュリティ対策・チート防止
- ❌ 複雑な認証システム
- ❌ 高度なアニメーション
- ❌ サウンド効果
- ❌ 実績システム
- ❌ アップグレードシステム

### 拡張機能（README.mdに記載予定）
- より多くの施設
- アップグレードシステム
- 高度な視覚効果
- サウンド効果
- 実績システム

## UI進化システム（プレイヤー成長連動）

### 基本コンセプト
プレイヤーのコイン獲得量に応じてゲーム全体のUI・演出が段階的に豪華になる成長実感システム

### 進化ステージ定義

#### Stage 1: 駆け出し期 (0-99コイン)
**テーマ**: シンプル・質素な始まり
- **背景**: 基本的な青紫グラデーション
- **メインコイン**: 標準の黄色コイン、静的表示
- **統計パネル**: シンプルな半透明ボックス
- **施設リスト**: 最小限の装飾

#### Stage 2: 発展期 (100-999コイン)
**テーマ**: 工業化と成長の兆し
- **背景**: 強化グラデーション + 微細な星きらめきエフェクト
- **メインコイン**: 光沢強化 + ホバー時の拡大エフェクト
- **統計パネル**: 装飾ボーダー追加、微光エフェクト
- **施設リスト**: グループ化表示、カテゴリ分け

#### Stage 3: 繁栄期 (1,000-9,999コイン)
**テーマ**: 富と繁栄の象徴
- **背景**: 動的グラデーション + 金色アクセント + パーティクル
- **メインコイン**: 常時微光エフェクト + 緩やかな回転アニメーション
- **統計パネル**: ゴールドフレーム + 宝石装飾
- **施設リスト**: アイコンアニメーション、購入時特殊エフェクト

#### Stage 4: 帝国期 (10,000+コイン)
**テーマ**: 究極の富と支配力
- **背景**: レインボーグラデーション + パーティクルストーム
- **メインコイン**: レインボーエフェクト + 複雑な回転 + パーティクル噴出
- **統計パネル**: 王冠・宝石装飾、VIP感満載のデザイン
- **施設リスト**: 3Dエフェクト、豪華演出

### UI要素別進化仕様

#### 背景システム
```css
/* Stage 1: 基本 */
.bg-stage-1 {
  background: linear-gradient(135deg, #1e3a8a, #7c3aed);
}

/* Stage 2: 工業化 */
.bg-stage-2 {
  background: linear-gradient(135deg, #1e3a8a, #7c3aed, #dc2626);
  position: relative;
}
.bg-stage-2::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: twinkle 3s ease-in-out infinite;
}

/* Stage 3: 繁栄 */
.bg-stage-3 {
  background: linear-gradient(45deg, #1e3a8a, #7c3aed, #f59e0b, #dc2626);
  background-size: 400% 400%;
  animation: gradientShift 8s ease infinite;
}

/* Stage 4: 帝国 */
.bg-stage-4 {
  background: linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3);
  background-size: 800% 800%;
  animation: rainbowShift 4s ease infinite;
}
```

#### メインコイン進化
- **Stage 1**: `transform: scale(1)` - 静的
- **Stage 2**: `transform: scale(1.05)` + `box-shadow` 強化
- **Stage 3**: `animation: rotate 10s linear infinite` + 微光
- **Stage 4**: 複雑アニメーション + パーティクルエミッター

#### 統計パネル進化
- **Stage 1**: `bg-black/20` - 基本透明
- **Stage 2**: `border: 2px solid gold` - ゴールドボーダー
- **Stage 3**: `box-shadow: 0 0 20px gold` - 光エフェクト
- **Stage 4**: 宝石装飾、王冠アイコン追加

### 実装技術仕様

#### テーマシステム
```typescript
interface GameTheme {
  stage: 1 | 2 | 3 | 4
  name: string
  coinThreshold: number
  backgroundClass: string
  coinClass: string
  panelClass: string
  soundProfile: 'basic' | 'industrial' | 'premium' | 'imperial'
}

const UI_THEMES: GameTheme[] = [
  {
    stage: 1,
    name: '駆け出し期',
    coinThreshold: 0,
    backgroundClass: 'bg-stage-1',
    coinClass: 'coin-basic',
    panelClass: 'panel-basic',
    soundProfile: 'basic'
  },
  {
    stage: 2, 
    name: '発展期',
    coinThreshold: 100,
    backgroundClass: 'bg-stage-2',
    coinClass: 'coin-industrial', 
    panelClass: 'panel-industrial',
    soundProfile: 'industrial'
  }
  // ... Stage 3, 4
]
```

#### 動的テーマ切り替え
```typescript
const getCurrentTheme = (totalCoins: number): GameTheme => {
  return UI_THEMES
    .reverse()
    .find(theme => totalCoins >= theme.coinThreshold) || UI_THEMES[0]
}

const useGameTheme = (coins: number) => {
  const [currentTheme, setCurrentTheme] = useState<GameTheme>(UI_THEMES[0])
  
  useEffect(() => {
    const newTheme = getCurrentTheme(coins)
    if (newTheme.stage !== currentTheme.stage) {
      setCurrentTheme(newTheme)
      // ステージアップエフェクト実行
      triggerStageUpEffect(newTheme.stage)
    }
  }, [coins, currentTheme.stage])
  
  return currentTheme
}
```

### ゲームバランス考慮

#### 閾値調整方針
- **Stage 2**: 100コイン - 約5-10分でリーチ可能
- **Stage 3**: 1,000コイン - 約30-60分の中期目標
- **Stage 4**: 10,000コイン - 長期プレイヤー向け究極目標

#### パフォーマンス配慮
- **アニメーション**: CSS transforms優先、JavaScript最小化
- **パーティクル**: 数量制限、デバイス性能連動
- **モバイル対応**: 低スペック端末向け軽量モード

#### 段階的エフェクト実装
```typescript
// 軽量版から段階的に強化
const getEffectIntensity = (stage: number, deviceCapability: 'low' | 'mid' | 'high') => {
  const baseIntensity = [0.3, 0.5, 0.7, 1.0][stage - 1]
  const deviceMultiplier = { low: 0.5, mid: 0.8, high: 1.0 }[deviceCapability]
  return Math.min(baseIntensity * deviceMultiplier, 1.0)
}
```

### ステージアップ演出

#### 特別エフェクト
- **Stage 2到達**: 「工業化達成！」バナー + 花火エフェクト
- **Stage 3到達**: 「繁栄期突入！」+ ゴールドシャワー
- **Stage 4到達**: 「帝国建設完了！」+ レインボー爆発

#### 音響演出
- 各ステージアップ時に専用ファンファーレ
- BGM切り替え（将来実装）

## 今後の拡張案

### 演出面の強化
- パーティクルエフェクト
- より豊富なアニメーション
- 背景の動的変化
- 季節イベント

### ゲーム要素の追加
- プレステージシステム
- 特殊イベント
- ミニゲーム
- ソーシャル機能（フレンド、ギルド）
