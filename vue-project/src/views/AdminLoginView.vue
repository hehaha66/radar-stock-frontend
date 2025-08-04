<script setup lang="ts">
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMonitorStore, type StockQuote } from '@/stores/monitorStore';
import MonitorToolbar from '@/components/MonitorToolbar.vue';
import MonitorTable from '@/components/MonitorTable.vue';
import MonitorChart from '@/components/MonitorChart.vue';
import SettingsModal from '@/components/SettingsModal.vue';
import { ElMessage } from 'element-plus';
import { Bell } from '@element-plus/icons-vue';

const monitorStore = useMonitorStore();
const {
  isMonitoring, isLoading, lastUpdateTime,
  stockListForTable, visibleTableColumns
} = storeToRefs(monitorStore);

const { startMonitoring, stopMonitoring, removeAverageGroup } = monitorStore;

const chartRef = ref<InstanceType<typeof MonitorChart> | null>(null);
const tableRef = ref<InstanceType<typeof MonitorTable> | null>(null);
const isSettingsModalOpen = ref(false);

const handleRowClick = (row: StockQuote) => {
    if (row && row['股票代码'] && !row['股票代码'].startsWith('_AVG_')) {
        chartRef.value?.focusOnStock(row['股票代码']);
    }
};

const handleExport = () => {
    tableRef.value?.exportToExcel();
    ElMessage.success("数据已导出为 Excel 文件。");
};

const handleAlertClick = (stock: any) => {
    ElMessage.info(`为 ${stock['名称']} (${stock['股票代码']}) 设置告警的功能正在开发中...`);
};
</script>

<template>
  <div class="monitor-page-container">
    <MonitorToolbar
      :is-loading="isLoading"
      :is-monitoring="isMonitoring"
      :last-update-time="lastUpdateTime"
      @open-settings="isSettingsModalOpen = true"
      @start-monitoring="startMonitoring"
      @stop-monitoring="stopMonitoring"
      @open-avg-calculator="isSettingsModalOpen = true"
      @export-excel="handleExport"
    />

    <div class="table-wrapper">
        <el-table :data="stockListForTable" stripe border height="100%" v-loading="isLoading" row-key="股票代码" @row-click="handleRowClick">
          <el-table-column
            v-for="column in visibleTableColumns"
            :key="column.field"
            :prop="column.field"
            :label="column.title"
            :fixed="column.field === '名称' ? 'left' : undefined"
            min-width="150"
          >
            <template #default="{ row }">
              <span v-if="row['股票代码']?.startsWith('_AVG_') && column.field === '名称'">
                  <el-popconfirm title="确定删除这个分组吗?" @confirm="removeAverageGroup(row['股票代码'])">
                      <template #reference><el-button type="danger" link>✖</el-button></template>
                  </el-popconfirm>
                  {{ row[column.field] }}
              </span>
              <span v-else-if="['最新价', '涨跌幅(%)', '涨跌额'].includes(column.field)"
                    :class="row['涨跌幅(%)'] > 0 ? 'color-red' : row['涨跌幅(%)'] < 0 ? 'color-green' : ''">
                {{ typeof row[column.field] === 'number' ? row[column.field].toFixed(2) : '--' }}{{ column.suffix || (column.field.includes('%') ? '%' : '') }}
              </span>
              <span v-else>
                  {{ typeof row[column.field] === 'number' ? row[column.field].toFixed(2) : (row[column.field] || '--') }}{{ column.suffix || '' }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-tooltip v-if="!row['股票代码']?.startsWith('_AVG_')" content="设置告警">
                  <el-button :icon="Bell" @click.stop="handleAlertClick(row)" circle />
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>

    <SettingsModal v-model:modelValue="isSettingsModalOpen" />
  </div>
</template>

<style scoped>
.monitor-page-container { width: 100%; height: 100%; display: flex; flex-direction: column; }
.content-wrapper { flex-grow: 1; display: flex; flex-direction: column; min-height: 0; }
.chart-container { height: 45%; flex-shrink: 0; padding: 0.5rem; background-color: #0f172a; }
.table-container { flex-grow: 1; min-height: 0; }
.color-red { color: #ef4444 !important; font-weight: 500; }
.color-green { color: #22c55e !important; font-weight: 500; }
:deep(.avg-row-cell) {
    background-color: #3730a3 !important;
    font-weight: bold;
    color: #e0e7ff !important;
}
:deep(.delete-avg-btn) {
    background: none;
    border: none;
    color: #f87171;
    cursor: pointer;
    margin-right: 8px;
    font-size: 1.2em;
    padding: 0;
    line-height: 1;
}
:deep(.delete-avg-btn:hover) {
    color: #ef4444;
}
</style>
