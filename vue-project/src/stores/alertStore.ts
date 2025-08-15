// 文件路径: src/stores/alertStore.ts (全新创建)

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Howl } from 'howler';
import type { WorkspaceEntity } from '@/types/workspace';

// 预加载声音文件
const alertSound = new Howl({
  src: ['/alert.mp3']
});

export const useAlertStore = defineStore('alert', () => {
  const triggeredAlerts = ref<Set<number>>(new Set()); // 存储已触发过的警报ID（用于'触发一次'逻辑）

  // 检查并触发警报
  function checkAndTriggerAlerts(entities: WorkspaceEntity[], finalDataMap: Record<string, any>, checkAlertCallback: (formula: string) => boolean) {
    const alertRules = entities.filter(e => e.entity_type === 'ALERT_RULE' && e.definition?.is_active);

    for (const rule of alertRules) {
      if (triggeredAlerts.value.has(rule.id)) continue; // 如果是“触发一次”且已触发，则跳过

      const condition = rule.definition.condition;
      if (condition) {
        try {
            const isTriggered = checkAlertCallback(condition);
            if (isTriggered) {
                console.log(`%c[ALERT TRIGGERED] ${rule.name}`, 'color: #ef4444; font-weight: bold;');

                // 执行动作
                rule.definition.actions?.forEach((action: string) => {
                    if (action === 'notification') {
                        showNotification(rule.name, condition);
                    }
                    if (action === 'sound') {
                        playSound();
                    }
                });

                // 处理触发频率
                if (rule.definition.frequency === 'once') {
                    triggeredAlerts.value.add(rule.id);
                }
            }
        } catch (e) {
            console.error(`Error evaluating alert rule "${rule.name}":`, e);
        }
      }
    }
  }

  function showNotification(title: string, body: string) {
      if (!('Notification' in window)) return;

      if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                  new Notification(title, { body, icon: '/favicon.ico' });
              }
          });
      }
  }

  function playSound() {
      alertSound.play();
  }

  // 当工作区切换或停止监控时，需要重置状态
  function resetTriggeredAlerts() {
    triggeredAlerts.value.clear();
  }

  return { checkAndTriggerAlerts, resetTriggeredAlerts };
});
