import { ref, computed } from 'vue';
import type { Ref } from 'vue';

interface Metric {
  name: string;
  formula: string;
}

interface Column {
  prop: string;
  label: string;
  width: number;
}

const DEFAULT_BASE_PROPS = [
  '最新价', '涨跌幅(%)', '涨跌额', '成交量(手)', '成交额(亿)', 
  '换手率(%)', '市盈率', '市净率', '总市值(亿)', '流通市值(亿)',
  '昨收', '开盘价', '最高价', '最低价'
];

export function useColumns(liveData: Ref<Record<string, any>>, customMetrics: Ref<Metric[]>) {
  const baseColumnProps = computed(() => {
    const firstDataPoint = Object.values(liveData.value)[0];
    const dynamicKeys = firstDataPoint ? Object.keys(firstDataPoint) : [];
    
    const combinedKeys = new Set([...DEFAULT_BASE_PROPS, ...dynamicKeys]);

    combinedKeys.delete('id');
    combinedKeys.delete('股票代码');
    combinedKeys.delete('股票名称');

    return Array.from(combinedKeys);
  });

  const allColumns = computed<Column[]>(() => {
    const base = baseColumnProps.value.map(prop => ({
      prop,
      label: prop,
      width: 120
    }));
    const custom = customMetrics.value.map(metric => ({
      prop: metric.name,
      label: metric.name,
      width: 140
    }));

    // De-duplicate to prevent issues if a custom metric has the same name as a base metric
    const combined = [...base, ...custom];
    const uniqueColumns: Column[] = [];
    const seenProps = new Set();
    
    for (const column of combined) {
        if (!seenProps.has(column.prop)) {
            uniqueColumns.push(column);
            seenProps.add(column.prop);
        }
    }
    return uniqueColumns;
  });

  const visibleColumnProps = ref<string[]>(
    JSON.parse(localStorage.getItem('monitor_visibleColumns') || '["最新价", "涨跌幅(%)", "成交额(亿)", "换手率(%)"]')
  );

  const fixedColumnProps = ref<string[]>(
    JSON.parse(localStorage.getItem('monitor_fixedColumns') || '[]')
  );

  const toggleColumnFixed = (prop: string) => {
    const index = fixedColumnProps.value.indexOf(prop);
    if (index > -1) {
      fixedColumnProps.value.splice(index, 1);
    } else {
      fixedColumnProps.value.push(prop);
    }
  };

  const visibleColumns = computed(() =>
    allColumns.value.filter(c => visibleColumnProps.value.includes(c.prop))
  );

  const fixedVisibleColumns = computed(() =>
    visibleColumns.value.filter(c => fixedColumnProps.value.includes(c.prop))
  );

  const nonFixedVisibleColumns = computed(() =>
    visibleColumns.value.filter(c => !fixedColumnProps.value.includes(c.prop))
  );

  const chartableMetrics = computed(() => {
    const nonChartableProps = ['股票名称', '股票代码'];
    return allColumns.value
      .filter(col => !nonChartableProps.includes(col.prop))
      .map(col => ({ prop: col.prop, label: col.label }));
  });
  
  const availableMetrics = computed(() => {
    const nonMetricProps = ['股票名称', '股票代码'];
    return allColumns.value
      .filter(col => !nonMetricProps.includes(col.prop))
      .map(col => ({ prop: col.prop, label: col.label }));
  });

  return {
    allColumns,
    visibleColumnProps,
    fixedColumnProps,
    toggleColumnFixed,
    visibleColumns,
    fixedVisibleColumns,
    nonFixedVisibleColumns,
    chartableMetrics,
    availableMetrics,
    baseColumnProps
  };
} 