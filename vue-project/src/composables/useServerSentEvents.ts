// 文件路径: src/composables/useServerSentEvents.ts
// 功能: 封装SSE连接，并将数据喂给computationStore

import { ref, onUnmounted } from 'vue';
import { useComputationStore } from '@/stores/computationStore';

export function useServerSentEvents() {
  const status = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const error = ref<string | null>(null);
  let eventSource: EventSource | null = null;
  const computationStore = useComputationStore();

  const connect = (url: string) => {
    close();
    if (!url) {
      status.value = 'disconnected';
      return;
    }
    try {
      // 假设 VITE_API_BASE_URL 已在 .env 文件中配置
      const fullUrl = (import.meta.env.VITE_API_BASE_URL || '') + url;
      eventSource = new EventSource(fullUrl);
      status.value = 'connecting';
      error.value = null;

      eventSource.onopen = () => {
        status.value = 'connected';
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && Array.isArray(parsed.data)) {
            computationStore.updateRawData(parsed.data);
          }
        } catch (e) {
          console.error('SSE: Failed to parse message', e);
        }
      };

      eventSource.onerror = () => {
        error.value = '连接发生错误，可能已中断。';
        status.value = 'error';
        close();
      };

    } catch (e) {
      error.value = '无法创建SSE连接。';
      status.value = 'error';
    }
  };

  const close = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    status.value = 'disconnected';
    computationStore.clearAllData();
  };

  onUnmounted(close);

  return { status, error, connect, close };
}
