// src/stores/monitorStore.ts

import { defineStore } from 'pinia';
import type { AlertRule } from '@/types/monitor';
import { ref, computed } from 'vue';

type AlertsState = {
  [stockCode: string]: AlertRule[];
};

export const useMonitorStore = defineStore('monitor', () => {
  const alerts = ref<AlertsState>({});

  const getAlertsForStock = computed(() => {
    return (stockCode: string): AlertRule[] => {
      return alerts.value[stockCode] || [];
    }
  });

  const getAllAlerts = computed(() => {
    const allAlerts: AlertRule[] = [];
    Object.values(alerts.value).forEach(stockAlerts => {
      allAlerts.push(...stockAlerts);
    });
    return allAlerts;
  });

  function addAlert(alert: AlertRule) {
    const stockCode = alert.stockCode;
    if (!alerts.value[stockCode]) {
      alerts.value[stockCode] = [];
    }
    alerts.value[stockCode].push(alert);
  }

  function updateAlert(stockCode: string, updatedRule: AlertRule) {
    const stockAlerts = alerts.value[stockCode];
    if (stockAlerts) {
      const index = stockAlerts.findIndex(r => r.id === updatedRule.id);
      if (index !== -1) {
        stockAlerts[index] = updatedRule;
      }
    }
  }

  function removeAlert(ruleId: string) {
    Object.keys(alerts.value).forEach(stockCode => {
      alerts.value[stockCode] = alerts.value[stockCode].filter(r => r.id !== ruleId);
    });
  }

  function toggleAlert(ruleId: string) {
    Object.keys(alerts.value).forEach(stockCode => {
      const alert = alerts.value[stockCode].find(r => r.id === ruleId);
      if (alert) {
        alert.isActive = !alert.isActive;
      }
    });
  }

  return {
    alerts,
    getAlertsForStock,
    getAllAlerts,
    addAlert,
    updateAlert,
    removeAlert,
    toggleAlert,
  };
}, {
  persist: true,
});
