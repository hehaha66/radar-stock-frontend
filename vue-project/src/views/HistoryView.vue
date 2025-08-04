<template>
  <div class="history-container">
    <!-- Left Control Panel -->
    <div class="control-panel">
      <!-- Favorite Stocks -->
      <el-card class="box-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>自选股列表</span>
            <div v-if="selectedStock" class="selected-stock-display">
              {{ selectedStock.name || selectedStock.code }} ({{ selectedStock.code }})
            </div>
    </div>
        </template>
        <div class="add-stock-form">
        <el-input
            v-model="newStockCode"
            placeholder="输入代码添加 (回车)"
            @keyup.enter="addStock"
          clearable
        >
          <template #prefix>
              <el-icon><Plus /></el-icon>
          </template>
        </el-input>
      </div>
        <div class="stock-list">
          <el-scrollbar>
        <div
              v-for="stock in favoriteStocks"
          :key="stock.code"
          class="stock-item"
          :class="{ active: selectedStock?.code === stock.code }"
          @click="selectStock(stock)"
        >
          <div class="stock-info">
                <span class="stock-name">{{ stock.name || stock.code }}</span>
                <span class="stock-code">{{ stock.code }}</span>
          </div>
              <el-button
                type="danger"
                :icon="Delete"
                circle
                plain
                size="small"
                @click.stop="removeStock(stock.code)"
              />
          </div>
            <el-empty v-if="favoriteStocks.length === 0" description="暂无自选股" :image-size="50" />
          </el-scrollbar>
        </div>
      </el-card>

      <!-- Data Parameters -->
      <el-card class="box-card" shadow="never" v-if="selectedStock">
         <template #header>
          <div class="card-header">
            <span>数据参数</span>
          </div>
        </template>
        <el-form label-position="top">
          <el-form-item label="时间范围:">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%"
              @change="loadHistoryData"
            />
          </el-form-item>
          <el-form-item label="数据周期:">
            <el-radio-group v-model="dataPeriod" @change="loadHistoryData" style="width: 100%">
            <el-radio-button value="daily">日线</el-radio-button>
            <el-radio-button value="weekly">周线</el-radio-button>
            <el-radio-button value="monthly">月线</el-radio-button>
          </el-radio-group>
          </el-form-item>
          <el-form-item label="复权方式:">
            <el-radio-group v-model="adjustType" @change="loadHistoryData" style="width: 100%">
            <el-radio-button value="qfq">前复权</el-radio-button>
            <el-radio-button value="hfq">后复权</el-radio-button>
            <el-radio-button value="none">不复权</el-radio-button>
          </el-radio-group>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- Indicator Selection -->
      <el-card class="box-card" shadow="never" v-if="selectedStock">
         <template #header>
          <div class="card-header">
            <span>技术指标</span>
        </div>
        </template>
        <el-checkbox-group v-model="selectedIndicators" @change="updateChart" class="indicator-checkbox-group">
            <el-checkbox label="volume" size="large">成交量</el-checkbox>
            <el-checkbox label="macd" size="large">MACD</el-checkbox>
            <el-checkbox label="rsi" size="large">RSI</el-checkbox>
            <el-checkbox label="kdj" size="large">KDJ</el-checkbox>
            <el-checkbox label="wr" size="large">WR</el-checkbox>
          </el-checkbox-group>
      </el-card>
    </div>

    <!-- Right Chart Area -->
    <div class="chart-area" v-loading="isLoading" element-loading-text="正在加载历史数据...">
      <div v-if="selectedStock" class="chart-wrapper">
        <div id="main-stock-chart" style="width: 100%; height: 100%;"></div>
      </div>
      <el-empty v-else description="请从左侧列表选择或添加一支股票进行分析" class="chart-empty-state"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import api from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// --- State ---
const newStockCode = ref('')
const favoriteStocks = ref<{ code: string; name: string }[]>([])
const selectedStock = ref<{ code: string; name: string } | null>(null)
const dataPeriod = ref('daily')
const adjustType = ref('qfq')
const dateRange = ref<[Date, Date] | null>(null)
const isLoading = ref(false)
const historyData = ref<any[]>([])
const processedData = ref<any>(null) // To store calculated chart data
const selectedIndicators = ref<string[]>(['volume', 'macd'])
const dynamicTooltipData = ref({ change: '', percent: '' }) // 用于存放动态tooltip信息

