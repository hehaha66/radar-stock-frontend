<template>
  <div class="data-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>数据展示中心</h1>
      <p>实时自选数据与历史K线数据的完美结合</p>
    </div>

    <!-- 市场概览 -->
    <div class="market-overview">
      <h2>市场概览</h2>
      <div class="market-cards">
        <div
          v-for="(index, key) in marketOverview"
          :key="key"
          class="market-card"
        >
          <div class="index-name">{{ index.name }}</div>
          <div class="index-price" :class="getPriceClass(index.change)">
            {{ formatPrice(index.price) }}
          </div>
          <div class="index-change" :class="getPriceClass(index.change)">
            {{ formatChange(index.change) }}
          </div>
          <div class="index-volume">
            成交: {{ formatVolume(index.volume) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 数据展示组件 -->
    <DataDisplay
      :stock-data="stockData"
      :is-loading="isLoading"
      :is-connected="isConnected"
      @view-kline="handleViewKline"
      @add-to-monitor="handleAddToMonitor"
    />

    <!-- K线图表对话框 -->
    <el-dialog
      v-model="showKlineDialog"
      title="K线图表"
      width="90%"
      fullscreen
    >
      <div class="kline-dialog-content">
        <div class="chart-controls">
          <div class="stock-info">
            <h3>{{ selectedStock?.name }} ({{ selectedStock?.code }})</h3>
          </div>
          <div class="period-controls">
            <el-radio-group v-model="chartPeriod" @change="loadKlineData">
              <el-radio-button label="daily">日线</el-radio-button>
              <el-radio-button label="weekly">周线</el-radio-button>
              <el-radio-button label="monthly">月线</el-radio-button>
            </el-radio-group>
          </div>
          <div class="date-controls">
            <el-date-picker
              v-model="chartDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="loadKlineData"
            />
          </div>
        </div>
        
        <div class="chart-container" v-loading="isLoadingKline">
          <div id="kline-chart" class="chart-area"></div>
        </div>
        
        <div class="chart-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">开盘价:</span>
              <span class="value">{{ klineInfo.open }}</span>
            </div>
            <div class="info-item">
              <span class="label">最高价:</span>
              <span class="value">{{ klineInfo.high }}</span>
            </div>
            <div class="info-item">
              <span class="label">最低价:</span>
              <span class="value">{{ klineInfo.low }}</span>
            </div>
            <div class="info-item">
              <span class="label">收盘价:</span>
              <span class="value">{{ klineInfo.close }}</span>
            </div>
            <div class="info-item">
              <span class="label">成交量:</span>
              <span class="value">{{ klineInfo.volume }}</span>
            </div>
            <div class="info-item">
              <span class="label">涨跌幅:</span>
              <span class="value" :class="getPriceClass(klineInfo.change)">
                {{ formatChange(klineInfo.change) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import DataDisplay from '@/components/DataDisplay.vue'
import * as echarts from 'echarts'

// 响应式数据
const stockData = ref<any[]>([])
const marketOverview = ref<any>({})
const isLoading = ref(false)
const isConnected = ref(false)
const showKlineDialog = ref(false)
const selectedStock = ref<any>(null)
const chartPeriod = ref('daily')
const chartDateRange = ref<[Date, Date] | null>(null)
const isLoadingKline = ref(false)
const klineInfo = ref({
  open: '0.00',
  high: '0.00',
  low: '0.00',
  close: '0.00',
  volume: '0',
  change: 0
})

// ECharts实例
let klineChart: echarts.ECharts | null = null

// 初始化
onMounted(() => {
  loadMarketOverview()
  loadStockData()
  initChartDateRange()
})

onUnmounted(() => {
  if (klineChart) {
    klineChart.dispose()
  }
})

// 初始化图表日期范围
function initChartDateRange() {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 3)
  chartDateRange.value = [start, end]
}

// 加载市场概览
async function loadMarketOverview() {
  try {
    const response = await fetch('http://127.0.0.1:8000/data/market-overview', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
    
    if (response.ok) {
      marketOverview.value = await response.json()
    }
  } catch (error) {
    console.error('加载市场概览失败:', error)
  }
}

// 加载股票数据
async function loadStockData() {
  isLoading.value = true
  try {
    // 模拟实时数据
    const mockData = [
      {
        code: '000001',
        name: '平安银行',
        price: 12.50,
        priceChange: 2.5,
        volume: 150000000,
        turnover: 2.8,
        ma5: 12.30,
        ma10: 12.20,
        ma20: 12.00,
        rsi: 65.5,
        macd: 0.15,
        updateTime: new Date()
      },
      {
        code: '000002',
        name: '万科A',
        price: 18.80,
        priceChange: -1.2,
        volume: 80000000,
        turnover: 1.5,
        ma5: 19.00,
        ma10: 19.20,
        ma20: 19.50,
        rsi: 45.2,
        macd: -0.08,
        updateTime: new Date()
      },
      {
        code: '600519',
        name: '贵州茅台',
        price: 1850.00,
        priceChange: 1.5,
        volume: 5000000,
        turnover: 0.8,
        ma5: 1840.00,
        ma10: 1830.00,
        ma20: 1820.00,
        rsi: 58.5,
        macd: 0.25,
        updateTime: new Date()
      }
    ]
    
    stockData.value = mockData
    isConnected.value = true
  } catch (error) {
    console.error('加载股票数据失败:', error)
    isConnected.value = false
  } finally {
    isLoading.value = false
  }
}

// 处理查看K线
function handleViewKline(stock: any) {
  selectedStock.value = stock
  showKlineDialog.value = true
  nextTick(() => {
    loadKlineData()
  })
}

// 处理添加到监控
function handleAddToMonitor(stock: any) {
  ElMessage.success(`已将 ${stock.name} 添加到监控列表`)
}

// 加载K线数据
async function loadKlineData() {
  if (!selectedStock.value || !chartDateRange.value) {
    return
  }

  isLoadingKline.value = true
  try {
    const [startDate, endDate] = chartDateRange.value
    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]

    const response = await fetch(
      `http://127.0.0.1:8000/data/download-history?codes=${selectedStock.value.code}&start_date=${startStr}&end_date=${endStr}&period=${chartPeriod.value}&adjust=qfq`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('获取K线数据失败')
    }

    const data = await response.json()
    if (data && data.length > 0) {
      renderKlineChart(data)
      updateKlineInfo(data[data.length - 1])
    }
  } catch (error) {
    ElMessage.error('加载K线数据失败')
    console.error(error)
  } finally {
    isLoadingKline.value = false
  }
}

// 渲染K线图表
function renderKlineChart(data: any[]) {
  nextTick(() => {
    const chartDom = document.getElementById('kline-chart')
    if (!chartDom) return

    if (klineChart) {
      klineChart.dispose()
    }

    klineChart = echarts.init(chartDom)

    const option = {
      title: {
        text: `${selectedStock.value?.name} (${selectedStock.value?.code}) K线图`,
        left: 'center',
        textStyle: {
          color: '#fff'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#38bdf8',
        textStyle: {
          color: '#fff'
        }
      },
      legend: {
        data: ['K线', '成交量'],
        top: 30,
        textStyle: {
          color: '#fff'
        }
      },
      grid: [
        {
          left: '10%',
          right: '10%',
          height: '60%'
        },
        {
          left: '10%',
          right: '10%',
          top: '75%',
          height: '15%'
        }
      ],
      xAxis: [
        {
          type: 'category',
          data: data.map(item => item.date),
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax',
          axisLabel: {
            color: '#94a3b8'
          }
        },
        {
          type: 'category',
          gridIndex: 1,
          data: data.map(item => item.date),
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax',
          axisLabel: {
            color: '#94a3b8'
          }
        }
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true
          },
          axisLabel: {
            color: '#94a3b8'
          }
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false }
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 0,
          end: 100
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          top: '85%',
          start: 0,
          end: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderColor: '#38bdf8',
          fillerColor: 'rgba(56, 189, 248, 0.1)',
          handleStyle: {
            color: '#38bdf8'
          }
        }
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: data.map(item => [item.open, item.close, item.low, item.high]),
          itemStyle: {
            color: '#ef4444',
            color0: '#10b981',
            borderColor: '#ef4444',
            borderColor0: '#10b981'
          }
        },
        {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: data.map(item => item.volume),
          itemStyle: {
            color: '#38bdf8'
          }
        }
      ]
    }

    klineChart.setOption(option)
  })
}

