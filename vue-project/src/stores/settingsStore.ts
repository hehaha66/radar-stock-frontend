// 文件路径: src/stores/settingsStore.ts

import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import { watch, computed } from 'vue';
import { useWorkspaceStore } from './workspaceStore';
import { FIELD_MAP } from '@/config/fieldMaps';

// --- 类型定义 ---
export interface TableColumnConfig {
  prop: string;
  label: string;
  width: number;
  visible: boolean;
}

export interface ChartAxisConfig {
  min?: number | string | null;
  max?: number | string | null;
}

export interface ChartSeriesConfig {
  id: string;
  entityName: string;
  fieldName: string;
  yAxis: 'left' | 'right';
}

// --- 默认配置 ---
const NATIVE_COLUMNS_CONFIG: Omit<TableColumnConfig, 'visible'>[] = [
  // 常用
  { prop: '股票代码', label: '代码/名称', width: 180 },
  { prop: '最新价', label: '最新价', width: 120 },
  { prop: '涨跌幅(%)', label: '涨跌幅', width: 120 },
  { prop: '涨跌额', label: '涨跌额', width: 120 },
  { prop: '成交额(亿)', label: '成交额(亿)', width: 150 },
  { prop: '换手率(%)', label: '换手率', width: 120 },
  // 行情
  { prop: '开盘价', label: '开盘价', width: 120 },
  { prop: '最高价', label: '最高价', width: 120 },
  { prop: '最低价', label: '最低价', width: 120 },
  { prop: '昨收', label: '昨收', width: 120 },
  { prop: '振幅(%)', label: '振幅', width: 120 },
  { prop: '量比', label: '量比', width: 120 },
  // 市值与估值
  { prop: '总市值(亿)', label: '总市值(亿)', width: 150 },
  { prop: '流通市值(亿)', label: '流通市值(亿)', width: 150 },
  { prop: '市盈率', label: '市盈率(TTM)', width: 150 },
  { prop: '市净率', label: '市净率', width: 150 },
  // 资金流
  { prop: '主力净流入(亿)', label: '主力净流入(亿)', width: 150 },
  { prop: '超大单流入(亿)', label: '超大单流入(亿)', width: 150 },
  { prop: '大单流入(亿)', label: '大单流入(亿)', width: 150 },
  { prop: '中单流入(亿)', label: '中单流入(亿)', width: 150 },
  { prop: '小单流入(亿)', label: '小单流入(亿)', width: 150 },
  // 财务与股本
  { prop: '净资产收益率(加权)', label: 'ROE(加权)', width: 150 },
  { prop: '毛利率', label: '毛利率', width: 120 },
  { prop: '总股本(亿)', label: '总股本(亿)', width: 150 },
  { prop: '总负债(亿)', label: '总负债(亿)', width: 150 },
  { prop: '资产负债比率', label: '资产负债率', width: 150 },
  // 其他
  { prop: '上市日期', label: '上市日期', width: 150 },
];

const DEFAULT_CHART_SERIES: ChartSeriesConfig[] = [];

function getDefaultTimeRange(): ChartAxisConfig {
    const today = new Date();
    const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30, 0);
    const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0, 0);
    return {
        min: startTime.getTime(),
        max: endTime.getTime(),
    };
}

const DEFAULT_CHART_XAXIS_CONFIG: ChartAxisConfig = getDefaultTimeRange();

export const useSettingsStore = defineStore('dashboard-settings', () => {
  const tableColumns = useLocalStorage<TableColumnConfig[]>('table_columns_config_v4', []);
  const chartSeries = useLocalStorage<ChartSeriesConfig[]>('chart_series_config_v4', DEFAULT_CHART_SERIES);
  const paneSize = useLocalStorage<number>('pane_size_config_v4', 50);
  const chartXAxisConfig = useLocalStorage<ChartAxisConfig>('chart_xaxis_config_v4', DEFAULT_CHART_XAXIS_CONFIG);
  const refreshInterval = useLocalStorage<number>('refresh_interval_config_v1', 5);

  const workspaceStore = useWorkspaceStore();

  watch(() => workspaceStore.activeWorkspace?.entities, (newEntities) => {
    if (!newEntities) {
      tableColumns.value = [];
      return;
    }
    const customFields = newEntities
      .filter(e => e.entity_type === 'CUSTOM_FIELD')
      .map(e => ({ prop: e.name, label: e.name, width: 150, visible: true }));
    const allAvailableColumns = [...NATIVE_COLUMNS_CONFIG.map(c => ({...c, visible: ['股票代码', '最新价', '涨跌幅(%)'].includes(c.prop)})), ...customFields];
    const oldColumnsMap = new Map(tableColumns.value.map(c => [c.prop, c]));
    const newColumns = allAvailableColumns.map(availableCol => {
        const oldCol = oldColumnsMap.get(availableCol.prop);
        return oldCol ? { ...availableCol, ...oldCol, label: availableCol.label, width: oldCol.width } : availableCol;
    });
    const finalColumns: TableColumnConfig[] = [];
    const newColumnsMap = new Map(newColumns.map(c => [c.prop, c]));
    tableColumns.value.forEach(oldColInOrder => {
      if (newColumnsMap.has(oldColInOrder.prop)) {
        finalColumns.push(newColumnsMap.get(oldColInOrder.prop)!);
        newColumnsMap.delete(oldColInOrder.prop);
      }
    });
    finalColumns.push(...newColumnsMap.values());
    if (tableColumns.value.length === 0) {
        tableColumns.value = allAvailableColumns;
    } else {
        tableColumns.value = finalColumns;
    }
  }, { deep: true, immediate: true });

  if (!chartXAxisConfig.value) {
      chartXAxisConfig.value = getDefaultTimeRange();
  }

  return {
    tableColumns,
    chartSeries,
    paneSize,
    chartXAxisConfig,
    refreshInterval,
  };
});
