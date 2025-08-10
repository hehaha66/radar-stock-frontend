<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';

const userStore = useUserStore();

const codes = ref('000001.SH,TSLA');
const interval = ref(userStore.userInfo?.min_interval || 3);
const isMonitoring = ref(false);
const eventSource = ref<EventSource | null>(null);
const latestData = ref<any[]>([]);
const connectionStatus = ref('未连接');

const startMonitoring = () => {
  if (!userStore.token) {
    ElMessage.error('请先登录');
    return;
  }

  if (!codes.value.trim()) {
    ElMessage.error('请输入股票代码');
    return;
  }

  // 检查权限限制
  const codeCount = codes.value.split(',').filter(code => code.trim()).length;
  if (userStore.userInfo?.max_codes && codeCount > userStore.userInfo.max_codes) {
    ElMessage.error(`超出最大监控数量限制 (${userStore.userInfo.max_codes} 只)`);
    return;
  }

  if (userStore.userInfo?.min_interval && interval.value < userStore.userInfo.min_interval) {
    ElMessage.error(`刷新间隔不能低于 ${userStore.userInfo.min_interval} 秒`);
    return;
  }

  stopMonitoring(); // 先停止之前的连接

  const url = `/api/monitor/sse/market-data?codes=${encodeURIComponent(codes.value)}&interval=${interval.value}&token=${userStore.apiToken}`;

  eventSource.value = new EventSource(url);
  isMonitoring.value = true;
  connectionStatus.value = '连接中...';

  eventSource.value.onopen = () => {
    connectionStatus.value = '已连接';
    ElMessage.success('实时数据监控已启动');
  };

  eventSource.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.data && Array.isArray(data.data)) {
        latestData.value = data.data;
      }
    } catch (error) {
      console.error('解析数据失败:', error);
    }
  };

  eventSource.value.onerror = () => {
    connectionStatus.value = '连接失败';
    ElMessage.error('连接失败，请检查网络或重新登录');
    stopMonitoring();
  };
};

const stopMonitoring = () => {
  if (eventSource.value) {
    eventSource.value.close();
    eventSource.value = null;
  }
  isMonitoring.value = false;
  connectionStatus.value = '未连接';
};

onBeforeUnmount(() => {
  stopMonitoring();
});
</script>

<template>
  <div class="monitor-view">
    <div class="monitor-controls">
      <h2>实时数据监控</h2>
      <el-form label-position="top">
        <el-form-item :label="`股票代码 (最多 ${userStore.userInfo?.max_codes || 'N/A'} 只)`">
          <el-input v-model="codes" placeholder="例如: 000001.SH,TSLA.US" />
        </el-form-item>
        <el-form-item :label="`刷新间隔 (最低 ${userStore.userInfo?.min_interval || 'N/A'} 秒)`">
          <el-input-number v-model="interval" :min="userStore.userInfo?.min_interval || 0.1" :step="0.1" />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="startMonitoring"
            :loading="isMonitoring"
            :disabled="!userStore.isLoggedIn"
          >
            {{ isMonitoring ? '监控中...' : '开始监控' }}
          </el-button>
          <el-button
            type="danger"
            @click="stopMonitoring"
            :disabled="!isMonitoring"
          >
            停止监控
          </el-button>
        </el-form-item>
        <el-form-item>
          <div class="status-info">
            <span>状态: {{ connectionStatus }}</span>
            <span v-if="userStore.userInfo">计划: {{ userStore.userInfo.plan }}</span>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="latestData.length > 0" class="data-display">
      <h3>实时数据 ({{ latestData.length }} 条)</h3>
      <el-table :data="latestData" stripe style="width: 100%">
        <el-table-column prop="a1" label="代码" width="100" />
        <el-table-column prop="a2" label="名称" width="120" />
        <el-table-column prop="a3" label="最新价" width="100" />
        <el-table-column prop="a4" label="涨跌幅(%)" width="120" />
        <el-table-column prop="a5" label="涨跌额" width="100" />
        <el-table-column prop="a6" label="成交额(亿)" width="120" />
        <el-table-column prop="a7" label="总市值(亿)" width="120" />
        <el-table-column prop="a8" label="流通市值(亿)" width="120" />
        <el-table-column prop="a9" label="市盈率" width="100" />
        <el-table-column prop="a10" label="市净率" width="100" />
      </el-table>
    </div>

    <div v-else-if="isMonitoring" class="no-data">
      <el-empty description="等待数据..." />
    </div>
  </div>
</template>

<style scoped>
.monitor-view {
  padding: 2rem;
  color: #e2e8f0;
}

.monitor-controls {
  max-width: 600px;
  margin: 0 auto 2rem;
  padding: 2rem;
  background: rgba(30, 41, 59, 0.7);
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.1);
}

.monitor-controls h2 {
  margin-bottom: 1.5rem;
  color: #f1f5f9;
}

.status-info {
  display: flex;
  gap: 2rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

.data-display {
  margin-top: 2rem;
}

.data-display h3 {
  margin-bottom: 1rem;
  color: #f1f5f9;
}

.no-data {
  margin-top: 2rem;
  text-align: center;
}

:deep(.el-table) {
  background-color: transparent !important;
}

:deep(.el-table th), :deep(.el-table tr) {
  background-color: transparent !important;
  color: #cbd5e1 !important;
  border-bottom: 1px solid #334155 !important;
}

:deep(.el-table td) {
  border-bottom: 1px solid #334155 !important;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background-color: #1a243b !important;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: #334155 !important;
}
</style>



