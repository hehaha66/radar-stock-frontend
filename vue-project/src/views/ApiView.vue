<!-- 文件: src/views/ApiView.vue (最终布局修复版) -->

<template>
  <div class="api-docs-container">
    <!-- Login Wall: Show this if user is not logged in -->
    <el-card v-if="!userStore.isLoggedIn" shadow="never" class="login-prompt-card">
      <div class="login-prompt-content">
        <el-icon :size="50" color="#f56c6c"><WarningFilled /></el-icon>
        <h3 class="prompt-title">请先登录</h3>
        <p class="prompt-text">您需要登录后才能访问和测试 API 功能。</p>
        <router-link to="/login">
          <el-button type="primary" size="large">前往登录页面</el-button>
        </router-link>
      </div>
    </el-card>

    <!-- Main Content: Show this if user is logged in -->
    <div v-else class="workbench-grid">
      <!-- Left Column: API Navigation & Header -->
      <div class="api-nav-column">
        <div class="workbench-header">
          <h1><el-icon><Platform /></el-icon> 开发者工作台</h1>
          <p class="desc">一个交互式的 API 测试与集成环境。</p>
        </div>

        <el-card shadow="never" class="nav-card">
          <template #header><div class="card-header"><span>API 端点</span></div></template>
          <el-menu :default-active="activeView" @select="handleMenuSelect" class="api-menu">
            <el-sub-menu index="group-monitor">
              <template #title><el-icon><DataLine /></el-icon><span>实时监控</span></template>
              <el-menu-item index="sse">实时数据流 (SSE)</el-menu-item>
            </el-sub-menu>
            <el-sub-menu index="group-data">
              <template #title><el-icon><Histogram /></el-icon><span>历史数据</span></template>
              <el-menu-item index="history">K线数据</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-card>
      </div>

      <!-- Middle Column: Request Configuration & Response -->
      <div class="main-content-column">
        <transition name="fade" mode="out-in">
          <!-- SSE View -->
          <div v-if="activeView === 'sse'" key="sse-view" class="view-wrapper">
            <el-card shadow="never" class="request-card">
              <template #header><div class="card-header"><span><el-icon><Setting /></el-icon> 参数配置</span></div></template>
              <el-form :model="sseForm" label-position="top">
                <el-form-item :label="`股票代码 (最多 ${userPlanLimits.max_codes === -1 ? '无限制' : userPlanLimits.max_codes} 只)`">
                  <el-input v-model="sseForm.codes" :prefix-icon="Tickets" placeholder="例如: 000001,TSLA" />
                </el-form-item>
                <el-form-item :label="`刷新间隔 (最低 ${userPlanLimits.min_interval} 秒)`">
                  <el-input-number v-model="sseForm.interval" :min="userPlanLimits.min_interval" :step="0.1" style="width: 100%;"/>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="startSseStream" :disabled="isSseRunning" :icon="VideoPlay">开始获取</el-button>
                  <el-button type="danger" @click="stopSseStream" :disabled="!isSseRunning" :icon="SwitchButton">停止获取</el-button>
                </el-form-item>
              </el-form>
            </el-card>
            <el-card shadow="never" class="response-card">
              <template #header><div class="card-header"><span><el-icon><Monitor /></el-icon> 实时数据输出</span></div></template>
              <div class="output-wrapper">
                <pre class="output-log hljs"><code v-html="latestSseDataJson"></code></pre>
              </div>
            </el-card>
          </div>

          <!-- History View -->
          <div v-else-if="activeView === 'history'" key="history-view" class="view-wrapper">
            <el-card shadow="never" class="request-card">
              <template #header><div class="card-header"><span><el-icon><Setting /></el-icon> 参数配置</span></div></template>
              <el-form :model="historyParams" label-position="top">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="股票代码"><el-input v-model="historyParams.code" placeholder="例如: 600519" :prefix-icon="Tickets"/></el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="开始日期 (YYYYMMDD)"><el-input v-model="historyParams.start_date" placeholder="例如: 20230101" :prefix-icon="Calendar"/></el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="复权方式"><el-select v-model="historyParams.adjust" placeholder="选择" style="width: 100%;"><el-option label="前复权 (qfq)" value="qfq" /><el-option label="后复权 (hfq)" value="hfq" /></el-select></el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="周期"><el-select v-model="historyParams.period" placeholder="选择" style="width: 100%;"><el-option label="日 K" value="daily" /><el-option label="周 K" value="weekly" /><el-option label="月 K" value="monthly" /></el-select></el-form-item>
                  </el-col>
                </el-row>
                <el-form-item>
                  <el-button type="primary" @click="fetchHistoryData" :loading="isLoadingHistory" :icon="Search">发送请求</el-button>
                </el-form-item>
              </el-form>
            </el-card>
            <el-card shadow="never" class="response-card">
              <template #header><div class="card-header"><span><el-icon><Document /></el-icon> API 输出</span></div></template>
              <div class="output-wrapper">
                <el-button v-if="historyResponse && historyResponse.data?.length > 5" @click="isDataCollapsed = !isDataCollapsed" class="collapse-button" size="small" type="primary" plain>
                  {{ isDataCollapsed ? '展开数据' : '收起数据' }}
                </el-button>
                <pre v-if="historyResponse" class="output-log hljs"><code v-html="highlightedHistoryResponse"></code></pre>
                <div v-else class="placeholder">点击"发送请求"后，结果将显示在这里</div>
              </div>
            </el-card>
          </div>
        </transition>
      </div>

      <!-- Right Column: Code Snippets -->
      <div class="code-snippet-column">
        <transition name="fade" mode="out-in">
          <el-card v-if="activeView === 'sse'" shadow="never" class="code-card" key="sse-code">
            <template #header>
              <div class="card-header">
                <span><el-icon><Cpu /></el-icon> Python 请求代码</span>
                <el-radio-group v-model="sseCodeExampleFormat" size="small">
                  <el-radio-button label="中文名" value="verbose"></el-radio-button>
                  <el-radio-button label="aN 字段" value="aN"></el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="code-wrapper">
              <el-button class="copy-button" size="small" type="primary" plain :icon="sseCopied ? Check : CopyDocument" @click="copyCode(pythonSseCodeSnippet, 'sse')">
                {{ sseCopied ? '已复制' : '复制' }}
              </el-button>
              <pre class="code-snippet hljs"><code v-html="hljs.highlight(pythonSseCodeSnippet, { language: 'python' }).value"></code></pre>
            </div>
          </el-card>

          <el-card v-else-if="activeView === 'history'" shadow="never" class="code-card" key="history-code">
            <template #header><div class="card-header"><span><el-icon><Cpu /></el-icon> Python 请求代码</span></div></template>
            <div class="code-wrapper">
              <el-button class="copy-button" size="small" type="primary" plain :icon="historyCopied ? Check : CopyDocument" @click="copyCode(pythonHistoryCodeSnippet, 'history')">
                {{ historyCopied ? '已复制' : '复制' }}
              </el-button>
              <pre class="code-snippet hljs"><code v-html="hljs.highlight(pythonHistoryCodeSnippet, { language: 'python' }).value"></code></pre>
            </div>
          </el-card>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';
