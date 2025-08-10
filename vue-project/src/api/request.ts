// 文件: src/api/request.ts (最终完整版)

import axios from 'axios';
import type { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';
import type { ApiResponse } from '@/types/api'; // 假设您有这个类型来定义 { code, msg, data }

const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
});

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore();
    if (userStore.token && config.headers) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;
    if (res.code !== 200) {
      ElMessage({ message: res.msg || 'Error', type: 'error', duration: 5 * 1000 });
      if (res.code === 401) {
        useUserStore().logout();
        window.location.href = '/login';
      }
      return Promise.reject(new Error(res.msg || 'Error'));
    } else {
      // **核心：返回整个 res 对象 { code, msg, data }**
      return res;
    }
  },
  (error: AxiosError<ApiResponse>) => {
    let message = '请求失败';
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          message = '登录已失效，请重新登录';
          useUserStore().logout();
          setTimeout(() => { window.location.href = '/login'; }, 1500);
          break;
        default:
          message = data?.msg || error.message || `请求失败 (${status})`;
      }
    } else if (error.request) {
      message = '网络连接失败，请检查网络或后端服务';
    } else {
      message = error.message || '请求配置错误';
    }
    console.error('API Error:', message, error);
    ElMessage.error(message);
    return Promise.reject(new Error(message));
  }
);

export default service;
