// 文件: src/api/request.ts

import axios from 'axios';
import type { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';
import type { ApiResponse } from '@/types/api';

const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
});

// 请求拦截器 (保持不变)
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

// 响应拦截器 (您的版本，是正确的)
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
      return res;
    }
  },
  (error: AxiosError<ApiResponse>) => {
    // ... 您的错误处理逻辑保持不变 ...
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


// 【【核心修正】】
// 我们导出的不是原始的 service，而是一个类型化的包装器
// 它明确告诉TypeScript，所有方法的返回值都是 Promise<ApiResponse<T>>
const typedService = {
  get<T = any>(url: string, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.get(url, config) as Promise<ApiResponse<T>>;
  },
  post<T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.post(url, data, config) as Promise<ApiResponse<T>>;
  },
  put<T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.put(url, data, config) as Promise<ApiResponse<T>>;
  },
  delete<T = any>(url: string, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.delete(url, config) as Promise<ApiResponse<T>>;
  },
};


export default typedService;