import { CopyDocument, WarningFilled, Check, Tickets, Calendar, Search, VideoPlay, SwitchButton, Platform, DataLine, Histogram, Setting, Monitor, Document, Cpu } from '@element-plus/icons-vue';
import hljs from 'highlight.js/lib/common';
import 'highlight.js/styles/atom-one-dark.css';
import { PLANS_CONFIG } from '@/config/plans';

const userStore = useUserStore();
const activeView = ref<'sse' | 'history'>('sse');
const sseCopied = ref(false);
const historyCopied = ref(false);

const userPlanLimits = computed(() => {
    const plan = userStore.userInfo?.plan || 'freemium';
    return PLANS_CONFIG[plan] || PLANS_CONFIG['freemium'];
});

const handleMenuSelect = (index: string) => {
  activeView.value = index as 'sse' | 'history';
};

const copyCode = (code: string, type: 'sse' | 'history') => {
    navigator.clipboard.writeText(code.trim());
    ElMessage.success('代码已复制到剪贴板！');
    const copiedRef = type === 'sse' ? sseCopied : historyCopied;
    copiedRef.value = true;
    setTimeout(() => copiedRef.value = false, 2000);
}

// ===================================================================
// Part 1: SSE Real-time Data Logic
// ===================================================================
const sseForm = ref({ codes: '000001,TSLA', interval: 10 });
const isSseRunning = ref(false);
const sseEventSource = ref<EventSource | null>(null);
const latestSseDataJson = ref<string>(hljs.highlight(JSON.stringify({ message: "等待连接..." }, null, 2), { language: 'json' }).value);
const sseCodeExampleFormat = ref<'verbose' | 'aN'>('verbose');

