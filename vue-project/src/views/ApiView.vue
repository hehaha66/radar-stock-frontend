<template>
  <div class="api-page-container">
    <!-- Aurora Background Glow -->
    <div class="aurora-glow aurora-glow-1"></div>
    <div class="aurora-glow aurora-glow-2"></div>
    <div class="aurora-glow aurora-glow-3"></div>

    <!-- Login Wall: Unchanged -->
    <div v-if="!userStore.isLoggedIn" class="login-prompt-wrapper">
      <el-card shadow="never" class="login-prompt-card">
        <div class="login-prompt-content">
          <el-icon :size="50" color="#f56c6c"><WarningFilled /></el-icon>
          <h3 class="prompt-title">请先登录</h3>
          <p class="prompt-text">您需要登录后才能访问和测试 API 功能。</p>
          <router-link to="/login">
            <el-button type="primary" size="large">前往登录页面</el-button>
          </router-link>
        </div>
      </el-card>
    </div>

    <!-- Main Content: Refined Three-Column Layout -->
    <div v-else class="workbench-grid">
      <!-- Left Column: API Navigation & Header -->
      <aside class="api-nav-column">
        <div class="workbench-header">
          <h1><el-icon><Platform /></el-icon> 开发者工作台</h1>
          <p class="desc">一个交互式的 API 测试与集成环境。</p>
        </div>
        <div class="api-card nav-card">
          <h3 class="card-title"><el-icon><Guide /></el-icon> API 端点</h3>
          <el-menu :default-active="activeView" @select="handleMenuSelect" class="api-menu">
            <el-sub-menu index="group-monitor">
              <template #title><el-icon><DataLine /></el-icon><span>实时监控</span></template>
              <el-menu-item index="sse">实时数据</el-menu-item>
            </el-sub-menu>
            <el-sub-menu index="group-data">
              <template #title><el-icon><Histogram /></el-icon><span>历史数据</span></template>
              <el-menu-item index="history">K线数据</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
      </aside>

      <!-- Middle Column: Request Configuration & Response -->
      <main class="main-content-column">
        <transition name="view-fade" mode="out-in">
          <!-- SSE View -->
          <div v-if="activeView === 'sse'" key="sse-view" class="view-wrapper">
            <div class="api-card request-card">
              <h3 class="card-title"><el-icon><Setting /></el-icon> 参数配置</h3>
              <el-form :model="sseForm" label-position="top">
                <el-form-item :label="`股票代码 (最多 ${userPlanLimits.max_codes === -1 ? '无限制' : userPlanLimits.max_codes} 只)`">
                  <el-input v-model="sseForm.codes" :prefix-icon="Tickets" placeholder="例如: 000001,TSLA" />
                </el-form-item>
                <el-form-item :label="`刷新间隔 (最低 ${userPlanLimits.min_interval} 秒)`">
                  <el-input-number v-model="sseForm.interval" :min="userPlanLimits.min_interval" :step="0.1" style="width: 100%;"/>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="large" @click="startSseStream" :disabled="isSseRunning" :icon="VideoPlay">开始获取</el-button>
                  <el-button type="danger" plain @click="stopSseStream" :disabled="!isSseRunning" :icon="SwitchButton">停止获取</el-button>
                </el-form-item>
              </el-form>
            </div>
            <div class="api-card response-card">
              <h3 class="card-title"><el-icon><Monitor /></el-icon> 实时数据输出</h3>
              <div class="output-wrapper">
                <pre class="output-log hljs"><code v-html="latestSseDataJson"></code></pre>
              </div>
            </div>
          </div>

          <!-- History View -->
          <div v-else-if="activeView === 'history'" key="history-view" class="view-wrapper">
            <div class="api-card request-card">
              <h3 class="card-title"><el-icon><Setting /></el-icon> 参数配置</h3>
              <el-form :model="historyParams" label-position="top">
                <el-row :gutter="20">
                  <el-col :span="12"><el-form-item label="股票代码"><el-input v-model="historyParams.code" placeholder="例如: 600519" :prefix-icon="Tickets"/></el-form-item></el-col>
                  <el-col :span="12"><el-form-item label="开始日期 (YYYYMMDD)"><el-input v-model="historyParams.start_date" placeholder="例如: 20230101" :prefix-icon="Calendar"/></el-form-item></el-col>
                  <el-col :span="12"><el-form-item label="复权方式"><el-select v-model="historyParams.adjust" placeholder="选择" style="width: 100%;"><el-option label="前复权 (qfq)" value="qfq" /><el-option label="后复权 (hfq)" value="hfq" /></el-select></el-form-item></el-col>
                  <el-col :span="12"><el-form-item label="周期"><el-select v-model="historyParams.period" placeholder="选择" style="width: 100%;"><el-option label="日 K" value="daily" /><el-option label="周 K" value="weekly" /><el-option label="月 K" value="monthly" /></el-select></el-form-item></el-col>
                </el-row>
                <el-form-item><el-button type="primary" size="large" @click="fetchHistoryData" :loading="isLoadingHistory" :icon="Search">发送请求</el-button></el-form-item>
              </el-form>
            </div>
            <div class="api-card response-card">
              <h3 class="card-title"><el-icon><Document /></el-icon> API 输出</h3>
              <div class="output-wrapper">
                <el-button v-if="historyResponse && historyResponse.data?.length > 5" @click="isDataCollapsed = !isDataCollapsed" class="collapse-button" size="small" type="primary" plain>{{ isDataCollapsed ? '展开数据' : '收起数据' }}</el-button>
                <pre v-if="historyResponse" class="output-log hljs"><code v-html="highlightedHistoryResponse"></code></pre>
                <div v-else class="placeholder">点击"发送请求"后，结果将显示在这里</div>
              </div>
            </div>
          </div>
        </transition>
      </main>

      <!-- Right Column: Code Snippets -->
      <aside class="code-snippet-column">
        <transition name="view-fade" mode="out-in">
          <div v-if="activeView === 'sse'" class="api-card code-card" key="sse-code">
            <div class="code-card-header">
              <h3 class="card-title"><el-icon><Cpu /></el-icon> Python 请求代码</h3>
              <el-radio-group v-model="sseCodeExampleFormat" size="small">
                <el-radio-button label="中文名" value="verbose"></el-radio-button>
                <el-radio-button label="aN 字段" value="aN"></el-radio-button>
              </el-radio-group>
            </div>
            <div class="code-wrapper">
              <el-button class="copy-button" size="small" type="primary" plain :icon="sseCopied ? Check : CopyDocument" @click="copyCode(pythonSseCodeSnippet, 'sse')">{{ sseCopied ? '已复制' : '复制' }}</el-button>
              <pre class="code-snippet hljs"><code v-html="hljs.highlight(pythonSseCodeSnippet, { language: 'python' }).value"></code></pre>
            </div>
          </div>

          <div v-else-if="activeView === 'history'" class="api-card code-card" key="history-code">
            <div class="code-card-header">
              <h3 class="card-title"><el-icon><Cpu /></el-icon> Python 请求代码</h3>
            </div>
            <div class="code-wrapper">
              <el-button class="copy-button" size="small" type="primary" plain :icon="historyCopied ? Check : CopyDocument" @click="copyCode(pythonHistoryCodeSnippet, 'history')">{{ historyCopied ? '已复制' : '复制' }}</el-button>
              <pre class="code-snippet hljs"><code v-html="hljs.highlight(pythonHistoryCodeSnippet, { language: 'python' }).value"></code></pre>
            </div>
          </div>
        </transition>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
