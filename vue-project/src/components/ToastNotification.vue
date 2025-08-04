<template>
  <Teleport to="body">
    <Transition name="toast-slide">
      <div v-if="visible" class="toast-notification" :class="type">
        <div class="toast-icon">
          <el-icon v-if="type === 'success'"><CircleCheck /></el-icon>
          <el-icon v-else-if="type === 'error'"><CircleClose /></el-icon>
          <el-icon v-else-if="type === 'warning'"><Warning /></el-icon>
          <el-icon v-else><InfoFilled /></el-icon>
        </div>
        <div class="toast-content">
          <div class="toast-message">{{ message }}</div>
          <div class="toast-time">{{ currentTime }}</div>
        </div>
        <div class="toast-close" @click="close">
          <el-icon><Close /></el-icon>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { CircleCheck, CircleClose, Warning, InfoFilled, Close } from '@element-plus/icons-vue'

interface Props {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  visible: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'success',
  duration: 3000
})

const emit = defineEmits<{
  close: []
}>()

const currentTime = ref('')

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

const close = () => {
  emit('close')
}

let timeInterval: number | null = null

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  
  if (props.duration > 0) {
    setTimeout(() => {
      close()
    }, props.duration)
  }
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.toast-notification {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  min-width: 200px;
  max-width: 280px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 12px;
}

.toast-notification.success {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
  border-color: rgba(34, 197, 94, 0.3);
}

.toast-notification.error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
  border-color: rgba(239, 68, 68, 0.3);
}

.toast-notification.warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
  border-color: rgba(245, 158, 11, 0.3);
}

.toast-notification.info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05));
  border-color: rgba(59, 130, 246, 0.3);
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.toast-notification.success .toast-icon {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.toast-notification.error .toast-icon {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.toast-notification.warning .toast-icon {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.toast-notification.info .toast-icon {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-message {
  color: #e2e8f0;
  font-weight: 500;
  font-size: 12px;
  line-height: 1.3;
  margin-bottom: 2px;
}

.toast-time {
  color: #94a3b8;
  font-size: 10px;
  font-weight: 400;
}

.toast-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

/* 动画效果 */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(-100%) translateY(-20px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(-100%) translateY(-20px);
}

.toast-slide-enter-to,
.toast-slide-leave-from {
  opacity: 1;
  transform: translateX(0) translateY(0);
}
</style> 