const FIELD_MAP: Record<string, string> = {
    'a1': '股票代码', 'a2': '名称', 'a3': '最新价', 'a4': '涨跌幅(%)', 'a5': '涨跌额', 'a6': '成交额(亿)', 'a7': '总市值(亿)', 'a8': '流通市值(亿)', 'a9': '市盈率', 'a10': '市净率', 'a11': '换手率(%)', 'a12': '总手(万)', 'a13': '净资产收益率(加权)', 'a14': '毛利率', 'a15': '所属行业板块', 'a16': '振幅(%)', 'a17': '量比', 'a18': '昨收', 'a19': '开盘价', 'a20': '最低价', 'a21': '最高价', 'a22': '主力净流入(亿)','a23': '大单流入(亿)', 'a24': '大单流出(亿)', 'a25': '超大单流入(亿)', 'a26': '超大单流出(亿)','a27': '中单流入(亿)', 'a28': '中单流出(亿)', 'a29': '小单流入(亿)', 'a30': '小单流出(亿)','a31': '上市日期', 'a32': '总股本(亿)', 'a33': '总负债(亿)', 'a34': '资产负债比率','a35': '市场类型代码', 'a36': '市场代码'
};

const processSseDataForDisplay = (dataList: Record<string, any>[]) => {
    if (!Array.isArray(dataList)) return dataList;
    return dataList.map(item => {
        const newItem: Record<string, any> = {};
        for (const key in item) { newItem[FIELD_MAP[key] || key] = item[key]; }
        return newItem;
    });
};

