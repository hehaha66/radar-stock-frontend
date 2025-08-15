import { defineStore } from 'pinia'
// 【修正一】从 'vue' 中导入 watch
import { reactive, watch } from 'vue'
import { useComputationStore, type ComputedStockData } from './computationStore' // 【修正二.1】从 computationStore 导入类型

// 定义时间序列数据点格式
interface TimeSeriesPoint {
  t: number // timestamp
  v: number | null
}
// 定义存储结构
// { '股票代码': { '字段名': [TimeSeriesPoint, ...], ... }, ... }
type HistoryData = Record<string, Record<string, TimeSeriesPoint[]>>

const MAX_HISTORY_LENGTH = 300 // 最多保留300个数据点

export const useHistoryStore = defineStore('history', () => {
  // ----------------- 状态 (State) -----------------
  const timeSeriesData = reactive<HistoryData>({})

  // ----------------- Actions -----------------
  const computationStore = useComputationStore()

  // 监听最终数据图谱的变化，记录历史
  watch(
    () => computationStore.finalDataMap,
    // 【修正二.2】为 newMap 添加明确的类型
    (newMap: Record<string, ComputedStockData>) => {
      const timestamp = Date.now()

      for (const entityName in newMap) {
        if (!timeSeriesData[entityName]) {
          timeSeriesData[entityName] = {}
        }

        const entityData = newMap[entityName]
        for (const fieldName in entityData) {
          const value = entityData[fieldName]
          // 只记录数值类型的字段
          if (typeof value === 'number') {
            if (!timeSeriesData[entityName][fieldName]) {
              timeSeriesData[entityName][fieldName] = []
            }

            const series = timeSeriesData[entityName][fieldName]
            series.push({ t: timestamp, v: value })

            // 维护历史记录长度
            if (series.length > MAX_HISTORY_LENGTH) {
              series.shift() // 移除最旧的数据点
            }
          }
        }
      }
    },
    { deep: true }
  )

  function clearHistory() {
    Object.keys(timeSeriesData).forEach((key) => delete timeSeriesData[key])
  }

  return {
    timeSeriesData,
    clearHistory,
  }
})
