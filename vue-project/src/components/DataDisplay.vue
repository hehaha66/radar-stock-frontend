<template>
  <div class="data-display">
    <!-- 数据概览卡片 -->
    <div class="data-overview">
      <div class="overview-card">
        <div class="card-header">
          <h3>实时数据</h3>
          <el-tag :type="isConnected ? 'success' : 'danger'">
            {{ isConnected ? '已连接' : '未连接' }}
          </el-tag>
        </div>
        <div class="card-content">
          <div class="stat-item">
            <span class="label">监控股票:</span>
            <span class="value">{{ stockCount }}</span>
          </div>
          <div class="stat-item">
            <span class="label">数据更新:</span>
            <span class="value">{{ lastUpdateTime }}</span>
          </div>
          <div class="stat-item">
            <span class="label">连接状态:</span>
            <span class="value" :class="connectionStatusClass">
              {{ connectionStatus }}
            </span>
          </div>
        </div>
      </div>

      <div class="overview-card">
        <div class="card-header">
          <h3>历史数据</h3>
          <el-tag type="info">K线数据</el-tag>
        </div>
        <div class="card-content">
          <div class="stat-item">
            <span class="label">可用周期:</span>
            <span class="value">日线/周线/月线</span>
          </div>
          <div class="stat-item">
            <span class="label">数据范围:</span>
            <span class="value">A股/港股/美股</span>
          </div>
          <div class="stat-item">
            <span class="label">复权方式:</span>
            <span class="value">前复权/后复权</span>
          </div>
        </div>
      </div>

      <div class="overview-card">
        <div class="card-header">
          <h3>技术指标</h3>
          <el-tag type="warning">实时计算</el-tag>
        </div>
        <div class="card-content">
          <div class="stat-item">
            <span class="label">MA指标:</span>
            <span class="value">MA5/MA10/MA20</span>
          </div>
          <div class="stat-item">
            <span class="label">RSI指标:</span>
            <span class="value">14周期</span>
          </div>
          <div class="stat-item">
            <span class="label">MACD指标:</span>
            <span class="value">12/26/9</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据筛选器 -->
    <div class="data-filter">
      <div class="filter-section">
        <h4>数据筛选</h4>
        <div class="filter-controls">
          <el-select v-model="selectedMarket" placeholder="选择市场" @change="filterData">
            <el-option label="全部市场" value="all" />
            <el-option label="A股市场" value="A" />
            <el-option label="港股市场" value="HK" />
            <el-option label="美股市场" value="US" />
          </el-select>

          <el-select v-model="selectedChange" placeholder="涨跌幅筛选" @change="filterData">
            <el-option label="全部" value="all" />
            <el-option label="上涨" value="up" />
            <el-option label="下跌" value="down" />
            <el-option label="涨停" value="limit-up" />
            <el-option label="跌停" value="limit-down" />
          </el-select>

          <el-input
            v-model="searchKeyword"
            placeholder="搜索股票代码或名称"
            @input="filterData"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="data-table">
      <el-table
        :data="filteredStockData"
        style="width: 100%"
        :row-class-name="getRowClassName"
        v-loading="isLoading"
        @row-click="handleRowClick"
      >
        <el-table-column prop="code" label="代码" width="100" fixed="left">
          <template #default="{ row }">
            <div class="stock-code">
              <span class="code">{{ row.code }}</span>
              <el-tag size="small" :type="getMarketTagType(row.code)">
                {{ getMarketName(row.code) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="名称" width="120" />
        
        <el-table-column prop="price" label="最新价" width="100">
          <template #default="{ row }">
            <span :class="getPriceClass(row.priceChange)">
              {{ formatPrice(row.price) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="change" label="涨跌幅" width="100">
          <template #default="{ row }">
            <span :class="getPriceClass(row.priceChange)">
              {{ formatChange(row.priceChange) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="volume" label="成交量" width="120">
          <template #default="{ row }">
            {{ formatVolume(row.volume) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="turnover" label="换手率" width="100">
          <template #default="{ row }">
            {{ formatPercent(row.turnover) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="ma5" label="MA5" width="100">
          <template #default="{ row }">
            {{ formatPrice(row.ma5) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="ma10" label="MA10" width="100">
          <template #default="{ row }">
            {{ formatPrice(row.ma10) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="ma20" label="MA20" width="100">
          <template #default="{ row }">
            {{ formatPrice(row.ma20) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="rsi" label="RSI" width="80">
          <template #default="{ row }">
            <span :class="getRSIClass(row.rsi)">
              {{ formatRSI(row.rsi) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="macd" label="MACD" width="100">
          <template #default="{ row }">
            <span :class="getMACDClass(row.macd)">
              {{ formatMACD(row.macd) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="updateTime" label="更新时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.updateTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewKline(row)">K线</el-button>
            <el-button size="small" type="primary" @click="addToMonitor(row)">监控</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页器 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

// Props
interface Props {
  stockData: any[]
  isLoading?: boolean
  isConnected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  stockData: () => [],
  isLoading: false,
  isConnected: false
})

// Emits
const emit = defineEmits<{
  viewKline: [stock: any]
  addToMonitor: [stock: any]
}>()

// 响应式数据
const selectedMarket = ref('all')
const selectedChange = ref('all')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// 计算属性
const stockCount = computed(() => props.stockData.length)

const lastUpdateTime = computed(() => {
  if (props.stockData.length === 0) return '无数据'
  const latest = props.stockData.reduce((latest, current) => {
    return new Date(current.updateTime) > new Date(latest.updateTime) ? current : latest
  })
  return new Date(latest.updateTime).toLocaleTimeString()
})

const connectionStatus = computed(() => {
  return props.isConnected ? '正常' : '断开'
})

const connectionStatusClass = computed(() => {
  return props.isConnected ? 'status-connected' : 'status-disconnected'
})

const totalCount = computed(() => filteredStockData.value.length)

const filteredStockData = computed(() => {
  let filtered = [...props.stockData]

  // 市场筛选
  if (selectedMarket.value !== 'all') {
    filtered = filtered.filter(stock => {
      const market = getMarketFromCode(stock.code)
      return market === selectedMarket.value
    })
  }

  // 涨跌幅筛选
  if (selectedChange.value !== 'all') {
    filtered = filtered.filter(stock => {
      const change = stock.priceChange || 0
      switch (selectedChange.value) {
        case 'up':
          return change > 0
        case 'down':
          return change < 0
        case 'limit-up':
          return change >= 9.8 // 涨停阈值
        case 'limit-down':
          return change <= -9.8 // 跌停阈值
        default:
          return true
      }
    })
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(stock => 
      stock.code.toLowerCase().includes(keyword) ||
      stock.name.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 方法
function getMarketFromCode(code: string): string {
  if (code.startsWith('60') || code.startsWith('00') || code.startsWith('30')) {
    return 'A'
  } else if (code.startsWith('00') && code.length === 4) {
    return 'HK'
  } else {
    return 'US'
  }
}

function getMarketName(code: string): string {
  const market = getMarketFromCode(code)
  switch (market) {
    case 'A':
      return 'A股'
    case 'HK':
      return '港股'
    case 'US':
      return '美股'
    default:
      return '其他'
  }
}

function getMarketTagType(code: string): string {
  const market = getMarketFromCode(code)
  switch (market) {
    case 'A':
      return 'success'
    case 'HK':
      return 'warning'
    case 'US':
      return 'info'
    default:
      return 'default'
  }
}

function getPriceClass(change: number) {
  return change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
}

function getRSIClass(rsi: number) {
  if (rsi > 70) return 'rsi-overbought'
  if (rsi < 30) return 'rsi-oversold'
  return 'rsi-normal'
}

function getMACDClass(macd: number) {
  return macd > 0 ? 'macd-positive' : 'macd-negative'
}

function getRowClassName({ row }: { row: any }) {
  return row.priceChange > 0 ? 'positive-row' : row.priceChange < 0 ? 'negative-row' : ''
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

function formatPercent(value: number) {
  return value ? `${value.toFixed(2)}%` : '0.00%'
}

function formatRSI(rsi: number) {
  return rsi ? rsi.toFixed(2) : '0.00'
}

function formatMACD(macd: number) {
  return macd ? macd.toFixed(4) : '0.0000'
}

function formatTime(time: Date) {
  return new Date(time).toLocaleTimeString()
}

function filterData() {
  currentPage.value = 1
}

function handleRowClick(row: any) {
  // 行点击事件
  console.log('点击股票:', row)
}

function viewKline(stock: any) {
  emit('viewKline', stock)
}

function addToMonitor(stock: any) {
  emit('addToMonitor', stock)
}

function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
}

function handleCurrentChange(page: number) {
  currentPage.value = page
}
</script>

<style scoped>
.data-display {
  padding: 20px;
}

.data-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.overview-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.2rem;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item .label {
  color: #94a3b8;
  font-size: 0.9rem;
}

.stat-item .value {
  color: #fff;
  font-weight: 500;
}

.status-connected {
  color: #10b981;
}

.status-disconnected {
  color: #ef4444;
}

.data-filter {
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.filter-section h4 {
  margin: 0 0 15px 0;
  color: #fff;
}

.filter-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-controls .el-select {
  min-width: 150px;
}

.filter-controls .el-input {
  min-width: 200px;
}

.data-table {
  margin-bottom: 20px;
}

.stock-code {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.code {
  font-weight: bold;
  color: #38bdf8;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.positive {
  color: #10b981;
  font-weight: bold;
}

.negative {
  color: #ef4444;
  font-weight: bold;
}

.neutral {
  color: #94a3b8;
}

.rsi-overbought {
  color: #ef4444;
  font-weight: bold;
}

.rsi-oversold {
  color: #10b981;
  font-weight: bold;
}

.rsi-normal {
  color: #94a3b8;
}

.macd-positive {
  color: #10b981;
}

.macd-negative {
  color: #ef4444;
}

:deep(.positive-row) {
  background-color: rgba(16, 185, 129, 0.1) !important;
}

:deep(.negative-row) {
  background-color: rgba(239, 68, 68, 0.1) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-overview {
    grid-template-columns: 1fr;
  }
  
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-controls .el-select,
  .filter-controls .el-input {
    min-width: auto;
  }
}
</style> 