// --- ECharts instance ---
let mainChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null;

// --- Lifecycle Hooks ---
onMounted(() => {
  initDateRange()
  loadFavorites()
  const lastSelectedCode = localStorage.getItem('lastSelectedStock')
  if (lastSelectedCode) {
    const stock = favoriteStocks.value.find(s => s.code === lastSelectedCode)
    if (stock) {
      selectStock(stock)
    }
  }

  const chartDom = document.getElementById('main-stock-chart');
  if (chartDom) {
    resizeObserver = new ResizeObserver(() => {
        mainChart?.resize();
    });
    resizeObserver.observe(chartDom);
  }
})

onUnmounted(() => {
  disposeCharts()
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
})

// --- Core Methods ---
function disposeCharts() {
  mainChart?.dispose()
  mainChart = null
}

function initDateRange() {
  const end = new Date()
  const start = new Date()
  start.setFullYear(start.getFullYear() - 1)
  dateRange.value = [start, end]
}

async function loadHistoryData() {
  if (!selectedStock.value || !dateRange.value) return

  isLoading.value = true
  historyData.value = []
  processedData.value = null
  disposeCharts()

  try {
    const token = userStore.token
    if (!token) {
      ElMessage.error('无法获取认证信息，请先登录')
      return
    }

    const [startDate, endDate] = dateRange.value
    const formatDate = (date: Date) => {
      const y = date.getFullYear()
      const m = (date.getMonth() + 1).toString().padStart(2, '0')
      const d = date.getDate().toString().padStart(2, '0')
      return `${y}${m}${d}`
    }

    const params = {
      codes: selectedStock.value.code,
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      period: dataPeriod.value,
      adjust: adjustType.value,
    };

    const responseData: any = await api.get('/data/download-history', { params });
    historyData.value = responseData || []

    if (historyData.value.length > 0) {
      processHistoryData() // Process data
      await nextTick()
      renderCharts() // Then render
    } else {
      ElMessage.info('该时间段内没有查询到数据')
    }
  } catch (error) {
    console.error('加载历史数据失败:', error)
    ElMessage.error('加载历史数据失败')
  } finally {
    isLoading.value = false
  }
}

// --- Data Processing ---
function processHistoryData() {
    const data = historyData.value;
    if (!data || data.length === 0) return;

    const dates = data.map(item => item.date);
    const klineData = data.map(item => [item.open, item.close, item.low, item.high]);
    const volumes = data.map((item, index) => [index, item.volume, item.open > item.close ? -1 : 1]);
    
    processedData.value = {
        dates,
        klineData,
        volumes,
        ma5: calculateMA(data, 5),
        ma10: calculateMA(data, 10),
        ma20: calculateMA(data, 20),
        macd: calculateMACD(data),
        rsi: calculateRSI(data),
        kdj: calculateKDJ(data),
        wr: calculateWR(data)
    };
}

