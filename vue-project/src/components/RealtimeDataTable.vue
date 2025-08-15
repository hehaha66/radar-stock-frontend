<!-- 文件路径: src/components/RealtimeDataTable.vue -->
<template>
  <div class="realtime-data-table-wrapper">
    <el-table
      :data="tableData"
      style="width: 100%"
      height="100%"
      :row-key="(row: ComputedStockData) => row['股票代码'] || row['名称']"
      :cell-class-name="cellClass"
      :header-cell-class-name="'header-cell'"
      :row-class-name="'data-row'"
      empty-text="等待数据或当前无监控实体..."
      @header-dragend="handleHeaderDragEnd"
    >
      <!-- 【核心】动态生成列 -->
      <el-table-column
        v-for="column in visibleColumns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :min-width="column.width"
        sortable
        align="right"
        show-overflow-tooltip
      >
        <template #default="{ row }: { row: ComputedStockData }">
          <!-- 自定义“代码/名称”列的渲染 -->
          <div v-if="column.prop === '股票代码'" class="stock-info-cell">
            <span class="stock-code">{{ row['股票代码'] }}</span>
            <span class="stock-name">{{ row['名称'] }}</span>
          </div>
          <!-- 格式化百分比 -->
          <span v-else-if="column.prop.includes('(%)')" :class="{ 'price-cell': column.prop === '最新价' }">
            {{ formatPercentage(row[column.prop]) }}
          </span>
          <!-- 格式化普通数字 -->
          <span v-else :class="{ 'price-cell': column.prop === '最新价' }">
            {{ formatNumber(row[column.prop]) }}
          </span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useComputationStore, type ComputedStockData } from '@/stores/computationStore';
import { useSettingsStore } from '@/stores/settingsStore';

const computationStore = useComputationStore();
const settingsStore = useSettingsStore();

const tableData = computed(() => {
  return Object.values(computationStore.finalDataMap);
});

// 只显示用户在设置中勾选的列
const visibleColumns = computed(() => settingsStore.tableColumns.filter(c => c.visible));

// Element Plus 表格的列宽拖拽后，保存配置
function handleHeaderDragEnd(newWidth: number, oldWidth: number, column: any) {
    const foundColumn = settingsStore.tableColumns.find(c => c.prop === column.property);
    if (foundColumn) {
        foundColumn.width = newWidth;
    }
}

// 根据涨跌幅给单元格添加颜色类
const cellClass = ({ row }: { row: ComputedStockData }) => {
  const changePercent = row['涨跌幅(%)'];
  if (typeof changePercent === 'number') {
    if (changePercent > 0) return 'color-red';
    if (changePercent < 0) return 'color-green';
  }
  return '';
};

// 格式化函数
const formatNumber = (value: any): string => {
    if (typeof value !== 'number') return '-';
    return value.toFixed(2);
}

const formatPercentage = (value: any): string => {
  if (typeof value !== 'number') return '-';
  return `${value.toFixed(2)}%`;
};
</script>

<style>
.realtime-data-table-wrapper {
    height: 100%;
    width: 100%;
}

/* 表格整体透明 */
.realtime-data-table-wrapper .el-table,
.realtime-data-table-wrapper .el-table__expanded-cell {
  background-color: transparent;
}

/* 行样式 */
.realtime-data-table-wrapper .el-table tr,
.realtime-data-table-wrapper .el-table .data-row {
  background-color: transparent !important;
  color: #cbd5e1; /* slate-300 */
}

/* 单元格样式 */
.realtime-data-table-wrapper .el-table--border .el-table__cell,
.realtime-data-table-wrapper .el-table td.el-table__cell,
.realtime-data-table-wrapper .el-table th.el-table__cell.is-leaf {
  border: none;
}
.realtime-data-table-wrapper .el-table::before {
  height: 0px; /* 移除底部横线 */
}

/* 表头样式 */
.realtime-data-table-wrapper .el-table .header-cell {
  background-color: transparent !important;
  color: #94a3b8; /* slate-400 */
  font-weight: 500;
  text-transform: uppercase;
  font-size: 12px;
  border-bottom: 1px solid #334155 !important; /* slate-700 */
}

/* 行悬浮效果 */
.realtime-data-table-wrapper .el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell {
  background-color: rgba(30, 41, 59, 0.5) !important; /* slate-800 with opacity */
}

/* 涨跌颜色 */
.realtime-data-table-wrapper .color-red,
.realtime-data-table-wrapper .el-table .color-red .cell {
  color: #ef4444 !important; /* red-500 */
}
.realtime-data-table-wrapper .color-green,
.realtime-data-table-wrapper .el-table .color-green .cell {
  color: #22c55e !important; /* green-500 */
}

/* 代码/名称列自定义样式 */
.stock-info-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  text-align: left; /* 强制左对齐 */
}
.stock-code {
  font-weight: 600;
  color: #e2e8f0; /* slate-200 */
  font-family: 'Fira Code', monospace;
}
.stock-name {
  font-size: 12px;
  color: #94a3b8; /* slate-400 */
}

/* 价格单元格字体 */
.price-cell {
  font-family: 'Fira Code', monospace;
}

/* 单元格右对齐 */
.el-table .cell {
    text-align: right;
}
/* 代码/名称列特殊处理为左对齐 */
.stock-info-cell {
    text-align: left;
}
</style>
