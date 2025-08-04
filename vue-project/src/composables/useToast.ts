import { ref } from 'vue'

export interface ToastNotification {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  visible: boolean
}

const notifications = ref<ToastNotification[]>([])

export function useToast() {
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration: number = 2000) => {
    const id = Date.now().toString()
    const notification: ToastNotification = {
      id,
      message,
      type,
      duration,
      visible: true
    }
    
    notifications.value.push(notification)
    
    // 自动移除通知
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }
  
  const removeToast = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value[index].visible = false
      setTimeout(() => {
        notifications.value.splice(index, 1)
      }, 400) // 等待动画完成
    }
  }
  
  const success = (message: string, duration?: number) => showToast(message, 'success', duration)
  const error = (message: string, duration?: number) => showToast(message, 'error', duration)
  const warning = (message: string, duration?: number) => showToast(message, 'warning', duration)
  const info = (message: string, duration?: number) => showToast(message, 'info', duration)
  
  return {
    notifications,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
} 