import axios from 'axios'
import type { AxiosResponse, AxiosError } from 'axios'
import { useUserStore } from '@/stores/user'
import type { ApiResponse } from '@/types/api'

// 创建axios实例
const service = axios.create({
  // 修复：将 baseURL 指向 Vite 代理路径，而不是后端服务器的绝对地址
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const token = userStore.token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 检查响应格式，如果是标准API响应格式，直接返回data字段
    // 注意：这里的 response.data 是 axios 包装后的，而里面的 data 才是后端返回的 ResponseModel
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        // 后端可能返回 {code: 200, msg: "Success", data: {...}}
        // 或者 {code: 400, msg: "Error", data: null}
        // 我们应该根据 code 来判断成功与否，但为了最小改动，暂时维持原逻辑
        // 如果后端返回的 { "data": "实际数据" }，这里会正确解析
        return response.data.data
    }
    // 如果后端直接返回数据体，而不是包装在 ResponseModel 中，则直接返回
    return response.data
  },
  async (error: AxiosError<ApiResponse>) => {
    // 默认错误信息
    let message = '请求失败'

    // 如果有响应体 (服务器返回了错误状态码)
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          message = data?.msg || '请求参数错误'
          break
        case 401:
          message = '登录已失效，请重新登录'
          // 这里可以添加UI提示，例如Element Plus的ElMessage
          const userStore = useUserStore()
          userStore.logout()
          // 延迟跳转，给用户看提示的时间
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          break
        case 403:
          message = data?.msg || '没有权限访问'
          break
        case 404:
          message = data?.msg || '请求的资源不存在'
          break
        case 500:
          message = data?.msg || '服务器内部错误'
          break
        default:
          message = data?.msg || `请求失败 (${status})`
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应 (网络问题，例如超时)
      message = '网络连接失败，请检查网络设置或后端服务是否正常运行'
    } else {
      // 发送请求时出了点问题 (例如，请求配置错误)
      message = error.message || '请求配置错误'
    }

    // 在控制台打印详细错误，方便调试
    console.error('API Error:', message, error)

    // 这里可以添加全局的错误提示组件调用
    // import { ElMessage } from 'element-plus'
    // ElMessage.error(message)

    // 将错误继续抛出，以便在具体的API调用处可以捕获
    return Promise.reject(new Error(message))
  }
)

export default service
