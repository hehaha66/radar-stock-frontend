// 文件路径: src/stores/computationStore.ts

import { defineStore } from 'pinia';
import { reactive, watch } from 'vue';
import { useWorkspaceStore } from './workspaceStore';
import { FIELD_MAP } from '@/config/fieldMaps';
import { Parser } from 'expr-eval';
import { useAlertStore } from './alertStore'; // 导入新 store

export interface ComputedStockData {
  [key: string]: string | number | null;
}

export const useComputationStore = defineStore('computation', () => {
  const rawDataPool = reactive<Record<string, any>>({});
  const finalDataMap = reactive<Record<string, ComputedStockData>>({});
  const parser = new Parser();
  const alertStore = useAlertStore(); // 实例化

  function updateRawData(sseData: any[]) {
    if (!Array.isArray(sseData)) return;
    sseData.forEach(item => {
      if (item && item.a1) {
        rawDataPool[item.a1.toUpperCase()] = item;
      }
    });
  }

  function getRawTicker(marketCode: string): string {
      if (!marketCode) return '';
      const parts = marketCode.split('.');
      const ticker = parts.length > 1 ? parts[1] : parts[0];
      return ticker.toUpperCase();
  }

  function runComputations(pool: Record<string, any>) {
    const workspaceStore = useWorkspaceStore();
    const activeWorkspace = workspaceStore.activeWorkspace;
    if (!activeWorkspace) {
      Object.keys(finalDataMap).forEach(key => delete finalDataMap[key]);
      return;
    }

    const tempFinalMap: Record<string, ComputedStockData> = {};
    const entityNameToUpperMap: Record<string, string> = {};
    activeWorkspace.entities.forEach(e => { entityNameToUpperMap[e.name.toUpperCase()] = e.name; });

    // 1. 处理原生股票
    activeWorkspace.entities.filter(e => e.entity_type === 'BASE_STOCK').forEach(entity => {
      const marketCode = entity.definition?.code;
      if (!marketCode) return;
      const rawTicker = getRawTicker(marketCode);
      const rawStock = pool[rawTicker];
      if (rawStock) {
        const processedStock: ComputedStockData = {};
        for (const key in rawStock) {
          processedStock[FIELD_MAP[key] || key] = rawStock[key];
        }
        tempFinalMap[entity.name] = processedStock;
      }
    });

    // 2. 计算虚拟股票
    activeWorkspace.entities.filter(e => e.entity_type === 'STOCK_GROUP').forEach(groupEntity => {
      const groupDef = groupEntity.definition;
      const groupName = groupEntity.name;
      if (!groupName || !groupDef.members?.length) return;
      const virtualStock: ComputedStockData = { '名称': groupName, '股票代码': groupName };
      let totalWeight = 0;
      const weightedSums: Record<string, number> = {};
      groupDef.members.forEach((memberMarketCode: string) => {
        const memberEntity = activeWorkspace.entities.find(e => e.definition.code === memberMarketCode);
        if(!memberEntity) return;
        const memberStock = tempFinalMap[memberEntity.name];
        const weight = (groupDef.weights && groupDef.weights[memberMarketCode]) || 1;
        if (memberStock && weight > 0) {
          totalWeight += weight;
          for (const fieldName in memberStock) {
            const value = memberStock[fieldName];
            if (typeof value === 'number') {
              if (!weightedSums[fieldName]) weightedSums[fieldName] = 0;
              weightedSums[fieldName] += value * weight;
            }
          }
        }
      });
      if (totalWeight > 0) {
        for (const fieldName in weightedSums) { virtualStock[fieldName] = weightedSums[fieldName] / totalWeight; }
      }
      tempFinalMap[groupName] = virtualStock;
    });

    // 3. 计算自定义字段
    const customFieldEntities = activeWorkspace.entities.filter(e => e.entity_type === 'CUSTOM_FIELD');
    const MAX_PASSES = customFieldEntities.length + 1;
    for (let pass = 0; pass < MAX_PASSES; pass++) {
      let fieldsComputedInPass = 0;
      customFieldEntities.forEach(fieldEntity => {
        const fieldName = fieldEntity.name;
        const formula = fieldEntity.definition?.formula;
        if (!fieldName || !formula) return;

        for (const entityName in tempFinalMap) {
          const currentEntity = tempFinalMap[entityName];
          if (fieldName in currentEntity) continue;

          const contextData = buildFormulaContext(formula, currentEntity, tempFinalMap, entityNameToUpperMap);

          if (contextData) {
            try {
              currentEntity[fieldName] = parser.parse(contextData.safeFormula).evaluate(contextData.context);
              fieldsComputedInPass++;
            } catch (e) {
              currentEntity[fieldName] = null;
            }
          }
        }
      });
      if (fieldsComputedInPass === 0) break;
    }

    // 更新 finalDataMap
    Object.keys(finalDataMap).forEach(key => { if (!tempFinalMap[key]) delete finalDataMap[key]; });
    Object.assign(finalDataMap, tempFinalMap);

    // 【核心新增】在所有计算完成后，检查警报
    if (workspaceStore.activeWorkspace) {
        alertStore.checkAndTriggerAlerts(
            workspaceStore.activeWorkspace.entities,
            finalDataMap,
            (formula: string) => {
                // 警报公式不依赖当前实体，所以第一个参数为空对象
                const contextData = buildFormulaContext(formula, {}, finalDataMap, entityNameToUpperMap);
                if (contextData) {
                    try {
                        return !!parser.parse(contextData.safeFormula).evaluate(contextData.context);
                    } catch {
                        return false;
                    }
                }
                return false;
            }
        );
    }
  }

  function buildFormulaContext(formula: string, currentEntity: ComputedStockData, allEntities: Record<string, ComputedStockData>, upperMap: Record<string, string>): { safeFormula: string; context: Record<string, any> } | null {
      const context: Record<string, any> = {};
      let safeFormula = formula;

      const variables = [...new Set(formula.match(/\[([^\]]+)]|\{([^}]+)}\[([^\]]+)]/g) || [])];

      for (const variable of variables) {
          let value: number | null = null;

          let match = variable.match(/^\[([^\]]+)]$/);
          if (match) {
              const field = match[1];
              if (field in currentEntity && typeof currentEntity[field] === 'number') {
                  value = currentEntity[field] as number;
              } else return null;
          }

          match = variable.match(/^\{([^}]+)}\[([^\]]+)]$/);
          if (match) {
              const entityNameInFormula = match[1];
              const field = match[2];
              const realEntityName = upperMap[entityNameInFormula.toUpperCase()];
              const targetEntity = allEntities[realEntityName];

              if (targetEntity && field in targetEntity && typeof targetEntity[field] === 'number') {
                  value = targetEntity[field] as number;
              } else return null;
          }

          if (value !== null) {
              const safeVarName = 'v' + (Math.random() + 1).toString(36).substring(2);
              context[safeVarName] = value;
              safeFormula = safeFormula.replace(new RegExp(variable.replace(/\[/g, '\\[').replace(/]/g, '\\]').replace('{', '\\{').replace('}', '\\}'), 'g'), safeVarName);
          } else {
            return null;
          }
      }
      return { safeFormula, context };
  }

  watch(() => rawDataPool, runComputations, { deep: true });

  function clearAllData() {
    Object.keys(rawDataPool).forEach(key => delete rawDataPool[key]);
    Object.keys(finalDataMap).forEach(key => delete finalDataMap[key]);
  }

  return { rawDataPool, finalDataMap, updateRawData, clearAllData };
});
