// 文件: src/stores/user.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as loginApi, getMe as getMeApi } from '@/api/auth';
import type { LoginFormData, UserInfo, LoginResponse } from '@/types/user';

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('user_token'));
  const userInfo = ref<UserInfo | null>(null);

  const isLoggedIn = computed(() => !!token.value && !!userInfo.value);
  const apiToken = computed(() => userInfo.value?.api_token);

  function setLoginInfo(data: LoginResponse) {
    token.value = data.access_token;
    userInfo.value = data.user_info;
    localStorage.setItem('user_token', data.access_token);
  }

  function clearLoginInfo() {
    token.value = null;
    userInfo.value = null;
    localStorage.removeItem('user_token');
  }

  async function login(loginData: LoginFormData) {
    const response = await loginApi(loginData);
    setLoginInfo(response);
  }

  function logout() {
    clearLoginInfo();
    // 路由跳转在组件中处理
  }

  // --- 关键新增/修改点 ---
  async function tryAutoLogin() {
    // 只有在有 token 但没有用户信息时才执行
    if (token.value && !userInfo.value) {
      try {
        const user = await getMeApi();
        // 如果成功获取，说明 token 有效，更新用户信息
        userInfo.value = user;
      } catch (error) {
        // 如果失败 (例如 401)，说明 token 已过期，清理状态
        console.warn("Auto login with stored token failed.", error);
        clearLoginInfo();
      }
    }
  }

  function updateUserInfo(newUserInfo: UserInfo) {
    userInfo.value = newUserInfo;
  }
  
  return { token, userInfo, isLoggedIn, apiToken, login, logout, tryAutoLogin, updateUserInfo };
});
