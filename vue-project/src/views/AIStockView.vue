<!-- 文件: src/views/AIStockView.vue (视觉与交互终极版) -->

<template>
  <div class="ai-stock-view" :class="{ 'centered': !searchWasTriggered }">
    <div class="content-wrapper">
      <div class="controls-container">
        <!-- 标题区域，只在初始状态显示 -->
        <h1 v-if="!searchWasTriggered">AI分析 条件选股</h1>
        <p class="description" v-if="!searchWasTriggered">输入您的选股条件，选择市场，即可获取实时分析结果。</p>

        <!-- 搜索控件 Wrapper -->
        <div class="search-controls-wrapper" :class="{'loading': isLoading}">
          <!-- 机器人和气泡现在是输入框的一部分 -->
          <div class="robot-prefix-area">
            <div class="robot-placeholder" @click="changeRobotTip()">🤖</div>
            <div class="robot-bubble" :class="{ 'error': isErrorState }" v-if="robotTip">
              {{ robotTip }}
            </div>
          </div>

          <div class="input-wrapper">
            <el-input
              v-model="question"
              class="main-search-input"
              @keyup.enter="handleSearch"
              :disabled="isLoading"
              placeholder=""
            />
            <div class="scan-light"></div>
          </div>

          <el-radio-group v-model="secondaryIntent" :disabled="isLoading">
            <el-radio-button value="stock">A股</el-radio-button>
            <el-radio-button value="hkstock">港股</el-radio-button>
            <el-radio-button value="usstock">美股</el-radio-button>
          </el-radio-group>

          <div class="action-buttons">
            <el-button @click="handleSearch" :loading="isLoading" type="primary">开始分析</el-button>
            <el-button @click="downloadExcel" :disabled="searchResults.length === 0" type="success">下载 Excel</el-button>
          </div>
        </div>
      </div>

      <!-- 结果区域 (保持不变) -->
      <div v-if="searchWasTriggered" class="results-container">
         <div v-if="isLoading" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>
        <div v-else-if="searchResults.length > 0">
          <div class="results-header">
            <div class="results-summary">
              共 {{ searchResults.length }} 条结果
            </div>
            <el-pagination
              v-if="searchResults.length > pageSize"
              background
              small
              layout="sizes, prev, pager, next"
              :total="searchResults.length"
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[50, 100, 200]"
            />
          </div>
          <el-table :data="paginatedResults" stripe style="width: 100%">
             <el-table-column
                v-for="col in columns"
                :key="col.prop"
                :prop="col.prop"
                :label="col.label"
                show-overflow-tooltip
                />
          </el-table>
        </div>
        <div v-else-if="!isLoading && !isErrorState">
           <el-empty description="未能找到匹配结果" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useUserStore } from '@/stores/user';
import * as XLSX from 'xlsx';

// --- 状态与常量 ---
const userStore = useUserStore();
const question = ref(''); // 默认值为空字符串
const secondaryIntent = ref('stock');
const isLoading = ref(false);
const searchResults = ref<any[]>([]);
const columns = ref<{ prop: string; label: string; }[]>([]);
const searchWasTriggered = ref(false);
const currentPage = ref(1);
const pageSize = ref(100);
const robotTip = ref('');
let tipInterval: number | null = null;
let tipTimeout: number | null = null;

const TIPS = {
  general: [
    "我可以理解自然语言，试试输入“市盈率小于30，净资产收益率大于15%”...",
    "支持A股、港股、美股市场切换哦。",
    "查询结果支持一键导出为 Excel 文件。",
    "点击我可以切换提示哦！"
  ],
  loading: "正在连接AI分析引擎，请稍候，数据即将呈现...",
  success: (count: number) => `分析完成！共为您找到 ${count} 条结果。`,
  no_result: "未能找到匹配结果，也许换个条件能发现新大陆？",
  export_first: "请先查询并获取数据后，才能导出哦！",
  unknown_error: "查询时发生未知错误，请检查网络或联系管理员。",
  connection_error: "与服务器的连接中断或查询超时。"
};

// --- 计算属性 ---
const searchError = ref(''); // 用于触发 isErrorState
const hasSearched = computed(() => searchWasTriggered.value);
const isErrorState = computed(() => !!searchError.value);
const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return searchResults.value.slice(start, end);
});

