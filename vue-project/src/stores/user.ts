// 文件: src/stores/user.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as loginApi, getMe as getMeApi } from '@/api/auth';
import type { LoginFormData, UserInfo, LoginResponse } from '@/types/user';

export const useUserStore = defineStore('user', () => {
  // --- 状态 (State) ---
  const token = ref<string | null>(localStorage.getItem('user_token'));

  const initializeUserInfo = (): UserInfo | null => {
    const userInfoString = localStorage.getItem('userInfo');
    if (userInfoString && userInfoString !== 'undefined' && userInfoString !== 'null') {
      try {
        return JSON.parse(userInfoString);
      } catch (e) {
        console.error("解析本地存储的userInfo失败:", e);
        return null;
      }
    }
    return null;
  };
  const userInfo = ref<UserInfo | null>(initializeUserInfo());

  // --- 计算属性 (Getters) ---
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value);
  const apiToken = computed(() => userInfo.value?.api_token);

  // --- 核心动作 (Actions) ---
  function setStoreState(accessToken: string, newInfo: UserInfo) {
    token.value = accessToken;
    userInfo.value = newInfo;
    localStorage.setItem('user_token', accessToken);
    localStorage.setItem('userInfo', JSON.stringify(newInfo));
  }

  function clearLoginInfo() {
    token.value = null;
    userInfo.value = null;
    localStorage.removeItem('user_token');
    localStorage.removeItem('userInfo');
  }

  async function login(loginData: LoginFormData): Promise<boolean> {
    try {
      const response = await loginApi(loginData);
      const loginResult: LoginResponse = response.data;
      if (loginResult && loginResult.access_token && loginResult.user_info) {
        setStoreState(loginResult.access_token, loginResult.user_info);
        return true;
      } else {
        throw new Error("登录成功，但返回数据格式不正确");
      }
    } catch (error) {
      clearLoginInfo();
      throw error;
    }
  }

  function logout() {
    clearLoginInfo();
    window.location.reload();
  }

  // 这个函数现在被 forceRefreshUserInfo 替代，但为了兼容性保留
  async function tryAutoLogin(): Promise<boolean> {
    if (token.value && !userInfo.value) {
      return await forceRefreshUserInfo();
    }
    return !!userInfo.value;
  }

  // 新增的、更可靠的刷新函数
  async function forceRefreshUserInfo(): Promise<boolean> {
    if (token.value) {
      try {
        const response = await getMeApi();
        if (response && response.data) {
          userInfo.value = response.data;
          localStorage.setItem('userInfo', JSON.stringify(response.data));
          return true;
        }
      } catch (error) {
        console.warn("刷新用户信息失败 (可能是token已过期):", error);
        clearLoginInfo();
      }
    }
    return false;
  }

  // updateUserInfo 函数保持不变
  function updateUserInfo(newUserInfo: Partial<UserInfo>) {
      if (userInfo.value) {
          const updated = { ...userInfo.value, ...newUserInfo } as UserInfo;
          userInfo.value = updated;
          localStorage.setItem('userInfo', JSON.stringify(updated));
      }
  }

  // 返回所有函数和状态，确保不破坏任何现有依赖
  return {
    token,
    userInfo,
    isLoggedIn,
    apiToken,
    login,
    logout,
    tryAutoLogin, // 保留 tryAutoLogin
    forceRefreshUserInfo,
    updateUserInfo,
    clearLoginInfo
  };
});
