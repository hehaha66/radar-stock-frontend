<template>
  <div class="ai-stock-view" :class="{ 'started': hasStarted }">
    <div class="content-wrapper">
      <div class="controls-container">
        <h1>AI分析 条件选股</h1>
        <p class="description">{{ hasStarted ? ' ' : '输入您的选股条件，选择市场，即可获取实时获取分析结果。' }}</p>

        <div class="search-area">
          <div class="robot-container">
            <div class="robot-placeholder">🤖</div>
            <div class="speech-bubble" v-if="bubbleMessage">
              {{ bubbleMessage }}
            </div>
          </div>
          <div class="controls">
            <div class="input-wrapper">
              <el-input
                v-model="question"
                placeholder=""
                class="input-question"
                clearable
                :disabled="isLoading"
                @keyup.enter="handleQuery"
              />
              <div class="scan-light"></div>
            </div>
            <el-radio-group v-model="secondaryIntent" class="market-selector" :disabled="isLoading">
              <el-radio-button value="stock">A股</el-radio-button>
              <el-radio-button value="hkstock">港股</el-radio-button>
              <el-radio-button value="usstock">美股</el-radio-button>
            </el-radio-group>
            <el-button type="primary" @click="handleQuery" :loading="isLoading" class="query-btn">
              {{ isLoading ? '查询中...' : '查询' }}
            </el-button>
            <el-button type="success" @click="handleDownload" :loading="isDownloading" :disabled="!tableData.length || isLoading" class="query-btn">
              下载 Excel
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="hasStarted" class="results-container">
        <el-skeleton :rows="10" animated v-if="isLoading && !tableData.length" />

        <el-table
          :data="paginatedData"
          stripe
          class="data-table"
          v-if="tableData.length > 0"
        >
          <el-table-column v-for="col in columns" :key="col.prop" :prop="col.prop" :label="col.label" show-overflow-tooltip />
        </el-table>

        <el-empty
          description=" "
          v-if="!isLoading && tableData.length === 0"
        />

        <el-pagination
          v-if="tableData.length > 0"
          class="pagination"
          @current-change="handlePageChange"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="tableData.length"
          layout="total, prev, pager, next, jumper"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import * as XLSX from 'xlsx';

const userStore = useUserStore();

const question = ref('');
const secondaryIntent = ref('stock');
const tableData = ref<any[]>([]);
const columns = ref<{ prop: string; label: string; }[]>([]);
const isLoading = ref(false);
const isDownloading = ref(false);
const currentPage = ref(1);
const pageSize = 50;
const hasStarted = ref(false);
const bubbleMessage = ref('在右侧输入,例如：\n阳线, 成交量>10万, macd金叉');

let eventSource: EventSource | null = null;

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return tableData.value.slice(start, end);
});

const formatDataChunk = (data: any[]) => data.map(row => {
  const newRow = { ...row };
  for (const key in newRow) {
    if (typeof newRow[key] === 'number') newRow[key] = newRow[key].toFixed(2);
  }
  return newRow;
});

const closeEventSource = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    isLoading.value = false;
  }
};

const handleQuery = () => {
  if (!userStore.token) {
    bubbleMessage.value = '请先登录后再进行查询。';
    return;
  }
  if (!question.value.trim()) {
    bubbleMessage.value = '请输入查询条件。';
    return;
  }

  hasStarted.value = true;
  closeEventSource();
  tableData.value = [];
  columns.value = [];
  currentPage.value = 1;
  isLoading.value = true;
  bubbleMessage.value = '正在连接服务器...';

  const encodedQuestion = encodeURIComponent(question.value);
  const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/ai_stock/stream-query?question=${encodedQuestion}&secondary_intent=${secondaryIntent.value}&token=${userStore.token}`;

  eventSource = new EventSource(url);

  eventSource.onopen = () => {
    bubbleMessage.value = '已连接，正在获取数据...';
  };

  eventSource.addEventListener('data', (event) => {
    const dataChunk = JSON.parse(event.data);
    if (Array.isArray(dataChunk) && dataChunk.length > 0) {
      if (tableData.value.length === 0) {
        columns.value = Object.keys(dataChunk[0]).map(key => {
          const label = key.includes('@') ? key.split('@')[1] : key;
          return { prop: key, label: label };
        });
      }

      const formattedChunk = formatDataChunk(dataChunk);
      tableData.value.push(...formattedChunk);
      bubbleMessage.value = `已加载 ${tableData.value.length} 条数据...`;
    }
  });

  eventSource.addEventListener('done', (event) => {
    const { found } = JSON.parse(event.data);
    if (found) {
      bubbleMessage.value = `查询结束，共找到 ${tableData.value.length} 条数据。`;
    } else if (tableData.value.length === 0) {
      bubbleMessage.value = '未能找到匹配结果，请尝试更换条件。';
    } else {
      bubbleMessage.value = '查询结束。';
    }
    closeEventSource();
  });

  eventSource.addEventListener('stream_error', (event) => {
    const errorData = JSON.parse(event.data);
    bubbleMessage.value = `查询失败: ${errorData.message}`;
    closeEventSource();
  });

  eventSource.onerror = async () => {
    // 当发生错误时，主动探测一下后端状态，以区分是网络问题还是429错误
    try {
      const probeUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/ai_stock/stream-query?question=${encodeURIComponent(question.value)}&secondary_intent=${secondaryIntent.value}&token=${userStore.token}`;
      const response = await fetch(probeUrl, { method: 'HEAD' }); // 使用HEAD请求，更轻量
      if (response.status === 429) {
        bubbleMessage.value = '当前请求人数过多，请一分钟后再试。';
      } else {
        bubbleMessage.value = '当前请求人数过多，请一分钟后再试。';
      }
    } catch (e) {
      bubbleMessage.value = '当前请求人数过多，请一分钟后再试。';
    }
    closeEventSource();
  };
};

