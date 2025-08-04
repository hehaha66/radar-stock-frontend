<template>
  <div class="api-docs-container">
    <h1>开发者 API 文档</h1>
    <p class="desc">使用下面的交互式工具来测试 API，并生成可直接运行的 Python 请求代码。</p>

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
    <div v-else>
      <!-- View Switcher -->
      <div class="view-switcher">
        <el-button-group>
          <el-button
            type="primary"
            :plain="activeView !== 'sse'"
            @click="activeView = 'sse'"
            size="large"
          >
            实时数据 API
          </el-button>
          <el-button
            type="primary"
            :plain="activeView !== 'history'"
            @click="activeView = 'history'"
            size="large"
          >
            历史K线数据 API
          </el-button>
        </el-button-group>
      </div>

      <!-- Transition for views -->
      <transition name="fade" mode="out-in">
        <!-- Part 1: Real-time SSE API View -->
        <div v-if="activeView === 'sse'" class="api-section">
          <div class="content-grid">
            <div class="left-column">
              <el-card shadow="never" class="box-card">
                <template #header>
                  <div class="card-header">
                    <span>参数配置</span>
                  </div>
                </template>
                <el-form :model="sseForm" label-position="top">
                  <el-form-item :label="`股票代码 (最多 ${userStore.userInfo?.max_codes || 'N/A'} 只)`">
                    <el-input v-model="sseForm.codes" :prefix-icon="Tickets" />
                  </el-form-item>
                  <el-form-item :label="`刷新间隔 (最低 ${userStore.userInfo?.min_interval || 'N/A'} 秒)`">
                    <el-input-number v-model="sseForm.interval" :min="userStore.userInfo?.min_interval || 0.2" :step="0.1" style="width: 100%;"/>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="startSseStream" :disabled="isSseRunning" :icon="VideoPlay">开始获取</el-button>
                    <el-button type="danger" @click="stopSseStream" :disabled="!isSseRunning" :icon="SwitchButton">停止获取</el-button>
                  </el-form-item>
                </el-form>
              </el-card>
              <el-card shadow="never" class="box-card output-card">
                <template #header>
                    <div class="card-header">
                        <span>实时数据输出</span>
                    </div>
                </template>
                <div v-if="latestSseDataJson" class="output-wrapper">
                  <pre class="output-log hljs"><code v-html="latestSseDataJson"></code></pre>
                </div>
                <div v-else class="placeholder">点击"开始获取"后，结果将显示在这里</div>
              </el-card>
            </div>
            <div class="right-column">
              <el-card shadow="never" class="box-card code-card">
                <template #header>
                  <div class="card-header">
                    <span>Python 请求代码</span>
                    <el-radio-group v-model="sseCodeExampleFormat" size="small">
                      <el-radio-button label="中文名" value="verbose"></el-radio-button>
                      <el-radio-button label="aN 字段" value="aN"></el-radio-button>
                    </el-radio-group>
                    <el-button text :icon="sseCopied ? Check : CopyDocument" @click="copyCode(pythonSseCodeSnippet, 'sse')">
                      {{ sseCopied ? '已复制' : '复制' }}
                    </el-button>
                  </div>
                </template>
                <pre class="code-snippet hljs"><code v-html="hljs.highlight(pythonSseCodeSnippet.trim(), { language: 'python' }).value"></code></pre>
              </el-card>
            </div>
          </div>
        </div>
      </transition>

      <transition name="fade" mode="out-in">
        <!-- Part 2: Historical K-line API View (Refactored Layout) -->
        <div v-if="activeView === 'history'" class="api-section">
          <div class="content-grid">
            <!-- Left Column for History -->
            <div class="left-column">
              <el-card shadow="never" class="box-card">
                <template #header>
                  <div class="card-header">
                    <span>参数配置</span>
                  </div>
                </template>
                <el-form :model="historyParams" label-position="top">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="股票代码">
                        <el-input v-model="historyParams.code" placeholder="例如: 600519" :prefix-icon="Tickets"/>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="开始日期 (YYYYMMDD)">
                        <el-input v-model="historyParams.start_date" placeholder="例如: 20220101" :prefix-icon="Calendar"/>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="复权方式">
                        <el-select v-model="historyParams.adjust" placeholder="选择" style="width: 100%;">
                          <el-option label="前复权 (qfq)" value="qfq" />
                          <el-option label="后复权 (hfq)" value="hfq" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="周期">
                        <el-select v-model="historyParams.period" placeholder="选择" style="width: 100%;">
                          <el-option label="日 K" value="daily" />
                          <el-option label="周 K" value="weekly" />
                          <el-option label="月 K" value="monthly" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-form-item>
                    <el-button type="primary" @click="fetchHistoryData" :loading="isLoadingHistory" :icon="Search">发送请求</el-button>
                  </el-form-item>
                </el-form>
              </el-card>

              <el-card shadow="never" class="box-card output-card">
                <template #header>
                  <div class="card-header">
                    <span>API 输出</span>
                  </div>
                </template>
                <div class="output-wrapper">
                  <el-button
                    v-if="historyResponse && historyResponse.data?.length > 5"
                    class="collapse-button"
                    size="small"
                    type="primary"
                    plain
                    @click="isDataCollapsed = !isDataCollapsed"
                  >
                    {{ isDataCollapsed ? '展开数据' : '收起数据' }}
                  </el-button>
                  <pre v-if="historyResponse" class="output-log hljs"><code v-html="highlightedHistoryResponse"></code></pre>
                  <div v-else class="placeholder">点击"发送请求"后，结果将显示在这里</div>
                </div>
              </el-card>
            </div>
            <!-- Right Column for History -->
            <div class="right-column">
              <el-card shadow="never" class="box-card code-card">
                <template #header>
                  <div class="card-header">
                    <span>Python 请求代码</span>
                    <el-button text :icon="historyCopied ? Check : CopyDocument" @click="copyCode(pythonHistoryCodeSnippet, 'history')">
                      {{ historyCopied ? '已复制' : '复制' }}
                    </el-button>
                  </div>
                </template>
                <pre class="code-snippet hljs"><code v-html="hljs.highlight(pythonHistoryCodeSnippet.trim(), { language: 'python' }).value"></code></pre>
              </el-card>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';
