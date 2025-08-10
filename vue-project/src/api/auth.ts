// 文件: src/api/auth.ts (最终修正完整版)

import request from './request'
// 导入我们之前修正过的、完整的类型定义
import type { LoginFormData, UserInfo, LoginResponse } from '@/types/user'

// 定义我们从拦截器接收到的API响应的通用类型
// 这个类型描述了 { code, msg, data } 结构
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}


/**
 * 登录API
 * @param data 登录表单数据 { email, password }
 */
export const login = (data: LoginFormData): Promise<ApiResponse<LoginResponse>> => {
  // FastAPI 的 OAuth2PasswordRequestForm 需要 application/x-www-form-urlencoded 格式
  // 最简单的方式是使用 URLSearchParams
  const params = new URLSearchParams();
  // 注意：FastAPI 的 OAuth2PasswordRequestForm 将 email 字段视为 'username'
  params.append('username', data.username);
  params.append('password', data.password);

  return request({
    url: '/auth/token',
    method: 'post',
    data: params, // 发送 URLSearchParams 对象
    headers: {
      // Axios 会自动为 URLSearchParams 设置正确的 Content-Type
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

/**
 * 获取当前登录用户信息API
 */
export const getMe = (): Promise<ApiResponse<UserInfo>> => {
  // 【核心修正】函数的返回值类型现在是 Promise<ApiResponse<UserInfo>>
  // 这与我们拦截器的实际返回值完全匹配
  return request({
    url: '/auth/me',
    method: 'get'
  })
}

/**
 * 注册API
 * @param data 注册所需的用户数据
 */
export const register = (data: any): Promise<ApiResponse<UserInfo>> => {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

/**
 * 发送注册验证码API
 * @param email 目标邮箱
 */
export const sendRegistrationCode = (email: string): Promise<ApiResponse<any>> => {
  return request({
    url: '/auth/send-registration-code',
    method: 'post',
    data: { email }
  })
}

/**
 * 忘记密码 (发送重置邮件) API
 * @param email 目标邮箱
 */
export const forgotPassword = (email: string): Promise<ApiResponse<any>> => {
  return request({
    url: '/auth/forgot-password',
    method: 'post',
    data: { email }
  })
}

/**
 * 重置密码API
 * @param data 包含 token 和新密码的数据
 */
export const resetPassword = (data: { email: string; token: string; new_password: string }): Promise<ApiResponse<any>> => {
  return request({
    url: '/auth/reset-password',
    method: 'post',
    data
  })
}