// 更新K线信息
function updateKlineInfo(latestData: any) {
  klineInfo.value = {
    open: latestData.open?.toFixed(2) || '0.00',
    high: latestData.high?.toFixed(2) || '0.00',
    low: latestData.low?.toFixed(2) || '0.00',
    close: latestData.close?.toFixed(2) || '0.00',
    volume: latestData.volume?.toLocaleString() || '0',
    change: latestData.change || 0
  }
}

// 工具函数
function getPriceClass(change: number) {
  return change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
}

function formatPrice(price: number) {
  return price ? price.toFixed(2) : '0.00'
}

function formatChange(change: number) {
  return change ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : '0.00%'
}

function formatVolume(volume: number) {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(2) + '亿'
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(2) + '万'
  }
  return volume.toString()
}
</script>

<style scoped>
.data-view {
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 10px;
}

.page-header p {
  font-size: 1.125rem;
  color: #94a3b8;
}

.market-overview {
  margin-bottom: 30px;
}

.market-overview h2 {
  font-size: 1.5rem;
  color: #fff;
  margin-bottom: 20px;
}

.market-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.market-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.index-name {
  font-size: 1.1rem;
  color: #94a3b8;
  margin-bottom: 10px;
}

.index-price {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.index-change {
  font-size: 1rem;
  margin-bottom: 10px;
}

.index-volume {
  font-size: 0.9rem;
  color: #94a3b8;
}

.positive {
  color: #10b981;
}

.negative {
  color: #ef4444;
}

.neutral {
  color: #94a3b8;
}

/* K线对话框样式 */
.kline-dialog-content {
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.stock-info h3 {
  margin: 0;
  color: #fff;
}

.period-controls {
  display: flex;
  gap: 10px;
}

.date-controls {
  min-width: 300px;
}

.chart-container {
  flex: 1;
  position: relative;
}

.chart-area {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.chart-info {
  margin-top: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  color: #94a3b8;
  font-size: 0.9rem;
}

.info-item .value {
  color: #fff;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .market-cards {
    grid-template-columns: 1fr;
  }
  
  .chart-controls {
    flex-direction: column;
    gap: 15px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style> 