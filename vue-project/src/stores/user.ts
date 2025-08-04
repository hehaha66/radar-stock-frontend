// src/stores/user.ts
import { defineStore } from 'pinia';
import * as api from '@/api/auth';
import type { UserInfo, LoginFormData } from '@/types/user';

export type { UserInfo };

interface UserState {
  accessToken: string | null;
  userInfo: UserInfo | null;
}

/**
 * Manages user authentication and state.
 * Persisted to localStorage via pinia-plugin-persistedstate.
 */
export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    accessToken: null,
    userInfo: null,
  }),

  getters: {
    /**
     * Checks if the user is currently logged in.
     * @returns {boolean} True if both token and userInfo exist.
     */
    isLoggedIn: (state): boolean => !!state.accessToken && !!state.userInfo,

    /**
     * Unified token getter.
     * @returns {string | null} The user's authentication token.
     */
    token: (state): string | null => state.accessToken,
  },

  actions: {
    /**
     * Logs the user in by calling the API and storing the token and user info.
     * @param loginData The user's login credentials.
     * @returns {Promise<boolean>} True if login was successful.
     */
    async login(loginData: LoginFormData): Promise<boolean> {
      try {
        const response = await api.login(loginData);
        this.accessToken = response.access_token;
        this.userInfo = response.user_info;
        return true;
      } catch (error) {
        console.error('Login failed:', error);
        this.logout(); // Ensure state is cleared on failure
        return false;
      }
    },

    /**
     * Fetches the current user's info from the API if a token exists.
     */
    async getMe() {
      if (!this.accessToken) {
        return;
      }
      try {
        const userInfo = await api.getMe();
        this.userInfo = userInfo;
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        // If the token is invalid or expired, log the user out.
        this.logout();
      }
    },

    /**
     * Logs the user out by clearing the state.
     */
    logout() {
      this.accessToken = null;
      this.userInfo = null;
      // The persisted state in localStorage will be cleared automatically.
    },

    /**
     * Sets the user info directly (for profile updates, etc.).
     */
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo;
    },
  },

  persist: {
    key: 'user-storage',
    // Only persist the accessToken. userInfo can be fetched again via getMe.
    // This prevents storing stale user data.
    paths: ['accessToken'], 
  },
});
