// src/types/user.ts

export interface UserInfo {
  id: number
  email: string
  nickname?: string
  role: string
  is_active: boolean
  plan: string
  expires_at?: string
  token?: string
  api_access_level: string
  min_interval: number
  max_codes: number
  max_connections: number
  max_custom_indicators: number
  max_stock_groups: number
  max_alerts: number
  total_points: number
  phone_number?: string
  real_name?: string
  id_card_number?: string
  created_at?: string
  // 添加缺失的字段
  game_assets?: string
  title?: string
  monitor_settings?: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user_info: UserInfo
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user_info: UserInfo
}

export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
} 