// --- 函数 ---
const changeRobotTip = (message?: string | { type: 'success', count: number }) => {
  if (tipTimeout) clearTimeout(tipTimeout);
  if (tipInterval) clearInterval(tipInterval);

  searchError.value = ''; // 默认清除错误状态

  if (typeof message === 'string') {
    robotTip.value = message;
  } else if (typeof message === 'object' && message.type === 'success') {
    robotTip.value = TIPS.success(message.count);
  } else {
    const currentIndex = TIPS.general.indexOf(robotTip.value);
    const nextIndex = (currentIndex + 1) % TIPS.general.length;
    robotTip.value = TIPS.general[nextIndex];
    return;
  }

  tipTimeout = window.setTimeout(() => {
    tipInterval = window.setInterval(() => changeRobotTip(), 7000);
    changeRobotTip();
  }, 10000);
};

let eventSource: EventSource | null = null;
const closeEventSource = () => { if (eventSource) { eventSource.close(); eventSource = null; }};

const handleSearch = () => {
  if (!question.value) { changeRobotTip("请输入查询条件再开始分析哦。"); return; }

  currentPage.value = 1;
  searchResults.value = [];
  columns.value = [];
  isLoading.value = true;
  searchWasTriggered.value = true;
  changeRobotTip(TIPS.loading);

  closeEventSource();

  const apiToken = userStore.apiToken;
  if (!apiToken) {
    const msg = "无法获取 API Token，请重新登录。";
    changeRobotTip(msg);
    searchError.value = msg;
    isLoading.value = false;
    return;
  }

  const url = `/api/ai_stock/stream-query?question=${encodeURIComponent(question.value)}&secondary_intent=${encodeURIComponent(secondaryIntent.value)}&token=${apiToken}`;
  eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const dataChunk = JSON.parse(event.data);
      if (Array.isArray(dataChunk) && dataChunk.length > 0) {
        if (columns.value.length === 0) {
          columns.value = Object.keys(dataChunk[0]).map(key => ({
            prop: key,
            label: key.includes('@') ? key.split('@')[1] : key,
          }));
        }
        searchResults.value.push(...dataChunk);
      }
    } catch (e) { console.error('Error parsing SSE message data:', e); }
  };

  eventSource.addEventListener('done', () => {
    isLoading.value = false;
    closeEventSource();
    if (searchResults.value.length > 0) {
      changeRobotTip({ type: 'success', count: searchResults.value.length });
    } else {
      changeRobotTip(TIPS.no_result);
      searchError.value = TIPS.no_result;
    }
  });

  eventSource.addEventListener('error', (event: MessageEvent) => {
    isLoading.value = false;
    closeEventSource();
    let msg = TIPS.unknown_error;
    if (event.data) {
        try {
            const data = JSON.parse(event.data);
            msg = data.message || TIPS.unknown_error;
        } catch(e) { /* use default */ }
    }
    changeRobotTip(msg);
    searchError.value = msg;
  });

  eventSource.onerror = () => {
    if (isLoading.value) {
        changeRobotTip(TIPS.connection_error);
        searchError.value = TIPS.connection_error;
    }
    isLoading.value = false;
    closeEventSource();
  };
};

const downloadExcel = () => {
  if (searchResults.value.length === 0) {
    changeRobotTip(TIPS.export_first);
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(searchResults.value);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'AI选股结果');
  XLSX.writeFile(workbook, `ai_stock_results_${new Date().toISOString().slice(0,10)}.xlsx`);
};

onMounted(() => {
  robotTip.value = TIPS.general[0];
  tipInterval = window.setInterval(changeRobotTip, 7000);
});

onBeforeUnmount(() => {
  if (tipInterval) clearInterval(tipInterval);
  if (tipTimeout) clearTimeout(tipTimeout);
  closeEventSource();
});
</script>

