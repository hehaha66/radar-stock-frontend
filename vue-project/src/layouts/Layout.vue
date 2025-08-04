<template>
  <div ref="chartRef" style="width: 100%; height: 100%;"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, type PropType } from 'vue';
import * as echarts from 'echarts';
import type { EChartsOption, GridComponentOption } from 'echarts';

// --- Props Definition ---
const props = defineProps({
  processedData: { type: Object as PropType<any>, required: true },
  stockCode: { type: String, required: true },
  isLoading: { type: Boolean, required: true },
  apiError: { type: String as PropType<string | null>, required: true },
  activeIndicators: { type: Array as PropType<string[]>, required: true },
});

// --- Chart Instance ---
const chartRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;

// --- Chart Configuration ---
const setChartOption = (data: any, code: string, indicators: string[]) => {
  if (!myChart) return;

  const upColor = '#ef4444';
  const downColor = '#22c55e';

  // --- Dynamic Grid & Axis Calculation ---
  const grids: GridComponentOption[] = [];
  const xAxes: any[] = [];
  const yAxes: any[] = [];
  const series: any[] = [];
  const dataZoomXAxisIndexes: number[] = [];

  const totalParts = 100;
  const mainChartHeight = 50;
  const subChartHeight = 15;
  const gap = 3;
  let currentTop = 15;

  // 1. Main K-line Chart
  grids.push({ left: '60', right: '60', height: `${mainChartHeight}%`, top: `${currentTop}%` });
  xAxes.push({ type: 'category', gridIndex: 0, data: data.dates, axisLine: { onZero: false }, splitLine: { show: false }, axisLabel: { show: false } });
  yAxes.push({ scale: true, gridIndex: 0, splitLine: { show: true, lineStyle: { color: 'rgba(55, 65, 81, 0.5)' } }, axisLabel: { color: '#94a3b8' } });
  dataZoomXAxisIndexes.push(0);
  series.push(
    { name: 'K线', type: 'candlestick', data: data.klineValues, itemStyle: { color: upColor, color0: downColor, borderColor: upColor, borderColor0: downColor } },
    { name: 'MA5', type: 'line', data: data.ma.ma5, smooth: true, showSymbol: false, lineStyle: { width: 1.5, opacity: 0.8 } },
    { name: 'MA10', type: 'line', data: data.ma.ma10, smooth: true, showSymbol: false, lineStyle: { width: 1.5, opacity: 0.8 } },
    { name: 'MA20', type: 'line', data: data.ma.ma20, smooth: true, showSymbol: false, lineStyle: { width: 1.5, opacity: 0.8 } },
    { name: 'MA60', type: 'line', data: data.ma.ma60, smooth: true, showSymbol: false, lineStyle: { width: 1.5, opacity: 0.8 } }
  );
  currentTop += mainChartHeight + gap;

  // 2. Volume Chart
  grids.push({ left: '60', right: '60', height: `${subChartHeight}%`, top: `${currentTop}%` });
  xAxes.push({ type: 'category', gridIndex: 1, data: data.dates, axisLabel: { show: false } });
  yAxes.push({ scale: true, gridIndex: 1, splitNumber: 2, axisLabel: { color: '#94a3b8' }, splitLine: { show: false } });
  dataZoomXAxisIndexes.push(1);
  series.push({ name: '成交量', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: data.volumes, itemStyle: { color: (p: any) => p.data[2] === 1 ? upColor : downColor } });
  currentTop += subChartHeight + gap;

  // 3. Dynamic Sub-charts for Indicators
  indicators.forEach(indicator => {
    const gridIndex = grids.length;
    grids.push({ left: '60', right: '60', height: `${subChartHeight}%`, top: `${currentTop}%` });
    xAxes.push({ type: 'category', gridIndex, data: data.dates, axisLabel: { color: '#94a3b8' } });
    yAxes.push({ scale: true, gridIndex, splitNumber: 2, axisLabel: { color: '#94a3b8' }, splitLine: { show: false } });
    dataZoomXAxisIndexes.push(gridIndex);

    switch(indicator) {
      case 'MACD':
        series.push(
          { name: 'DIF', type: 'line', data: data.macd.dif, xAxisIndex: gridIndex, yAxisIndex: gridIndex, showSymbol: false, lineStyle: { width: 1.5 } },
          { name: 'DEA', type: 'line', data: data.macd.dea, xAxisIndex: gridIndex, yAxisIndex: gridIndex, showSymbol: false, lineStyle: { width: 1.5 } },
          { name: 'MACD', type: 'bar', data: data.macd.macd, xAxisIndex: gridIndex, yAxisIndex: gridIndex, itemStyle: { color: (p: any) => p.value >= 0 ? upColor : downColor } }
        );
        break;
      case 'KDJ':
        series.push(
          { name: 'K', type: 'line', data: data.kdj.k, xAxisIndex: gridIndex, yAxisIndex: gridIndex, showSymbol: false, lineStyle: { width: 1.5 } },
          { name: 'D', type: 'line', data: data.kdj.d, xAxisIndex: gridIndex, yAxisIndex: gridIndex, showSymbol: false, lineStyle: { width: 1.5 } },
          { name: 'J', type: 'line', data: data.kdj.j, xAxisIndex: gridIndex, yAxisIndex: gridIndex, showSymbol: false, lineStyle: { width: 1.5 } }
        );
        break;
      case 'RSI':
        series.push({ name: 'RSI', type: 'line', data: data.rsi.rsi, xAxisIndex: gridIndex, yAxisIndex: gridIndex, showSymbol: false, lineStyle: { width: 1.5 } });
        break;
    }
    currentTop += subChartHeight + gap;
  });

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    axisPointer: { link: [{ xAxisIndex: 'all' }], label: { backgroundColor: '#777' } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: 'rgba(15, 23, 42, 0.85)', borderColor: '#374151', textStyle: { color: '#E5E7EB' } },
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    series: series,
    dataZoom: [
      { type: 'inside', xAxisIndex: dataZoomXAxisIndexes, start: data.dates.length > 100 ? 80 : 0, end: 100 },
      { show: true, xAxisIndex: dataZoomXAxisIndexes, type: 'slider', bottom: '0', height: '4%', start: data.dates.length > 100 ? 80 : 0, end: 100, textStyle: { color: '#94a3b8' } }
    ],
  };
  myChart.setOption(option, true);
};

// --- Lifecycle & Watchers ---
const handleResize = () => myChart?.resize();
const initChart = () => { if (chartRef.value) myChart = echarts.init(chartRef.value, 'dark'); };

watch(
  () => [props.isLoading, props.processedData, props.stockCode, props.apiError, props.activeIndicators],
  ([loading, newData, newCode, error, indicators]) => {
    if (!myChart) return;
    if (loading) {
      myChart.showLoading({ text: '正在加载数据...', color: '#3b82f6', textColor: '#9ca3af', maskColor: 'rgba(17, 24, 39, 0.8)', fontSize: 16 });
    } else {
      myChart.hideLoading();
      if (error) {
        myChart.clear();
        myChart.setOption({ title: { text: error, left: 'center', top: 'center', textStyle: { color: '#ef4444', fontSize: 16 } } });
      } else if (newData && newData.dates && newData.dates.length > 0) {
        setChartOption(newData, newCode, indicators as string[]);
      } else {
        myChart.clear();
        myChart.setOption({ title: { text: '请输入股票代码开始分析', left: 'center', top: 'center', textStyle: { color: '#64748b', fontSize: 16 } } });
      }
    }
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  myChart?.dispose();
});
</script>
