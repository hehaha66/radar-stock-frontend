// 文件: src/types/user.ts (最终完整版)

export interface LoginFormData {
  username: string;
  password: string;
}

export interface UserInfo {
  id: number;
  email: string;
  username: string | null;
  nickname: string | null;
  is_active: boolean;
  is_superuser: boolean;
  plan: string;
  expires_at: string | null;
  api_token: string | null;
  min_interval: number;
  max_codes: number;
  max_connections: number;
  api_access_level: string;
  max_custom_indicators: number;
  max_stock_groups: number;
  max_alerts: number;
  real_name?: string;
  id_card_number?: string;
  phone_number?: string;
  total_points?: number;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_info: UserInfo;
}
