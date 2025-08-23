import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface DbPlayer {
  id: string
  username: string
  coins: number
  buildings: { [key: string]: number }
  created_at: string
  updated_at: string
  // プレステージ関連データ
  lifetime_coins?: number
  prestige_points?: number
  click_power_items?: number
  production_boost_items?: number
  price_reduction_items?: number
  special_effects?: number
}