const handleDownload = () => {
  if (tableData.value.length === 0) {
    bubbleMessage.value = '没有数据可供下载。';
    return;
  }
  isDownloading.value = true;
  try {
    const worksheet = XLSX.utils.json_to_sheet(tableData.value);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AI选股结果');
    const fileName = `ai_stock_results_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    ElMessage.success('Excel 文件已开始下载！'); // 保留下载成功的全局提示
  } catch (error) {
    console.error('下载Excel失败:', error);
    bubbleMessage.value = '下载失败，请稍后重试。';
  } finally {
    isDownloading.value = false;
  }
};

const handlePageChange = (page: number) => { currentPage.value = page; };
onBeforeUnmount(closeEventSource);
</script>

<style scoped>
/* 机器人和气泡样式 */
.robot-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}

.speech-bubble {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1e293b;
  color: #cbd5e1;
  padding: 10px 15px;
  border-radius: 15px;
  border: 1px solid #334155;
  margin-bottom: 15px; /* 气泡和机器人之间的距离 */
  width: max-content;
  max-width: 300px;
  font-size: 0.875rem;
  z-index: 20;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  white-space: pre-wrap; /* 让 \n 生效 */
}

.speech-bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #1e293b;
}

/* 机器人手电筒动画效果 */
@keyframes scan {
  0% { transform: translateX(-100%) skewX(-30deg); }
  100% { transform: translateX(250%) skewX(-30deg); }
}

.search-area {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem; /* 在机器人和控件之间添加间隙 */
}

.robot-placeholder {
  font-size: 2.5rem;
  z-index: 10;
  animation: robot-bob 2s infinite ease-in-out;
  cursor: pointer;
}

@keyframes robot-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); } /* 调整浮动效果 */
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  width: 100%;
  max-width: 900px;
}

.input-wrapper {
  flex-grow: 1;
  position: relative;
  overflow: hidden; /* 隐藏超出范围的光束 */
  border-radius: 6px;
}

.input-question {
  width: 100%;
}

.scan-light {
  position: absolute;
  top: 0;
  left: 0;
  width: 100px; /* 光束宽度 */
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: scan 4s linear infinite;
  pointer-events: none; /* 确保不影响鼠标操作 */
}

/* 整体布局和视觉优化 */
.ai-stock-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
  padding: 2rem;
  background-color: #0f172a;
  transition: align-items 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-stock-view.started {
  align-items: flex-start;
}

.content-wrapper {
  width: 100%;
  max-width: 1200px;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.controls-container {
  text-align: center;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

.ai-stock-view.started .controls-container {
  text-align: left;
}

/* 字体和文案 */
h1 {
  font-size: 3.5rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 1rem;
}

.description {
  font-size: 1.125rem;
  color: #94a3b8;
  margin-bottom: 3rem;
}

/* 控件样式 */
:deep(.el-input__wrapper) {
  background-color: #1e293b !important;
  box-shadow: none !important;
  border: 1px solid #334155 !important;
  height: 40px;
  font-size: 1rem;
}
:deep(.el-input__inner) {
  color: #f1f5f9 !important;
}

:deep(.el-radio-button__inner) {
  background-color: #1e293b !important;
  border-color: #334155 !important;
  color: #94a3b8 !important;
  height: 40px;
  line-height: 26px;
  font-size: 1rem;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: #38bdf8 !important;
  border-color: #38bdf8 !important;
  color: #0f172a !important;
  box-shadow: none !important;
}

.query-btn {
  min-width: 100px;
  height: 40px;
  font-size: 1rem;
}

/* 结果区域 */
.results-container {
  margin-top: 2rem;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 表格和分页 */
.data-table { width: 100%; }
:deep(.el-table), :deep(.el-table__expanded-cell) { background-color: transparent !important; }
:deep(.el-table th), :deep(.el-table tr) { background-color: transparent !important; color: #cbd5e1 !important; border-bottom: 1px solid #334155 !important; }
:deep(.el-table td) { border-bottom: 1px solid #334155 !important; }
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) { background-color: #1a243b !important; }
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) { background-color: #334155 !important; }
:deep(.el-table__empty-block) { background-color: #1e293b !important; }
.pagination { margin-top: 1.5rem; display: flex; justify-content: center; }
:deep(.el-pagination button), :deep(.el-pager li) { background-color: transparent !important; color: #94a3b8 !important; }
:deep(.el-pager li.is-active) { color: #38bdf8 !important; }
:deep(.el-pagination .el-input__inner) { color: #f1f5f9 !important; }
:deep(.el-pagination .el-input__wrapper){ background-color: #1e293b !important; box-shadow: none !important; border: 1px solid #334155 !important; }
</style>