import {
  CopyDocument,
  WarningFilled,
  Check,
  Tickets,
  Calendar,
  Search,
  VideoPlay,
  SwitchButton
} from '@element-plus/icons-vue';
import axios from 'axios';
import hljs from 'highlight.js/lib/common';
import 'highlight.js/styles/atom-one-dark.css';

// --- Global State & Methods ---
const userStore = useUserStore();
const activeView = ref<'sse' | 'history'>('sse');

// --- Computed property for unified token access ---
const apiToken = computed(() => {
  // 使用统一的token getter
  return userStore.token;
});

const sseCopied = ref(false);
const historyCopied = ref(false);

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
const sseForm = ref({
  codes: '000001,TSLA',
  interval: 10,
});
const isSseRunning = ref(false);
const sseEventSource = ref<EventSource | null>(null);
const latestSseDataJson = ref<string>('');
const sseCodeExampleFormat = ref<'verbose' | 'aN'>('verbose');
const FIELD_MAP: Record<string, string> = {
    'a1': '股票代码', 'a2': '名称', 'a3': '最新价', 'a4': '涨跌幅(%)', 'a5': '涨跌额',
    'a6': '成交额(亿)', 'a7': '总市值(亿)', 'a8': '流通市值(亿)', 'a9': '市盈率',
    'a10': '市净率', 'a11': '换手率(%)', 'a12': '总手(万)', 'a13': '净资产收益率(加权)',
    'a14': '毛利率', 'a15': '所属行业板块', 'a16': '振幅(%)', 'a17': '量比',
    'a18': '昨收', 'a19': '开盘价', 'a20': '最低价', 'a21': '最高价',
    'a22': '主力净流入(亿)', 'a23': '大单流入(亿)', 'a24': '大单流出(亿)', 'a25': '超大单流入(亿)',
    'a26': '超大单流出(亿)', 'a27': '中单流入(亿)', 'a28': '中单流出(亿)', 'a29': '小单流入(亿)',
    'a30': '小单流出(亿)', 'a31': '上市日期', 'a32': '总股本(亿)', 'a33': '总负债(亿)',
    'a34': '资产负债比率', 'a35': '市场类型代码', 'a36': '市场代码'
};

