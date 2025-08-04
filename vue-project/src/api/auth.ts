import request from './request'
import type { LoginFormData, UserInfo, LoginResponse } from '@/types/user'

export const login = (data: LoginFormData): Promise<LoginResponse> => {
  const formData = new FormData()
  formData.append('username', data.email)
  formData.append('password', data.password)
  
  return request({
    url: '/auth/token',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

export const getMe = (): Promise<UserInfo> => {
  return request({
    url: '/auth/me',
    method: 'get'
  })
}

export const register = (data: any): Promise<UserInfo> => {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

export const sendRegistrationCode = (email: string): Promise<any> => {
  return request({
    url: '/auth/send-registration-code',
    method: 'post',
    data: { email }
  })
}

export const forgotPassword = (email: string): Promise<any> => {
  return request({
    url: '/auth/forgot-password',
    method: 'post',
    data: { email }
  })
}

export const resetPassword = (data: { email: string; token: string; new_password: string }): Promise<any> => {
  return request({
    url: '/auth/reset-password',
    method: 'post',
    data
  })
} 