<style scoped>
/* 动画与动态布局 */
.ai-stock-view {
  padding: 2rem;
  background-color: #0f172a;
  transition: padding-top 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.ai-stock-view.centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px); /* 减去 Header 高度 */
}
.content-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; }
.controls-container { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
.ai-stock-view:not(.centered) .controls-container { padding-bottom: 2rem; border-bottom: 1px solid #1e293b; }

/* 标题 */
h1 { font-size: 3.5rem; font-weight: 700; color: #f1f5f9; margin: 0; }
.description { font-size: 1.125rem; color: #94a3b8; margin: 0; min-height: 27px; }

/* 机器人和气泡 */
.robot-prefix-area {
  position: relative;
  display: flex;
  align-items: center;
  margin-left: -3rem; /* 将机器人移出 wrapper */
  padding-right: 0.5rem;
}
.robot-placeholder {
  font-size: 1.5rem;
  cursor: pointer;
  animation: robot-bob 2s infinite ease-in-out; /* 恢复跳动动画 */
}
@keyframes robot-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.robot-bubble {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 25px; /* 增加与机器人的距离 */
  background-color: #1e293b;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  width: max-content;
  max-width: 350px;
  text-align: center;
  line-height: 1.5;
  opacity: 0;
  animation: bubble-fade-in 0.5s 0.2s forwards;
  pointer-events: none;
}
.robot-bubble::after { /* 气泡小尾巴 */
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-width: 8px;
  border-style: solid;
  border-color: #1e293b transparent transparent transparent;
}
@keyframes bubble-fade-in { to { opacity: 1; } }

.robot-bubble.error { background-color: #372828; border-color: #7f1d1d; color: #fca5a5; }
.robot-bubble.error::after { border-top-color: #372828; }

/* 超级输入框 Wrapper */
.search-controls-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(10px);
  padding: 0.5rem 0.5rem 0.5rem 0.25rem;
  border-radius: 8px;
  border: 1px solid #334155;
  transition: all 0.3s ease-in-out;
  width: 100%;
  max-width: 1000px;
  position: relative;
  margin-left: 2rem;
  margin-top: 60px;
}
.search-controls-wrapper:focus-within { border-color: var(--el-color-primary); box-shadow: 0 0 0 1px var(--el-color-primary); }

/* Wrapper 内的控件 */
.input-wrapper { flex-grow: 1; position: relative; overflow: hidden; }
.main-search-input { height: 40px; }
:deep(.main-search-input .el-input__wrapper) { background-color: transparent !important; box-shadow: none !important; border: none !important; padding: 0 !important; }
:deep(.main-search-input .el-input__inner) { color: #f1f5f9 !important; font-size: 1rem; }

/* 扫描光效 */
.scan-light { position: absolute; top: 0; left: 0; width: 80px; height: 100%; background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.3), transparent); animation: scan 4s linear infinite; pointer-events: none; }
.search-controls-wrapper.loading .scan-light { animation-duration: 1.5s; }
@keyframes scan { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(1200%) skewX(-20deg); } }

/* 按钮组 */
.el-radio-group { display: inline-flex; }
:deep(.el-radio-button__inner) { background-color: transparent !important; border-color: #334155 !important; color: #94a3b8 !important; height: 40px; line-height: 24px; }
:deep(.el-radio-button:first-child .el-radio-button__inner) { border-left-color: #334155; }
:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) { background: var(--el-color-primary) !important; border-color: var(--el-color-primary) !important; color: #0f172a !important; box-shadow: -1px 0 0 0 var(--el-color-primary); }
.action-buttons { display: flex; gap: 0.5rem; }
.action-buttons .el-button { height: 40px; }

/* 结果区域 */
.results-container { margin-top: 2rem; opacity: 0; animation: fadeIn 0.5s 0.3s ease-out forwards; }
@keyframes fadeIn { to { opacity: 1; } }
.results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.results-summary { color: #94a3b8; margin-right: auto; }
.loading-container { width: 100%; }
:deep(.el-table), :deep(.el-table__expanded-cell) { background-color: transparent !important; }
:deep(.el-table th), :deep(.el-table tr) { background-color: transparent !important; color: #cbd5e1 !important; border-bottom: 1px solid #334155 !important; }
:deep(.el-table td) { border-bottom: 1px solid #334155 !important; }
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) { background-color: #1a243b !important; }
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) { background-color: #334155 !important; }
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled):hover) { color: #38bdf8; }
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) { background-color: #38bdf8; color: #0f172a; }
</style>