const pythonSseCodeSnippet = computed(() => {
  // Python 代码示例应始终使用用户的静态 Token，以方便复制和在外部环境使用。
  const staticToken = userStore.userInfo?.token || 'YOUR_STATIC_API_TOKEN';
  const codesValue = sseForm.value.codes;
  const intervalValue = sseForm.value.interval;

  const fieldMapString = JSON.stringify(FIELD_MAP, null, 4).replace(/"/g, "'").replace(/,\n/g, ',\n    ');

  const processFunction = `
FIELD_MAP = ${fieldMapString}

def process_data(data_list):
    """将API返回的aN字段名转换为更易读的中文名。"""
    processed = []
    if not isinstance(data_list, list):
        return data_list
    for item in data_list:
        new_item = {}
        for an_key, cn_name in FIELD_MAP.items():
            if an_key in item:
                new_item[cn_name] = item[an_key]
        processed.append(new_item)
    return processed
`;

  const baseCode = `
import requests
import json
import sseclient

# --- 参数配置 ---
# 重要：这是您的专属静态API Token，请妥善保管，不要泄露。
# 您可以在“用户中心”页面随时查看或重置您的静态Token。
API_TOKEN = "${staticToken}"
STOCK_CODES = "${codesValue}"
REFRESH_INTERVAL = ${intervalValue}
${sseCodeExampleFormat.value === 'verbose' ? processFunction : ''}
def stream_realtime_data(codes, token, interval):
    """
    使用 sseclient-py 库连接到 SSE 端点并持续接收实时数据。
    首先请确保已经安装: pip install sseclient-py
    """
    # 在生产环境中，应将 127.0.0.1:8000 替换为您的后端服务器域名和端口
    url = f"http://127.0.0.1:8000/monitor/sse/market-data?codes={codes}&interval={interval}&token={token}"
    
    print(f"[*] 正在连接到: {url}")
    try:
        client = sseclient.SSEClient(url)
        print("[+] 连接成功！等待数据流... (按 Ctrl+C 停止)")
        for event in client.events():
            if event.event == 'message':
                # 确保 JSON 字符串不为空
                if event.data and event.data != '{}':
                    try:
                        payload = json.loads(event.data)
                        print("----------------------------------------")
                        if '${sseCodeExampleFormat.value}' == 'verbose':
                            payload['data'] = process_data(payload.get('data', []))
                        print(json.dumps(payload, indent=4, ensure_ascii=False))

                    except json.JSONDecodeError:
                        print(f"[!] 收到无法解析的 JSON 数据: {event.data}")

    except requests.exceptions.RequestException as e:
        print(f"[-] 请求出错: {e}")
    except KeyboardInterrupt:
        print("\\n[!] 用户中断，停止获取数据。")
    except Exception as e:
        print(f"[-] 处理数据时发生未知错误: {e}")

# --- 执行请求 ---
if __name__ == "__main__":
    stream_realtime_data(STOCK_CODES, API_TOKEN, REFRESH_INTERVAL)
`;
  return baseCode.trim();
});


const processSseDataForDisplay = (dataList: Record<string, any>[]) => {
    if (!Array.isArray(dataList)) return dataList;
    return dataList.map(item => {
        const newItem: Record<string, any> = {};
        for (const key in item) { newItem[FIELD_MAP[key] || key] = item[key]; }
        return newItem;
    });
};

const startSseStream = () => {
  if (isSseRunning.value) return;

  if (!apiToken.value) {
    ElMessage.error('无法获取认证Token，请重新登录！');
    return;
  }

  isSseRunning.value = true;
  latestSseDataJson.value = hljs.highlight(JSON.stringify({ message: "正在连接..." }, null, 2), { language: 'json' }).value;

  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  const url = `${backendUrl}/monitor/sse/market-data?codes=${encodeURIComponent(sseForm.value.codes)}&interval=${sseForm.value.interval}&token=${apiToken.value}`;

  console.log('SSE连接URL:', url);
  sseEventSource.value = new EventSource(url);
  
  sseEventSource.value.onopen = () => {
    latestSseDataJson.value = hljs.highlight(JSON.stringify({ message: "连接成功！等待数据..." }, null, 2), { language: 'json' }).value;
  };

  sseEventSource.value.onmessage = (event) => {
    try {
      if (event.data && event.data !== '{}') {
        const parsedData = JSON.parse(event.data);
        if (sseCodeExampleFormat.value === 'verbose' && parsedData.data) {
            parsedData.data = processSseDataForDisplay(parsedData.data);
        }
        latestSseDataJson.value = hljs.highlight(JSON.stringify(parsedData, null, 2), { language: 'json' }).value;
      }
    } catch (e) {
      latestSseDataJson.value = hljs.highlight(`# [!] 收到无法解析的数据:\n${event.data}`, { language: 'plaintext' }).value;
    }
  };

  sseEventSource.value.onerror = (event: Event) => {
    console.error("SSE 连接发生错误:", event);
    
    let errorMessage = "连接中断。";
    if (isSseRunning.value) {
        errorMessage = "连接失败。请检查：1. 您的网络连接是否正常。2. API Token是否正确且有效。3. 浏览器控制台是否有其他错误输出。";
    }
    
    latestSseDataJson.value = hljs.highlight(`# [-] ${errorMessage}`, { language: 'plaintext' }).value;
    
    stopSseStream();
  };
};

const stopSseStream = () => {
  if (sseEventSource.value) { sseEventSource.value.close(); sseEventSource.value = null; }
  if (isSseRunning.value) {
      latestSseDataJson.value = hljs.highlight(JSON.stringify({ message: "已断开连接。" }, null, 2), { language: 'json' }).value;
  }
  isSseRunning.value = false;
};

onUnmounted(stopSseStream);

// ===================================================================
// Part 2: Historical K-line Data Logic
// ===================================================================
const isLoadingHistory = ref(false);
const historyResponse = ref<any>(null);
const isDataCollapsed = ref(true);
const historyParams = ref({
  code: '600519',
  start_date: '20230101',
  adjust: 'qfq',
  period: 'daily'
});

const fetchHistoryData = async () => {
  if (!apiToken.value) {
    ElMessage.error('无法获取认证Token，请重新登录！');
    return;
  }
  if (!historyParams.value.code) {
    ElMessage.warning('请输入股票代码！');
    return;
  }
  isLoadingHistory.value = true;
  historyResponse.value = null;
  isDataCollapsed.value = true;
  try {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    const url = `${backendUrl}/data/download-history`;
    
    // 创建一个动态的结束日期 (今天)
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const endDate = `${year}${month}${day}`;

    const params = {
      codes: historyParams.value.code,
      start_date: historyParams.value.start_date,
      end_date: endDate,
      adjust: historyParams.value.adjust,
      period: historyParams.value.period,
      token: apiToken.value,
    };
    
    // 使用普通的GET请求，而不是axios实例，以避免双重URL拼接
    const response = await fetch(`${url}?${new URLSearchParams(params)}`);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    historyResponse.value = await response.json();

  } catch (error: any) {
    console.error("获取历史数据失败:", error);
    ElMessage.error(error.message || '获取历史数据失败');
  } finally {
    isLoadingHistory.value = false;
  }
};

const highlightedHistoryResponse = computed(() => {
  if (!historyResponse.value) return '';
  let dataToShow = { ...historyResponse.value };
  if (isDataCollapsed.value && dataToShow.data?.length > 5) {
    dataToShow.data = `[... Array of ${dataToShow.data.length} records, click to expand]`
  }
  return hljs.highlight(JSON.stringify(dataToShow, null, 2), { language: 'json' }).value;
});

const pythonHistoryCodeSnippet = computed(() => {
  // Python 代码示例应始终使用用户的静态 Token。
  const staticToken = userStore.userInfo?.token || 'YOUR_STATIC_API_TOKEN';
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const endDate = `${year}${month}${day}`;

  return `import requests
import json

# --- 参数配置 ---
# 重要：这是您的专属静态API Token，请妥善保管，不要泄露。
# 您可以在“用户中心”页面随时查看或重置您的静态Token。
API_TOKEN = "${staticToken}"

# 在生产环境中，应将 127.0.0.1:8000 替换为您的后端服务器域名和端口
url = "http://127.0.0.1:8000/data/download-history"

params = {
    "codes": "${historyParams.value.code}",
    "start_date": "${historyParams.value.start_date}",
    "end_date": "${endDate}",
    "adjust": "${historyParams.value.adjust}",
    "period": "${historyParams.value.period}",
    "token": API_TOKEN
}

try:
    print(f"[*] 正在请求: {url}")
    print(f"[*] 参数: {params}")
    response = requests.get(url, params=params)
    response.raise_for_status()

    print("\\n[+] 请求成功! Status Code:", response.status_code)
    data = response.json()
    
    # 为了方便展示，如果数据过多，只显示前5条记录
    if 'data' in data and isinstance(data['data'], list) and len(data['data']) > 5:
        print(f"[*] 收到 {len(data['data'])} 条记录，仅显示前 5 条。")
        data['data'] = data['data'][:5]
        data['data'].append({'...': '更多记录'})

    print("\\n[+] 响应内容 (示例):")
    print(json.dumps(data, indent=4, ensure_ascii=False))

except requests.exceptions.HTTPError as e:
    print(f"[-] HTTP 错误: {e}")
    # 尝试打印出更详细的错误信息
    try:
        print("[-] 服务端返回信息:", e.response.json())
    except json.JSONDecodeError:
        print("[-] 无法解析服务端错误信息。")
except requests.exceptions.RequestException as e:
    print(f"[-] 请求出错: {e}")
`;
});
</script>

<style scoped>
.api-docs-container { padding: 2rem; max-width: 1600px; margin: 0 auto; }
h1 { font-size: 2.25rem; font-weight: bold; margin-bottom: 0.5rem; }
.desc { color: #94a3b8; margin-bottom: 2rem; font-size: 1.1rem; }

.login-prompt-card { text-align: center; background-color: rgba(30, 41, 59, 0.5); border-color: rgba(248, 113, 113, 0.3); }
.login-prompt-content { padding: 2rem; }
.prompt-title { font-size: 1.5rem; font-weight: 600; margin: 1rem 0; color: #f87171; }
.prompt-text { margin-bottom: 1.5rem; color: #cbd5e1; }

.view-switcher { margin-bottom: 2rem; text-align: center; }
.api-section { margin-top: 2rem; }

.box-card { background-color: rgba(30, 41, 59, 0.3); border: 1px solid rgba(51, 65, 85, 0.5); margin-bottom: 1.5rem; }
.card-header { display: flex; justify-content: space-between; align-items: center; font-size: 1.1rem; font-weight: 600; gap: 1rem; }
.content-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 24px; align-items: stretch; }
.left-column, .right-column { display: flex; flex-direction: column; gap: 20px; }
.box-card, .code-card, .output-card { display: flex; flex-direction: column; }
.box-card :deep(.el-card__body) { flex-grow: 1; display: flex; flex-direction: column; }
.output-card, .code-card { flex-grow: 1; }

.output-wrapper { position: relative; flex-grow: 1; display: flex; }
.code-wrapper { position: relative; flex-grow: 1; display: flex; }
.placeholder { flex-grow: 1; display: flex; align-items: center; justify-content: center; color: #64748b; font-style: italic; background: rgba(0,0,0,0.1); border-radius: 4px; padding: 1rem; }

.output-log, .code-snippet, .code-snippet-tab {
  background-color: #282c34 !important;
  flex-grow: 1;
  overflow: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  padding: 1rem;
  border-radius: 4px;
  margin: 0;
  white-space: pre;
  color: #abb2bf;
}
.output-log code, .code-snippet code, .code-snippet-tab code { white-space: pre; }
.code-snippet { min-height: 480px; }

.collapse-button { position: absolute; top: 0.5rem; right: 0.5rem; z-index: 10; }
.copy-button-in-tab { position: absolute; top: 0.5rem; right: 0.5rem; z-index: 10; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