const pythonSseCodeSnippet = computed(() => {
  const staticToken = userStore.apiToken || 'YOUR_API_TOKEN_WILL_APPEAR_HERE';
  const baseUrl = window.location.origin;
  const fieldMapString = JSON.stringify(FIELD_MAP, null, 4).replace(/"/g, "'");
  const processFunction = `
FIELD_MAP = ${fieldMapString}
def process_data(data_list):
    processed = []
    if not isinstance(data_list, list): return data_list
    for item in data_list:
        new_item = {FIELD_MAP.get(k, k): v for k, v in item.items()}
        processed.append(new_item)
    return processed
`;
  return `import requests
import json
import sseclient
API_TOKEN = "${staticToken}"
STOCK_CODES = "${sseForm.value.codes}"
REFRESH_INTERVAL = ${sseForm.value.interval}
BASE_URL = "${baseUrl}"
${sseCodeExampleFormat.value === 'verbose' ? processFunction : ''}
def stream_realtime_data(codes, token, interval):
    url = f"{BASE_URL}/api/monitor/sse/market-data?codes={codes}&interval={interval}&token={token}"
    print(f"[*] 正在连接到: {url}")
    try:
        response = requests.get(url, stream=True, headers={'Accept': 'text/event-stream'})
        response.raise_for_status()
        client = sseclient.SSEClient(response)
        print("[+] 连接成功！等待数据流... (按 Ctrl+C 停止)")
        for event in client.events():
            if event.event == 'message' and event.data:
                try:
                    payload = json.loads(event.data)
                    if '${sseCodeExampleFormat.value}' == 'verbose' and 'data' in payload:
                        payload['data'] = process_data(payload.get('data', []))
                    print("----------------------------------------")
                    print(json.dumps(payload, indent=4, ensure_ascii=False))
                except json.JSONDecodeError:
                    print(f"[!] 收到无法解析的 JSON 数据: {event.data}")
    except Exception as e:
        print(f"[-] 发生错误: {e}")
if __name__ == "__main__":
    stream_realtime_data(STOCK_CODES, API_TOKEN, REFRESH_INTERVAL)
`.trim();
});

const startSseStream = () => {
  if (isSseRunning.value) return;
  if (!userStore.apiToken) { ElMessage.error('无法获取 API Token，请重新登录！'); return; }
  isSseRunning.value = true;
  latestSseDataJson.value = hljs.highlight(JSON.stringify({ message: "正在连接..." }, null, 2), { language: 'json' }).value;
  const url = `/api/monitor/sse/market-data?codes=${encodeURIComponent(sseForm.value.codes)}&interval=${sseForm.value.interval}&token=${userStore.apiToken}`;
  sseEventSource.value = new EventSource(url);
  sseEventSource.value.onopen = () => { latestSseDataJson.value = hljs.highlight(JSON.stringify({ message: "连接成功！等待数据..." }, null, 2), { language: 'json' }).value; };
  sseEventSource.value.onmessage = (event) => {
    try {
      if (event.data) {
        const parsedData = JSON.parse(event.data);
        if (parsedData.data) { parsedData.data = processSseDataForDisplay(parsedData.data); }
        latestSseDataJson.value = hljs.highlight(JSON.stringify(parsedData, null, 2), { language: 'json' }).value;
      }
    } catch (e) { latestSseDataJson.value = hljs.highlight(`# [!] 收到无法解析的数据:\n${event.data}`, { language: 'plaintext' }).value; }
  };
  sseEventSource.value.onerror = (event: Event) => {
    console.error("SSE 连接发生错误:", event);
    latestSseDataJson.value = hljs.highlight(`# [-] 连接失败或中断。请检查浏览器控制台获取详细信息。`, { language: 'plaintext' }).value;
    stopSseStream();
  };
};

const stopSseStream = () => {
  if (sseEventSource.value) { sseEventSource.value.close(); sseEventSource.value = null; }
  if (isSseRunning.value) { latestSseDataJson.value = hljs.highlight(JSON.stringify({ message: "已断开连接。" }, null, 2), { language: 'json' }).value; }
  isSseRunning.value = false;
};
onUnmounted(stopSseStream);

// ===================================================================
// Part 2: Historical K-line Data Logic
// ===================================================================
const isLoadingHistory = ref(false);
const historyResponse = ref<any>(null);
const isDataCollapsed = ref(true);
const historyParams = ref({ code: '600519', start_date: '20230101', adjust: 'qfq', period: 'daily' });

const fetchHistoryData = async () => {
  if (!userStore.apiToken) { ElMessage.error('无法获取 API Token，请重新登录！'); return; }
  isLoadingHistory.value = true;
  historyResponse.value = null;
  isDataCollapsed.value = true;
  try {
    const url = `/api/data/download-history`;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const params = new URLSearchParams({
      codes: historyParams.value.code,
      start_date: historyParams.value.start_date,
      end_date: today,
      adjust: historyParams.value.adjust,
      period: historyParams.value.period,
      token: userStore.apiToken,
    });
    const response = await fetch(`${url}?${params.toString()}`);
    const responseData = await response.json();
    if (!response.ok) { throw new Error(responseData.msg || `HTTP error! status: ${response.status}`); }
    historyResponse.value = responseData;
  } catch (error: any) {
    ElMessage.error(error.message || '获取历史数据失败');
    historyResponse.value = { error: error.message };
  } finally {
    isLoadingHistory.value = false;
  }
};

const highlightedHistoryResponse = computed(() => {
  if (!historyResponse.value) return '';
  let dataToDisplay = { ...historyResponse.value };
  if (isDataCollapsed.value && Array.isArray(dataToDisplay.data) && dataToDisplay.data.length > 5) {
    dataToDisplay = { ...dataToDisplay, data: [ ...dataToDisplay.data.slice(0, 5), { "..." : `更多 ${dataToDisplay.data.length - 5} 条记录，请点击“展开数据”查看` } ] };
  }
  return hljs.highlight(JSON.stringify(dataToDisplay, null, 2), { language: 'json' }).value;
});

const pythonHistoryCodeSnippet = computed(() => {
  const staticToken = userStore.apiToken || 'YOUR_API_TOKEN_WILL_APPEAR_HERE';
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const baseUrl = window.location.origin;
  return `import requests
import json
API_TOKEN = "${staticToken}"
BASE_URL = "${baseUrl}"
url = f"{BASE_URL}/api/data/download-history"
params = {
    "codes": "${historyParams.value.code}",
    "start_date": "${historyParams.value.start_date}",
    "end_date": "${today}",
    "adjust": "${historyParams.value.adjust}",
    "period": "${historyParams.value.period}",
    "token": API_TOKEN
}
try:
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    print(json.dumps(data, indent=4, ensure_ascii=False))
except Exception as e:
    print(f"请求失败: {e}")
`.trim();
});
</script>

<style scoped>
/* 引入编程字体 */
@import url('https://fonts.googleapis.com/css2?family=Fira+Code&display=swap');

.api-docs-container { padding: 2rem; max-width: 100%; margin: 0 auto; }

/* --- Login Wall --- */
.login-prompt-card { text-align: center; background-color: rgba(30, 41, 59, 0.5); border-color: rgba(248, 113, 113, 0.3); }
.login-prompt-content { padding: 2rem; }
.prompt-title { font-size: 1.5rem; font-weight: 600; margin: 1rem 0; color: #f87171; }
.prompt-text { margin-bottom: 1.5rem; color: #cbd5e1; }

/* --- Workbench Layout --- */
.workbench-grid { display: grid; grid-template-columns: 320px 1fr 1fr; gap: 2rem; height: calc(100vh - 4rem - 20px); }
.api-nav-column, .main-content-column, .code-snippet-column { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.main-content-column { gap: 2rem; }
.view-wrapper { display: flex; flex-direction: column; gap: 2rem; height: 100%; overflow: hidden; }

/* --- Cards --- */
.nav-card, .request-card, .response-card, .code-card { background-color: rgba(30, 41, 59, 0.5); border: 1px solid rgba(51, 65, 85, 0.7); backdrop-filter: blur(12px); display: flex; flex-direction: column; }
.request-card { flex-shrink: 0; }
.response-card { flex-grow: 1; min-height: 200px; overflow: hidden; }
.code-card { height: 100%; position: relative; }
:deep(.el-card__header) { border-bottom-color: rgba(51, 65, 85, 0.7); padding: 16px 20px; }
:deep(.el-card__body) { padding: 0; flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }

/* --- Card Header --- */
.card-header { font-size: 1.1rem; font-weight: 600; color: #d1d5db; display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 1rem; }
.card-header > span { display: flex; align-items: center; gap: 0.5rem; margin-right: auto; }

/* --- Left Column: Header & Menu --- */
.api-nav-column .workbench-header { text-align: left; margin-bottom: 2rem; padding: 0 1rem; }
.api-nav-column h1 { font-size: 2rem; display: flex; align-items: center; gap: 0.75rem; color: #e5e7eb; margin: 0 0 0.5rem 0; }
.api-nav-column .desc { color: #9ca3af; font-size: 1rem; line-height: 1.5; }
.api-menu { background: transparent; border-right: none; }
:deep(.el-sub-menu__title), :deep(.el-menu-item) { background-color: transparent !important; color: #9ca3af !important; }
:deep(.el-menu-item.is-active) { color: var(--el-color-primary) !important; }
:deep(.el-menu-item:hover), :deep(.el-sub-menu__title:hover) { background-color: rgba(255,255,255,0.05) !important; }

/* --- Middle & Right Columns --- */
.output-wrapper, .code-wrapper { flex-grow: 1; position: relative; display: flex; flex-direction: column; height: 100%; }
.placeholder { flex-grow: 1; display: flex; align-items: center; justify-content: center; color: #64748b; font-style: italic; padding: 20px; }
.output-log, .code-snippet { font-family: 'Fira Code', monospace; font-size: 14px; background-color: rgba(17, 24, 39, 0.8) !important; padding: 20px; text-align: left; white-space: pre-wrap; word-wrap: break-word; width: 100%; box-sizing: border-box; color: #d1d5db; flex-grow: 1; overflow: auto; }
.copy-button, .collapse-button { position: absolute; top: 12px; right: 20px; z-index: 10; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease-in-out; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
