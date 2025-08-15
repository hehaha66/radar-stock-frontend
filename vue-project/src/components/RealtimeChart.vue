<script setup lang="ts">
import { defineProps, ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components'
import { LineChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

// 1. 注册 ECharts 组件
echarts.use([
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
])

// 2. 定义 props 和类型
interface TimeSeriesPoint {
  t: number; v: number | null;
}
type HistoryData = Record<string, Record<string, TimeSeriesPoint[]>>;

const props = defineProps<{
  data: HistoryData
}>()

// 3. ECharts 实例和 DOM 引用
const chartContainer = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// 4. 图表配置 (这是一个示例，将来可以由用户在设置面板中动态配置)
const chartConfig = ref({
  leftY: [
    { entity: 'TSLA', field: '最新价' },
    { entity: '000001', field: '最新价' },
  ],
  rightY: [
    { entity: 'TSLA', field: '涨跌幅(%)' }
  ],
})

// 5. ECharts 初始化
onMounted(() => {
  if (chartContainer.value) {
    chartInstance = echarts.init(chartContainer.value)
    // 监听窗口大小变化，使图表自适应
    window.addEventListener('resize', resizeChart)
  }
})

// 6. 组件卸载时销毁图表实例和事件监听
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', resizeChart)
})

function resizeChart() {
  chartInstance?.resize()
}

// 7. 核心逻辑：监听数据变化，并更新 ECharts
watch(
  () => props.data,
  (newData) => {
    if (!chartInstance) return

    // 将我们的数据格式转换为 ECharts 需要的 series 格式
    const series = [
        ...chartConfig.value.leftY.map(item => createSeries(item.entity, item.field, 0, newData)),
        ...chartConfig.value.rightY.map(item => createSeries(item.entity, item.field, 1, newData)),
    ].filter(s => s.data.length > 0);

    // ECharts 配置项
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: series.map(s => s.name),
        textStyle: { color: '#333' }
      },
      grid: {
        left: '3%', right: '4%', bottom: '10%', containLabel: true,
      },
      xAxis: {
        type: 'time',
      },
      yAxis: [
        { type: 'value', name: '价格', position: 'left', scale: true },
        { type: 'value', name: '涨跌幅(%)', position: 'right', scale: true,
          axisLabel: { formatter: '{value} %' }
        },
      ],
      dataZoom: [{ type: 'inside' }, { type: 'slider' }],
      series: series,
    }

    // 设置配置项，notMerge: true 确保旧的 series 被清除
    chartInstance.setOption(option, true)
  },
  { deep: true }
)

// 辅助函数：根据配置和数据创建一条 ECharts series
function createSeries(entityName: string, fieldName: string, yAxisIndex: number, allData: HistoryData) {
    const timeSeries = allData[entityName]?.[fieldName] || [];
    return {
        name: `${entityName} - ${fieldName}`,
        type: 'line',
        showSymbol: false,
        smooth: true,
        yAxisIndex,
        data: timeSeries.map(point => [point.t, point.v]),
    };
}
</script>

<template>
  <div ref="chartContainer" class="realtime-chart-container"></div>
</template>

<style scoped>
.realtime-chart-container {
  width: 100%;
  height: 100%;
  min-height: 400px; /* 确保有一个最小高度 */
}
</style>
