// 文件: src/api/auth.ts

import request from './request'
import type { LoginFormData, UserInfo, LoginResponse } from '@/types/user'
import type { ApiResponse } from '@/types/api'
// 【修正1】导入 AxiosRequestHeaders 类型，用于类型断言
import type { AxiosRequestHeaders } from 'axios';

/**
 * 登录API
 * @param data 登录表单数据 { username, password }
 */
export const login = (data: LoginFormData): Promise<ApiResponse<LoginResponse>> => {
  const params = new URLSearchParams();
  params.append('username', data.username);
  params.append('password', data.password);

  return request.post<LoginResponse>('/auth/token', params, {
    // 【修正2】将 headers 对象进行类型断言，以满足严格的类型检查
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    } as AxiosRequestHeaders,
  });
}

/**
 * 获取当前登录用户信息API
 */
export const getMe = (): Promise<ApiResponse<UserInfo>> => {
  return request.get<UserInfo>('/auth/me');
}

/**
 * 注册API
 * @param data 注册所需的用户数据
 */
export const register = (data: any): Promise<ApiResponse<UserInfo>> => {
  return request.post<UserInfo>('/auth/register', data);
}

/**
 * 发送注册验证码API
 * @param email 目标邮箱
 */
export const sendRegistrationCode = (email: string): Promise<ApiResponse<any>> => {
  return request.post<any>('/auth/send-registration-code', { email });
}

/**
 * 忘记密码 (发送重置邮件) API (如果您暂时不用，可以注释掉或删除)
 * @param email 目标邮箱
 */
/*
export const forgotPassword = (email: string): Promise<ApiResponse<any>> => {
  return request.post<any>('/auth/forgot-password', { email });
}
*/

/**
 * 重置密码API (如果您暂时不用，可以注释掉或删除)
 * @param data 包含 token 和新密码的数据
 */
/*
export const resetPassword = (data: { email: string; token: string; new_password: string }): Promise<ApiResponse<any>> => {
  return request.post<any>('/auth/reset-password', data);
}
*/
