<template>
  <div class="toast-container">
    <TransitionGroup name="toast-list" tag="div">
      <ToastNotification
        v-for="notification in notifications"
        :key="notification.id"
        :message="notification.message"
        :type="notification.type"
        :duration="notification.duration"
        :visible="notification.visible"
        @close="removeToast(notification.id)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import ToastNotification from './ToastNotification.vue'

const { notifications, removeToast } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast-container > div {
  pointer-events: auto;
}

/* 列表动画 */
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(-100%) translateY(-20px);
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateX(-100%) translateY(-20px);
}

.toast-list-move {
  transition: transform 0.3s ease;
}
</style> 