// 文件: src/stores/user.ts (最终完整版)

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as loginApi, getMe as getMeApi } from '@/api/auth';
import type { LoginFormData, UserInfo, LoginResponse } from '@/types/user';

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('user_token'));
  const userInfo = ref<UserInfo | null>(JSON.parse(localStorage.getItem('userInfo') || 'null'));

  const isLoggedIn = computed(() => !!token.value && !!userInfo.value);
  const apiToken = computed(() => userInfo.value?.api_token);

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

  async function tryAutoLogin(): Promise<boolean> {
    if (token.value && !userInfo.value) {
      try {
        const response = await getMeApi();
        if(response && response.data) {
          userInfo.value = response.data;
          localStorage.setItem('userInfo', JSON.stringify(response.data));
          return true;
        }
        return false;
      } catch (error) {
        clearLoginInfo();
        return false;
      }
    }
    return !!userInfo.value;
  }

  function updateUserInfo(newUserInfo: UserInfo) {
      if (userInfo.value) {
          const updated = { ...userInfo.value, ...newUserInfo };
          userInfo.value = updated;
          localStorage.setItem('userInfo', JSON.stringify(updated));
      }
  }

  return {
    token, userInfo, isLoggedIn, apiToken, login, logout, tryAutoLogin, updateUserInfo, clearLoginInfo
  };
});