// The <script> part remains exactly the same.
// You can copy your existing <script setup lang="ts"> block here.
import { ref, computed, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';
import { CopyDocument, WarningFilled, Check, Tickets, Calendar, Search, VideoPlay, SwitchButton, Platform, DataLine, Histogram, Setting, Monitor, Document, Cpu, Guide } from '@element-plus/icons-vue';
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
/* Import modern fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Fira+Code&display=swap');

.api-page-container {
  font-family: 'Inter', sans-serif;
  background-color: #0f172a; /* Slate 900 */
  color: #cbd5e1; /* Slate 300 */
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  padding: 2rem;
}

/* --- Aurora Background --- */
.aurora-glow { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.1; pointer-events: none; z-index: 0; }
.aurora-glow-1 { background-color: #38bdf8; width: 500px; height: 500px; top: -150px; left: -150px; }
.aurora-glow-2 { background-color: #818cf8; width: 600px; height: 600px; top: 50%; right: -300px; transform: translateY(-50%); }
.aurora-glow-3 { background-color: #f472b6; width: 400px; height: 400px; bottom: -150px; left: 40%; }

/* --- Login Wall --- */
.login-prompt-wrapper { display: flex; align-items: center; justify-content: center; height: calc(100vh - 4rem); }
.login-prompt-card { text-align: center; background-color: rgba(30, 41, 59, 0.8); border: 1px solid #1e293b; backdrop-filter: blur(12px); max-width: 450px; border-radius: 16px; padding: 1rem; }
.login-prompt-content { padding: 1rem 2rem; }
.prompt-title { font-size: 1.5rem; font-weight: 600; margin: 1rem 0; color: #f87171; }
.prompt-text { margin-bottom: 1.5rem; color: #cbd5e1; }

/* --- Three-Column Workbench Layout --- */
.workbench-grid {
  display: grid;
  grid-template-columns: 340px minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 2rem;
  max-width: 1800px;
  margin: 0 auto;
  height: calc(100vh - 4rem);
}

.api-nav-column, .main-content-column, .code-snippet-column {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: 100%;
}
.view-wrapper { display: flex; flex-direction: column; gap: 2rem; height: 100%; }

/* --- Modern Card Style --- */
.api-card {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(30, 41, 59, 0.4));
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}
/* Card Glow Border */
.api-card::before {
  content: ''; position: absolute; inset: 0; border-radius: 16px; padding: 1px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(51, 65, 85, 0.2));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
}
.card-title {
  font-size: 1.25rem; font-weight: 600; color: #e2e8f0; margin: 0 0 1.5rem 0;
  display: flex; align-items: center; gap: 0.75rem;
}
.request-card { flex-shrink: 0; }
.response-card { flex-grow: 1; min-height: 200px; }
.code-card { height: 100%; }

/* --- Left Column --- */
.workbench-header { margin-bottom: 0; }
h1 { font-size: 2rem; display: flex; align-items: center; gap: 0.75rem; color: #e5e7eb; margin: 0 0 0.5rem 0; }
.desc { color: #9ca3af; font-size: 1rem; line-height: 1.5; }
.api-menu { background: transparent; border-right: none; margin-top: -1rem; /* to align with title */ }
:deep(.el-sub-menu__title), :deep(.el-menu-item) {
  background-color: transparent !important; color: #94a3b8 !important; height: 48px;
  line-height: 48px; border-radius: 8px; transition: all 0.2s ease;
}
:deep(.el-menu-item.is-active) {
  color: #fff !important; background-color: rgba(56, 189, 248, 0.1) !important; font-weight: 600;
}
:deep(.el-menu-item:hover), :deep(.el-sub-menu__title:hover) {
  background-color: rgba(255,255,255,0.05) !important; color: #fff !important;
}

/* --- Code & Output --- */
.code-card-header { display: flex; justify-content: space-between; align-items: center; }
.output-wrapper, .code-wrapper { flex-grow: 1; position: relative; display: flex; flex-direction: column; height: 100%; }
.placeholder { flex-grow: 1; display: flex; align-items: center; justify-content: center; color: #64748b; font-style: italic; padding: 20px; }
.output-log, .code-snippet {
  font-family: 'Fira Code', monospace; font-size: 14px;
  background-color: #020617 !important; /* Rich black bg */
  padding: 1.25rem; border-radius: 12px;
  text-align: left; white-space: pre-wrap; word-wrap: break-word; width: 100%;
  box-sizing: border-box; color: #d1d5db; flex-grow: 1; overflow: auto;
}
.copy-button, .collapse-button { position: absolute; top: 12px; right: 12px; z-index: 10; }

/* --- Form Elements --- */
:deep(.el-form-item__label) { color: #94a3b8; }
:deep(.el-input__wrapper), :deep(.el-select__wrapper), :deep(.el-input-number) {
  background-color: rgba(15, 23, 42, 0.8) !important;
  box-shadow: none !important; border: 1px solid #334155;
}
:deep(.el-input__inner) { color: #e2e8f0; }

/* --- Transitions --- */
.view-fade-enter-active, .view-fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.view-fade-enter-from, .view-fade-leave-to { opacity: 0; transform: translateY(10px); }

</style>