function renderCharts() {
  if (!processedData.value) return;

  if (!mainChart) {
     const chartDom = document.getElementById('main-stock-chart');
     if (chartDom) {
        mainChart = echarts.init(chartDom, 'dark');
     }
  }
  if (!mainChart) return;

  const { dates, klineData, volumes, ma5, ma10, ma20, macd, rsi, kdj, wr } = processedData.value;
  const activeIndicators = selectedIndicators.value;
  const indicatorCount = activeIndicators.length;

  const grids: EChartsOption['grid'] = [];
  const xAxes: EChartsOption['xAxis'] = [];
  const yAxes: EChartsOption['yAxis'] = [];
  const series: EChartsOption['series'] = [];
  const titles: EChartsOption['title'] = [];

  // --- Dynamic Layout Calculation ---
  const totalHeight = 100; // Total percentage
  const topMargin = 8;
  const bottomMargin = indicatorCount > 0 ? 5 : 0; // Space for the last xAxis labels
  const availableHeight = totalHeight - topMargin - bottomMargin;
  
  const klineWeight = 2.0; // K-line chart is 2.0 times taller than an indicator chart
  const totalWeight = klineWeight + indicatorCount;
  
  const klineHeight = (availableHeight * klineWeight) / totalWeight;
  const indicatorHeight = indicatorCount > 0 ? (availableHeight * 1) / totalWeight : 0;
  
  const gap = indicatorCount > 1 ? Math.min(2, availableHeight / (indicatorCount * 2)) : 0; // Dynamic gap, max 2%
  const totalGapHeight = gap * (indicatorCount);
  const adjustedKlineHeight = klineHeight - (totalGapHeight * (klineWeight / totalWeight));
  const adjustedIndicatorHeight = indicatorHeight - (totalGapHeight * (1 / totalWeight));

  let currentTop = topMargin;

  // --- K-line Chart ---
  grids.push({ top: `${currentTop}%`, height: `${adjustedKlineHeight}%`, left: '8%', right: '2%' });
  xAxes.push({ 
    type: 'category', 
    data: dates, 
    axisLabel: { show: false }, 
    axisTick: { show: false }, 
    axisLine: { lineStyle: { color: '#444' } }
  });
  yAxes.push({ 
    scale: true, 
    splitLine: { lineStyle: { color: '#333' }}, 
    axisLabel: { color: '#999', inside: false }, 
    position: 'left' 
  });
  series.push(
    { name: 'K线', type: 'candlestick', data: klineData, itemStyle: { color: '#ef4444', color0: '#10b981', borderColor: '#ef4444', borderColor0: '#10b981'}},
    { name: 'MA5', type: 'line', data: ma5, smooth: true, showSymbol: false, lineStyle: { color: '#38bdf8', width: 1.5 }},
    { name: 'MA10', type: 'line', data: ma10, smooth: true, showSymbol: false, lineStyle: { color: '#f59e0b', width: 1.5 }},
    { name: 'MA20', type: 'line', data: ma20, smooth: true, showSymbol: false, lineStyle: { color: '#8b5cf6', width: 1.5 }},
  );
  titles.push({
    text: `MA5: ${ma5[ma5.length-1]?.toFixed(2)}  MA10: ${ma10[ma10.length-1]?.toFixed(2)}  MA20: ${ma20[ma20.length-1]?.toFixed(2)}`,
    left: '8%', 
    top: `${currentTop}%`, 
    textStyle: { color: '#ccc', fontSize: 12, fontWeight: 'normal' }
  });

  currentTop += adjustedKlineHeight + gap;
  let gridIndexCounter = 0;
  
  // --- Indicator Charts ---
  const addIndicator = (indicatorName: string) => {
    gridIndexCounter++;
    const isLast = gridIndexCounter === activeIndicators.length;

    grids.push({ top: `${currentTop}%`, height: `${adjustedIndicatorHeight}%`, left: '8%', right: '2%' });
    xAxes.push({
      type: 'category', data: dates, gridIndex: gridIndexCounter,
      axisLabel: { show: isLast, color: '#999' },
      axisTick: { show: isLast },
      axisLine: { show: isLast, lineStyle: { color: '#444' } }
    });
    yAxes.push({
      scale: true, gridIndex: gridIndexCounter, splitNumber: 3,
      axisLabel: { show: false }, axisLine: { show: false },
      axisTick: { show: false }, splitLine: { lineStyle: { color: '#333' }}
    });
    
    let titleText = '';
    
    switch(indicatorName) {
      case 'volume':
        series.push({ name: '成交量', type: 'bar', xAxisIndex: gridIndexCounter, yAxisIndex: gridIndexCounter, data: volumes, itemStyle: { color: (params: any) => (params.data[2] === 1 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)')}});
        titleText = '成交量';
        break;
      case 'macd':
        series.push(
          { name: 'DIF', type: 'line', data: macd.macd, showSymbol: false, lineStyle: { color: '#38bdf8' }, xAxisIndex: gridIndexCounter, yAxisIndex: gridIndexCounter },
          { name: 'DEA', type: 'line', data: macd.signal, showSymbol: false, lineStyle: { color: '#ef4444' }, xAxisIndex: gridIndexCounter, yAxisIndex: gridIndexCounter },
          { name: 'MACD Hist', type: 'bar', data: macd.histogram, itemStyle: { color: (params: any) => (params.value >= 0 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.7)') }, xAxisIndex: gridIndexCounter, yAxisIndex: gridIndexCounter }
        );
        titleText = `MACD(12,26,9)  DIF:${macd.macd[dates.length - 1]?.toFixed(2)}  DEA:${macd.signal[dates.length - 1]?.toFixed(2)}`;
        break;
      case 'rsi':
        (yAxes[gridIndexCounter] as any).min = 0;
        (yAxes[gridIndexCounter] as any).max = 100;
        series.push({ name: 'RSI', type: 'line', data: rsi, showSymbol: false, lineStyle: { color: '#f59e0b' }, markLine: { symbol: 'none', data: [{ yAxis: 80 }, { yAxis: 20 }]}, xAxisIndex: gridIndexCounter, yAxisIndex: gridIndexCounter });
        titleText = `RSI(14): ${rsi[dates.length - 1]?.toFixed(2)}`;
        break;
      case 'kdj':
        (yAxes[gridIndexCounter] as any).min = 0;
        (yAxes[gridIndexCounter] as any).max = 100;
        series.push(
          { name: 'K', type: 'line', data: kdj.k, showSymbol: false, lineStyle: { color: '#38bdf8' }, xAxisIndex: gridIndexCounter, yAxisIndex: gridIndexCounter },
          { name: 'D', type: 'line', data: kdj.d, showSymbol: false, lineStyle: { color: '#ef4444' }, xAxisIndex: gridIndexCounter, yAxisIndex: gridIndexCounter },
          { name: 'J', type: 'line', data: kdj.j, showSymbol: false, lineStyle: { color: '#f59e0b' }, xAxisIndex: gridIndexCounter, yAxisIndex: gridIndexCounter }
        );
        titleText = `KDJ(9,3,3)  K:${kdj.k[dates.length - 1]?.toFixed(2)} D:${kdj.d[dates.length - 1]?.toFixed(2)} J:${kdj.j[dates.length - 1]?.toFixed(2)}`;
        break;
      case 'wr':
        (yAxes[gridIndexCounter] as any).min = -100;
        (yAxes[gridIndexCounter] as any).max = 0;
        series.push({ name: 'WR', type: 'line', data: wr, showSymbol: false, lineStyle: { color: '#a855f7' }, markLine: { symbol: 'none', data: [{ yAxis: -20 }, { yAxis: -80 }]}, xAxisIndex: gridIndexCounter, yAxisIndex: gridIndexCounter });
        titleText = `WR(14): ${wr[dates.length-1]?.toFixed(2)}`;
        break;
    }
    titles.push({
        text: titleText, left: '8%', top: `${currentTop}%`, textStyle: { color: '#ccc', fontSize: 12, fontWeight: 'normal' }
    });
    currentTop += adjustedIndicatorHeight + gap;
  }

  activeIndicators.forEach(addIndicator);

  const option: EChartsOption = {
      backgroundColor: 'transparent',
      title: titles,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { show: false } },
        backgroundColor: 'rgba(24, 24, 28, 0.85)',
        borderColor: '#3a3a3e',
        textStyle: { color: '#E0E0E0', fontSize: 12 },
        formatter: (params: any) => {
          if (!params.length) return '';
          const axisValue = params[0].axisValue;
          let tooltipHtml = `${axisValue}<br/>`;

          const klineParams = params.find((item:any) => item.seriesName === 'K线');
          if (klineParams && processedData.value) {
              const dataIndex = klineParams.dataIndex;
              const ohlc = processedData.value.klineData[dataIndex];
              const open = ohlc[0];
              const close = ohlc[1];
              const low = ohlc[2];
              const high = ohlc[3];
              
              const color = close > open ? '#ef4444' : '#10b981';
              tooltipHtml += `开: <span style="color: ${color}">${open.toFixed(2)}</span> 收: <span style="color: ${color}">${close.toFixed(2)}</span><br/>`;
              tooltipHtml += `低: <span style="color: ${color}">${low.toFixed(2)}</span> 高: <span style="color: ${color}">${high.toFixed(2)}</span><br/>`;
          }
          
          params.forEach((item: any) => {
            if (item.seriesName && item.seriesName !== 'K线') {
               const color = item.color;
               let value = item.value;
               if(item.seriesName === '成交量' && Array.isArray(item.value)) {
                 value = item.value[1];
               }

               if (value !== undefined && value !== null) {
                 tooltipHtml += `${item.marker} ${item.seriesName}: <span style="color: ${color}; font-weight: bold;">${value.toFixed(2)}</span><br/>`;
               }
            }
          });
          return tooltipHtml.replace(/<br\/>$/, '');
        }
    },
    axisPointer: {
      link: [{ xAxisIndex: 'all' }],
      label: { backgroundColor: '#777' }
    },
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    series: series,
    dataZoom: [{
      type: 'inside',
      xAxisIndex: Array.from({ length: gridIndexCounter + 1 }, (_, i) => i),
      start: 80,
      end: 100,
    }],
  };

  mainChart.setOption(option, true);
}

// --- Favorite Stocks Methods ---
function loadFavorites() {
  const favorites = localStorage.getItem('favoriteStocks')
  if (favorites) {
    favoriteStocks.value = JSON.parse(favorites)
  }
}

function saveFavorites() {
  localStorage.setItem('favoriteStocks', JSON.stringify(favoriteStocks.value))
}

function addStock() {
  const code = newStockCode.value.trim().toUpperCase()
  if (!code) return
  if (favoriteStocks.value.some(s => s.code === code)) {
    ElMessage.warning('该股票已在自选列表中')
    return
  }
  favoriteStocks.value.unshift({ code, name: code })
  saveFavorites()
  ElMessage.success(`股票 ${code} 添加成功`)
  newStockCode.value = ''
}

function removeStock(codeToRemove: string) {
  ElMessageBox.confirm(`确定要从自选股中移除 ${codeToRemove} 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      favoriteStocks.value = favoriteStocks.value.filter(s => s.code !== codeToRemove)
      saveFavorites()
      ElMessage.success(`股票 ${codeToRemove} 已移除`)
      if (selectedStock.value?.code === codeToRemove) {
        selectedStock.value = null
        historyData.value = []
        disposeCharts()
      }
    })
    .catch(() => {})
}

function selectStock(stock: { code: string; name: string }) {
  selectedStock.value = stock
  localStorage.setItem('lastSelectedStock', stock.code)
  loadHistoryData()
}

const indicatorNameMap: { [key:string]: string } = {
  volume: '成交量',
  macd: 'MACD',
  rsi: 'RSI',
  kdj: 'KDJ',
  wr: 'WR',
}

function updateChart(currentSelection: string[]) {
  // The @change event fires after the v-model has been updated.
  // We check if the new length exceeds the limit.
  if (currentSelection.length > 3) {
    // As requested, remove the first item in the list.
    const toRemove = currentSelection[0];
    const keptIndicators = currentSelection.slice(1);
    
    // By replacing the array, we ensure Vue's reactivity handles this cleanly.
    // This avoids the infinite loop caused by mutating the array in place (with .shift()).
    selectedIndicators.value = keptIndicators;
    
    ElMessage.info({
        message: `为确保性能，最多同时显示3个技术指标。已自动取消 "${indicatorNameMap[toRemove]}"。`,
        type: 'info',
    });
  }
  
  // Render charts on the next DOM update cycle to ensure all state changes are processed.
  nextTick(() => {
    if (historyData.value.length > 0) {
        renderCharts();
    }
  });
}

// --- Indicator Calculation (unchanged from before) ---
function calculateMA(data: any[], period: number): (number | null)[] {
  const ma: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) ma.push(null);
    else {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + item.close, 0);
      ma.push(sum / period);
    }
  }
  return ma
}

function calculateEMA(data: (number|null)[], period: number): (number|null)[] {
  const ema: (number | null)[] = []
  const multiplier = 2 / (period + 1)
  let prevEma: number | null = null
  for (let i = 0; i < data.length; i++) {
    const price = data[i]
    if (price === null) {
      ema.push(null);
      prevEma = null;
    } else {
      if (prevEma === null) {
        const initialSlice = data.slice(0, i + 1).filter(p => p !== null);
        if (initialSlice.length < period) {
            ema.push(null)
            continue;
        }
        prevEma = initialSlice.slice(0, period).reduce((a,b) => a!+b!, 0)! / period
      }
      const newEma: number = price * multiplier + prevEma * (1 - multiplier);
      ema.push(newEma);
      prevEma = newEma;
    }
  }
  return ema
}

function calculateMACD(data: any[]): { macd: (number|null)[], signal: (number|null)[], histogram: (number|null)[] } {
  const prices = data.map(item => item.close) as (number | null)[]
  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)
  const macd: (number | null)[] = ema12.map((v, i) => v === null || ema26[i] === null ? null : v - ema26[i]!)
  const signal = calculateEMA(macd, 9)
  const histogram: (number|null)[] = macd.map((v, i) => v === null || signal[i] === null ? null : v - signal[i]!)
  return { macd, signal, histogram }
}

function calculateRSI(data: any[], period: number = 14): (number | null)[] {
  const rsi: (number | null)[] = Array(period - 1).fill(null)
  const prices = data.map(item => item.close)
  if (prices.length < period) return []

  let gain = 0, loss = 0
  for (let i = 1; i < period; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff > 0) gain += diff; else loss -= diff;
  }

  let avgGain = gain / period, avgLoss = loss / period
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  
  for (let i = period; i < prices.length; i++) {
    const diff = prices[i] - prices[i-1];
    if (diff > 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
    rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
  }
  return rsi
}

function calculateKDJ(data: any[], n: number = 9, m1: number = 3, m2: number = 3): { k: (number | null)[]; d: (number | null)[]; j: (number | null)[] } {
  const k: (number | null)[] = [], d: (number | null)[] = [], j: (number | null)[] = []
  let rsvs: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < n - 1) rsvs.push(null);
    else {
      const periodData = data.slice(i - n + 1, i + 1)
      const high = Math.max(...periodData.map(item => item.high))
      const low = Math.min(...periodData.map(item => item.low))
      const rsv = high === low ? 0 : ((data[i].close - low) / (high - low)) * 100
      rsvs.push(rsv)
    }
  }

  let prevK = 50, prevD = 50
  for (let i = 0; i < rsvs.length; i++) {
    if (rsvs[i] === null) { k.push(null); d.push(null); j.push(null); continue; }
    const currentK = (rsvs[i]! + (m1 - 1) * prevK) / m1; k.push(currentK); prevK = currentK;
    const currentD = (currentK + (m2 - 1) * prevD) / m2; d.push(currentD); prevD = currentD;
    const currentJ = 3 * currentK - 2 * currentD; j.push(currentJ);
  }
  return { k, d, j }
}

function calculateWR(data: any[], period: number = 14): (number | null)[] {
  const wr: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) wr.push(null);
    else {
      const periodData = data.slice(i - period + 1, i + 1)
      const highestHigh = Math.max(...periodData.map(item => item.high))
      const lowestLow = Math.min(...periodData.map(item => item.low))
      if (highestHigh === lowestLow) wr.push(0);
      else wr.push(((highestHigh - data[i].close) / (highestHigh - lowestLow)) * -100);
    }
  }
  return wr
}

</script>

<style scoped>
.history-container {
  display: flex;
  height: calc(100vh - var(--header-height, 80px)); /* Default to 80px if var is not available */ /* Adjust based on your nav bar height */
  gap: 16px;
  padding: 16px;
  background-color: #18181c;
  color: #e0e0e0;
}

.control-panel {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-area {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #1f1f23;
  border-radius: 8px;
  padding: 16px;
  position: relative;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
}

.box-card {
  background-color: #1f1f23;
  border: 1px solid #333;
  border-radius: 8px;
}
.box-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  font-weight: 600;
  color: #e0e0e0;
}
.selected-stock-display {
  font-size: 0.85rem;
  font-weight: 400;
  color: #a0aec0;
  border: 1px solid #4a4a4a;
  padding: 2px 8px;
  border-radius: 6px;
  background-color: #2d2d33;
}
.add-stock-form {
  margin-bottom: 12px;
}
.stock-list {
  height: 200px; /* or adjust as needed */
}
.stock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 4px;
}
.stock-item:hover {
  background-color: #333;
}
.stock-item.active {
  background-color: #38bdf8;
  color: #18181c;
}
.stock-item.active .stock-code {
  color: #2c2c2c;
}
.stock-info {
  display: flex;
  flex-direction: column;
}
.stock-name {
  font-weight: 500;
}
.stock-code {
  font-size: 0.8rem;
  color: #999;
}

.indicator-checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.chart-empty-state {
    margin: auto;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #333;
}
:deep(.el-card__body) {
  padding: 16px;
}
:deep(.el-checkbox) {
  color: #e0e0e0;
}
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background-color: #38bdf8;
    border-color: #38bdf8;
}
:deep(.el-checkbox__input.is-checked+.el-checkbox__label) {
    color: #38bdf8;
}
</style>
