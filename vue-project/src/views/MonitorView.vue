<!-- 文件路径: src/views/MonitorView.vue -->
<template>
  <div class="monitor-page-container">
    <!-- 1. 未登录状态 -->
    <div v-if="!isLoggedIn" class="fullscreen-prompt">
      <el-result icon="warning" title="请先登录" sub-title="您需要登录后才能使用实时监控仪表盘。">
        <template #extra>
          <router-link to="/login"><el-button type="primary" size="large">前往登录</el-button></router-link>
        </template>
      </el-result>
    </div>

    <!-- 2. 已登录，但无工作区状态 -->
    <div v-else-if="!workspaceStore.isLoading && !workspaceStore.hasWorkspaces" class="fullscreen-prompt">
      <el-result icon="info" title="开始您的监控之旅" sub-title="您还没有创建任何工作区，请先创建一个来组织您的股票。">
        <template #extra>
          <div class="create-first-ws">
            <el-input v-model="newWorkspaceName" placeholder="为您的第一个工作区命名" size="large" @keyup.enter="handleCreateWorkspace" />
            <el-button type="success" size="large" @click="handleCreateWorkspace" :loading="isCreatingWs">立即创建</el-button>
          </div>
        </template>
      </el-result>
    </div>

    <!-- 3. 已登录，且有工作区状态 (主界面) -->
    <div v-else class="monitor-layout">
      <!-- 顶部工具栏 -->
      <header class="monitor-header">
        <div class="header-left">
          <el-select :model-value="workspaceStore.activeWorkspaceId" @change="workspaceStore.setActiveWorkspace" placeholder="选择工作区" size="large" filterable>
            <el-option v-for="ws in workspaceStore.workspaces" :key="ws.id" :label="ws.name" :value="ws.id" />
          </el-select>
        </div>
        <div class="header-right">
          <div class="interval-setter">
            <span class="interval-label">刷新 (s):</span>
            <el-input-number
              v-model="settingsStore.refreshInterval"
              :min="userMinInterval"
              :max="300"
              :step="0.5"
              controls-position="right"
              size="small"
              style="width: 100px"
            />
          </div>
          <el-divider direction="vertical" />
          <span class="status-indicator" :class="sseStatus">
            <span class="status-dot"></span> {{ sseStatusMap[sseStatus] }}
          </span>
          <el-button type="primary" @click="toggleConnection" :icon="isSseRunning ? VideoPause : VideoPlay" :disabled="!workspaceStore.activeWorkspace">
            {{ isSseRunning ? '停止监控' : '开始监控' }}
          </el-button>
          <el-button :icon="Setting" @click="settingsDialogVisible = true">设置</el-button>
        </div>
      </header>
      <main class="monitor-content-resizable">
        <splitpanes horizontal class="default-theme" @resize="handlePaneResize">
          <pane :size="paneSize" min-size="20">
            <div class="grid-item data-table-container">
              <h3 class="grid-item-title">实时数据表</h3>
              <RealtimeDataTable />
            </div>
          </pane>
          <pane :size="100 - paneSize" min-size="20">
            <div class="grid-item chart-container">
              <h3 class="grid-item-title">实时分时图</h3>
              <div ref="chartRef" style="width: 100%; height: calc(100% - 30px);"></div>
            </div>
          </pane>
        </splitpanes>
      </main>
    </div>

    <!-- 设置弹窗 -->
    <el-dialog v-model="settingsDialogVisible" title="仪表盘设置" width="80%" top="5vh">
      <div v-if="workspaceStore.activeWorkspace" class="settings-dialog-content">
          <el-tabs type="border-card">
              <el-tab-pane label="实体管理">
                <div class="entity-manager-header">
                  <h4>当前工作区: {{ workspaceStore.activeWorkspace.name }}</h4>
                  <div>
                    <el-button @click="addStockDialogVisible = true" type="primary" plain>添加股票</el-button>
                    <el-button @click="openGroupEditor()" type="success" plain>创建分组</el-button>
                  </div>
                </div>
                <el-table :data="entitiesWithoutFields" height="400" style="width: 100%">
                    <el-table-column prop="name" label="名称" />
                    <el-table-column prop="entity_type" label="类型" width="120">
                      <template #default="{ row }">
                        <el-tag :type="getEntityTypeTag(row.entity_type)">{{ entityTypeMap[row.entity_type] || row.entity_type }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="180">
                        <template #default="scope">
                            <el-button v-if="scope.row.entity_type === 'STOCK_GROUP'" size="small" @click="openGroupEditor(scope.row)">编辑</el-button>
                            <el-button size="small" type="danger" @click="workspaceStore.removeEntity(scope.row.id)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
              </el-tab-pane>

              <el-tab-pane label="公式管理">
                <div v-if="customFieldEntities.length === 0" class="empty-settings tutorial-panel">
                    <el-icon :size="40" color="#e6a23c"><QuestionFilled /></el-icon>
                    <h3 class="tutorial-title">欢迎使用自定义字段！</h3>
                    <p class="tutorial-text">
                        在这里，您可以创建属于自己的衍生指标。通过编写简单的数学公式，将多个基础数据组合成有意义的新数据。
                    </p>
                    <div class="tutorial-examples">
                        <strong>例如:</strong>
                        <ul>
                            <li>计算开盘到现在的涨幅: <code>([最新价] / [开盘价] - 1) * 100</code></li>
                            <li>比较某股票与指数的超额收益: <code>{TSLA}[涨跌幅(%)] - {QQQ}[涨跌幅(%)]</code></li>
                        </ul>
                    </div>
                    <el-button @click="openFieldEditor()" type="warning" plain>创建第一个公式</el-button>
                </div>
                <div v-else>
                    <div class="entity-manager-header">
                        <h4>自定义字段公式</h4>
                        <el-button @click="openFieldEditor()" type="warning" plain>创建新公式</el-button>
                    </div>
                    <el-table :data="customFieldEntities" height="400" style="width: 100%">
                        <el-table-column prop="name" label="字段名" width="200" />
                        <el-table-column prop="definition.formula" label="公式" />
                        <el-table-column label="操作" width="180">
                            <template #default="scope">
                                <el-button size="small" @click="openFieldEditor(scope.row)">编辑</el-button>
                                <el-button size="small" type="danger" @click="workspaceStore.removeEntity(scope.row.id)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
              </el-tab-pane>

              <el-tab-pane label="警报管理">
                 <div v-if="alertRuleEntities.length === 0" class="empty-settings tutorial-panel">
                    <el-icon :size="40" color="#409eff"><BellFilled /></el-icon>
                    <h3 class="tutorial-title">设置您的第一个警报</h3>
                    <p class="tutorial-text">
                        当市场达到您设定的条件时，系统会自动通知您。警报条件同样使用强大的公式引擎。
                    </p>
                    <div class="tutorial-examples">
                        <strong>例如:</strong>
                        <ul>
                            <li>价格突破预警: <code>{TSLA}[最新价] > 350</code></li>
                            <li>成交量异动: <code>[成交额(亿)] > 500 and [换手率(%)] > 5</code></li>
                            <li>复杂逻辑: <code>([涨跌幅(%)] > 2 or [涨跌幅(%)] < -2) and [量比] > 1.5</code></li>
                        </ul>
                    </div>
                    <el-button @click="openAlertEditor()" type="primary" plain>创建第一个警报</el-button>
                </div>
                <div v-else>
                    <div class="entity-manager-header">
                        <h4>设置警报规则</h4>
                        <el-button @click="openAlertEditor()" type="primary" plain>创建新警报</el-button>
                    </div>
                    <el-table :data="alertRuleEntities" height="350" style="width: 100%">
                        <el-table-column prop="name" label="警报名称" width="200" />
                        <el-table-column prop="definition.condition" label="触发条件 (公式)" />
                        <el-table-column label="动作" width="180">
                            <template #default="{ row }">
                                <el-icon v-if="row.definition.actions?.includes('notification')" :size="16" title="浏览器通知"><Bell /></el-icon>
                                <el-icon v-if="row.definition.actions?.includes('sound')" :size="16" style="margin-left: 8px;" title="声音提示"><Headset /></el-icon>
                                <el-icon v-if="row.definition.actions?.includes('email')" :size="16" style="margin-left: 8px;" title="邮件通知"><Message /></el-icon>
                            </template>
                        </el-table-column>
                        <el-table-column label="状态" width="100">
                            <template #default="{ row }">
                               <el-switch v-model="row.definition.is_active" @change="toggleAlertActive(row)" />
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="180">
                            <template #default="scope">
                                <el-button size="small" @click="openAlertEditor(scope.row)">编辑</el-button>
                                <el-button size="small" type="danger" @click="workspaceStore.removeEntity(scope.row.id)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <div class="notification-config-section">
                        <h4 class="setting-title">邮件通知设置</h4>
                        <div class="setting-item email-item">
                            <el-icon><Message /></el-icon>
                            <span class="email-label">警报接收邮箱:</span>
                            <el-input v-model="alertEmail" placeholder="请输入邮箱" style="width: 250px;"></el-input>
                            <el-button @click="handleSendTestEmail" :loading="isSendingTestEmail">发送测试邮件</el-button>
                        </div>
                    </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="表格设置">
                  <h4 class="setting-title">拖拽以排序，勾选以显示</h4>
                  <div class="setting-panel-fixed-height">
                    <draggable v-model="settingsStore.tableColumns" item-key="prop" handle=".handle" class="draggable-list">
                        <template #item="{ element }">
                            <div class="setting-item">
                                <span class="handle">⠿</span>
                                <el-checkbox v-model="element.visible" :label="element.label" size="large" />
                            </div>
                        </template>
                    </draggable>
                  </div>
              </el-tab-pane>

              <el-tab-pane label="图表设置">
                  <div class="entity-manager-header">
                      <h4 class="setting-title">配置图表曲线</h4>
                      <el-button @click="addChartSeries" type="primary" plain>添加新曲线</el-button>
                  </div>
                  <div class="setting-panel-fixed-height">
                    <div v-if="settingsStore.chartSeries.length === 0" class="empty-settings">
                        <p>暂无图表曲线，请点击“添加新曲线”进行配置。</p>
                    </div>
                    <draggable v-model="settingsStore.chartSeries" item-key="id" handle=".handle" class="draggable-list" v-else>
                       <template #item="{ element, index }">
                            <div class="setting-item chart-series-item">
                                <span class="handle">⠿</span>
                                <el-select v-model="element.entityName" placeholder="选择实体" filterable class="series-select">
                                    <el-option v-for="name in allAvailableEntities" :key="name" :label="name" :value="name" />
                                </el-select>
                                <el-select v-model="element.fieldName" placeholder="选择字段" filterable class="series-select">
                                    <el-option v-for="field in allNumericFields" :key="field" :label="field" :value="field" />
                                </el-select>
                                <el-radio-group v-model="element.yAxis">
                                    <el-radio-button label="left">左Y轴</el-radio-button>
                                    <el-radio-button label="right">右Y轴</el-radio-button>
                                </el-radio-group>
                                <el-button type="danger" circle plain :icon="Delete" @click="removeChartSeries(index)"></el-button>
                            </div>
                        </template>
                    </draggable>
                  </div>
                   <div class="axis-config-section">
                      <h4 class="setting-title">坐标轴范围 (留空则自动)</h4>
                      <div class="setting-item axis-item">
                          <span>X轴 (时间):</span>
                          <el-date-picker
                            v-model="xAxisRange"
                            type="datetimerange"
                            range-separator="至"
                            start-placeholder="开始时间"
                            end-placeholder="结束时间"
                            :default-time="defaultDatePickerTime"
                            clearable
                          />
                          <el-button @click="resetXAxisRange" text>重置为默认</el-button>
                      </div>
                      <div class="setting-item axis-item">
                          <span>左 Y轴:</span>
                          <el-input-number v-model="leftYAxisConfig.min as number" placeholder="最小值" controls-position="right" clearable/>
                          <el-input-number v-model="leftYAxisConfig.max as number" placeholder="最大值" controls-position="right" clearable/>
                      </div>
                      <div class="setting-item axis-item">
                          <span>右 Y轴:</span>
                          <el-input-number v-model="rightYAxisConfig.min as number" placeholder="最小值" controls-position="right" clearable/>
                          <el-input-number v-model="rightYAxisConfig.max as number" placeholder="最大值" controls-position="right" clearable/>
                      </div>
                  </div>
              </el-tab-pane>

              <el-tab-pane label="工作区管理">
                  <div class="workspace-manager-content">
                    <el-input v-model="newWorkspaceNameDialog" placeholder="输入新工作区名称" style="width: 200px; margin-right: 10px;"></el-input>
                    <el-button @click="handleCreateWorkspaceInDialog" type="success">创建新工作区</el-button>
                    <el-button @click="workspaceStore.deleteActiveWorkspace()" type="danger" plain :disabled="!workspaceStore.activeWorkspace">删除当前工作区</el-button>
                  </div>
              </el-tab-pane>
          </el-tabs>
      </div>
       <div v-else class="empty-settings">
          <p>没有有效的工作区。</p>
          <p>请先在下方创建一个新工作区，或关闭此弹窗在主页引导中创建。</p>
          <div class="create-first-ws">
            <el-input v-model="newWorkspaceNameDialog" placeholder="为您的新工作区命名" />
            <el-button @click="handleCreateWorkspaceInDialog" type="success">创建</el-button>
          </div>
      </div>
    </el-dialog>

    <!-- 添加股票弹窗 -->
    <el-dialog v-model="addStockDialogVisible" title="添加股票实体" width="30%">
        <el-input v-model="newStockCode" placeholder="请输入股票代码 (如: TSLA, 000001)"></el-input>
        <template #footer>
            <el-button @click="addStockDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleConfirmAddStock">确认添加</el-button>
        </template>
    </el-dialog>

    <!-- 股票分组编辑器抽屉 -->
    <el-drawer v-model="groupEditorVisible" :title="groupEditorMode === 'create' ? '创建新分组' : '编辑分组'" direction="rtl" size="50%">
        <div class="group-editor-body">
            <el-form :model="groupForm" label-position="top">
                <el-form-item label="分组名称">
                    <el-input v-model="groupForm.name" placeholder="例如: A股核心资产"></el-input>
                </el-form-item>
                <el-form-item label="选择成分股">
                    <el-transfer
                        v-model="groupForm.members"
                        :data="availableStocksForGrouping"
                        :titles="['可选股票', '已选成员']"
                        filterable
                        :props="{ key: 'code', label: 'name' }"
                    />
                </el-form-item>
                <el-form-item label="设置权重 (总和无需为100)" v-if="groupForm.members.length > 0">
                    <div class="weights-container">
                       <div v-for="memberCode in groupForm.members" :key="memberCode" class="weight-item">
                           <span class="weight-label">{{ getStockNameByCode(memberCode) }} ({{ memberCode }})</span>
                           <el-input-number v-model="groupForm.weights[memberCode]" :min="0" controls-position="right" />
                       </div>
                    </div>
                </el-form-item>
            </el-form>
        </div>
        <div class="group-editor-footer">
            <el-button @click="groupEditorVisible = false">取消</el-button>
            <el-button type="primary" @click="handleConfirmGroupSave">保存分组</el-button>
        </div>
    </el-drawer>

    <!-- 自定义字段编辑器对话框 -->
    <el-dialog v-model="fieldEditorVisible" :title="fieldEditorMode === 'create' ? '创建新字段' : '编辑字段'" width="50%">
        <el-form :model="fieldForm" label-position="top">
            <el-form-item label="字段名称">
                <el-input v-model="fieldForm.name" placeholder="例如: 开盘%"></el-input>
            </el-form-item>
            <el-form-item label="计算公式">
                <div class="formula-editor-wrapper">
                    <el-input ref="formulaInputRef" v-model="fieldForm.formula" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" @input="handleFormulaInput(fieldForm.formula, 'field')" @keydown="handleFormulaKeyDown" @blur="hideSuggestions" @click="handleFormulaInput(fieldForm.formula, 'field')" />
                    <div v-if="suggestions.show && activeInputContext === 'field'" class="suggestions-panel" :style="suggestions.style">
                        <ul>
                            <li v-for="(item, index) in suggestions.items" :key="item.value" :class="{ active: index === suggestions.activeIndex }" @mousedown.prevent="handleSuggestionClick(item)">
                                <span class="suggestion-value">{{ item.value }}</span>
                                <span class="suggestion-type">{{ item.type }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="formula-helper-text">
                  使用 <code>[字段名]</code> 或 <code>{实体名}[字段名]</code> 引用指标。
                </div>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="fieldEditorVisible = false">取消</el-button>
            <el-button type="primary" @click="handleConfirmFieldSave">保存字段</el-button>
        </template>
    </el-dialog>

    <!-- 警报编辑器对话框 -->
    <el-dialog v-model="alertEditorVisible" :title="alertEditorMode === 'create' ? '创建新警报' : '编辑警报'" width="50%">
        <el-form :model="alertForm" label-position="top">
            <el-form-item label="警报名称">
                <el-input v-model="alertForm.name" placeholder="例如: QQQ突破600"></el-input>
            </el-form-item>
            <el-form-item label="触发条件 (公式返回 true 时触发)">
                <div class="formula-editor-wrapper">
                    <el-input ref="alertFormulaInputRef" v-model="alertForm.condition" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" @input="handleFormulaInput(alertForm.condition, 'alert')" @keydown="handleFormulaKeyDown" @blur="hideSuggestions" @click="handleFormulaInput(alertForm.condition, 'alert')" />
                    <div v-if="suggestions.show && activeInputContext === 'alert'" class="suggestions-panel" :style="suggestions.style">
                        <ul>
                            <li v-for="(item, index) in suggestions.items" :key="item.value" :class="{ active: index === suggestions.activeIndex }" @mousedown.prevent="handleSuggestionClick(item)">
                                <span class="suggestion-value">{{ item.value }}</span>
                                <span class="suggestion-type">{{ item.type }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </el-form-item>
            <el-form-item label="警报动作">
                <el-checkbox-group v-model="alertForm.actions">
                    <el-checkbox label="notification">浏览器通知</el-checkbox>
                    <el-checkbox label="sound">声音提示</el-checkbox>
                    <el-checkbox label="email">邮件通知</el-checkbox>
                </el-checkbox-group>
            </el-form-item>
            <el-form-item label="触发频率">
                <el-radio-group v-model="alertForm.frequency">
                    <el-radio label="once">仅触发一次 (停止监控后重置)</el-radio>
                    <el-radio label="always">每次满足都触发</el-radio>
                </el-radio-group>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="alertEditorVisible = false">取消</el-button>
            <el-button type="primary" @click="handleConfirmAlertSave">保存警报</el-button>
        </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import draggable from 'vuedraggable';
import { Delete, Bell, Headset, Message, QuestionFilled, BellFilled } from '@element-plus/icons-vue';

import { ref, computed, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useComputationStore } from '@/stores/computationStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useServerSentEvents } from '@/composables/useServerSentEvents';
import { Setting, VideoPlay, VideoPause } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { ElMessage, type ElInput } from 'element-plus';
import RealtimeDataTable from '@/components/RealtimeDataTable.vue';
import type { WorkspaceEntity } from '@/types/workspace';
import { FIELD_MAP } from '@/config/fieldMaps';
import { useSettingsStore, type ChartAxisConfig } from '@/stores/settingsStore';
import { useAlertStore } from '@/stores/alertStore';
import { sendTestEmail } from '@/api/notifications';
import { useLocalStorage } from '@vueuse/core';
import getCaretCoordinates from 'textarea-caret';

// --- Stores & Composables ---
const userStore = useUserStore();
const workspaceStore = useWorkspaceStore();
const computationStore = useComputationStore();
const historyStore = useHistoryStore();
const settingsStore = useSettingsStore();
const alertStore = useAlertStore();
const { status: sseStatus, connect: sseConnect, close: sseClose } = useServerSentEvents();

// --- Reactive State ---
const isLoggedIn = computed(() => userStore.isLoggedIn);
const settingsDialogVisible = ref(false);
const addStockDialogVisible = ref(false);
const newWorkspaceName = ref('');
const newWorkspaceNameDialog = ref('');
const isCreatingWs = ref(false);
const newStockCode = ref('');
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
const isSseRunning = computed(() => sseStatus.value === 'connected' || sseStatus.value === 'connecting');
const sseStatusMap = { disconnected: '已断开', connecting: '连接中...', connected: '已连接', error: '错误' };
const paneSize = ref(settingsStore.paneSize);

// --- 计算属性 ---
const userMinInterval = computed(() => userStore.userInfo?.min_interval ?? 5);
const allAvailableFields = computed(() => {
    const nativeFields = Object.values(FIELD_MAP);
    const customFields = workspaceStore.activeWorkspace?.entities.filter(e => e.entity_type === 'CUSTOM_FIELD').map(e => e.name) || [];
    return [...new Set([...nativeFields, ...customFields])];
});
const allAvailableEntities = computed(() => workspaceStore.activeWorkspace?.entities.filter(e => e.entity_type === 'BASE_STOCK' || e.entity_type === 'STOCK_GROUP').map(e => e.name) || []);
const customFieldEntities = computed(() => workspaceStore.activeWorkspace?.entities.filter(e => e.entity_type === 'CUSTOM_FIELD') || []);
const entitiesWithoutFields = computed(() => workspaceStore.activeWorkspace?.entities.filter(e => !['CUSTOM_FIELD', 'ALERT_RULE'].includes(e.entity_type)) || []);
const allNumericFields = computed(() => allAvailableFields.value.filter(field => !['名称', '股票代码', '所属行业板块', '上市日期'].includes(field)));
const alertRuleEntities = computed(() => workspaceStore.activeWorkspace?.entities.filter(e => e.entity_type === 'ALERT_RULE') || []);

// --- 实体类型美化 ---
const entityTypeMap: Record<string, string> = { 'BASE_STOCK': '基础股票', 'STOCK_GROUP': '股票分组', 'CUSTOM_FIELD': '自定义字段', 'ALERT_RULE': '警报规则' };
const getEntityTypeTag = (type: string) => {
    switch(type) {
        case 'BASE_STOCK': return 'info';
        case 'STOCK_GROUP': return 'success';
        case 'CUSTOM_FIELD': return 'warning';
        case 'ALERT_RULE': return 'danger';
        default: return 'primary';
    }
}

// --- 分组编辑器状态 ---
const groupEditorVisible = ref(false);
const groupEditorMode = ref<'create' | 'edit'>('create');
const editingGroupId = ref<number | null>(null);
const groupForm = ref({ name: '', members: [] as string[], weights: {} as Record<string, number> });
const availableStocksForGrouping = computed(() => workspaceStore.activeWorkspace?.entities.filter(e => e.entity_type === 'BASE_STOCK').map(e => ({ code: e.definition.code, name: e.name })) || []);
const getStockNameByCode = (code: string) => availableStocksForGrouping.value.find(s => s.code === code)?.name || code;
function openGroupEditor(entity: WorkspaceEntity | null = null) {
    if (entity && entity.entity_type === 'STOCK_GROUP') {
        groupEditorMode.value = 'edit';
        editingGroupId.value = entity.id;
        groupForm.value = { name: entity.name, members: entity.definition.members || [], weights: { ...(entity.definition.weights || {}) } };
    } else {
        groupEditorMode.value = 'create';
        editingGroupId.value = null;
        groupForm.value = { name: '', members: [], weights: {} };
    }
    groupEditorVisible.value = true;
}
async function handleConfirmGroupSave() {
    if (!groupForm.value.name.trim()) { ElMessage.warning('请输入分组名称'); return; }
    groupForm.value.members.forEach(code => { if (typeof groupForm.value.weights[code] !== 'number') { groupForm.value.weights[code] = 1; } });
    const entityData = {
        entity_type: 'STOCK_GROUP', name: groupForm.value.name.trim(),
        definition: { name: groupForm.value.name.trim(), members: groupForm.value.members, weights: groupForm.value.weights }
    };
    if (groupEditorMode.value === 'create') { await workspaceStore.addEntity(entityData); }
    else if (editingGroupId.value) { await (workspaceStore as any).updateEntity(editingGroupId.value, entityData); }
    groupEditorVisible.value = false;
}

// --- 自定义字段编辑器状态 ---
const fieldEditorVisible = ref(false);
const fieldEditorMode = ref<'create' | 'edit'>('create');
const editingFieldId = ref<number | null>(null);
const fieldForm = ref({ name: '', formula: '' });
const formulaInputRef = ref<InstanceType<typeof ElInput> | null>(null);

// --- 警报编辑器状态 ---
const alertEditorVisible = ref(false);
const alertEditorMode = ref<'create' | 'edit'>('create');
const editingAlertId = ref<number | null>(null);
const alertForm = ref({ name: '', condition: '', actions: ['notification', 'sound'] as string[], frequency: 'once', is_active: true });
const alertFormulaInputRef = ref<InstanceType<typeof ElInput> | null>(null);
const alertEmail = useLocalStorage('alert_email', userStore.userInfo?.email || '');
const isSendingTestEmail = ref(false);

// --- 智能提示状态与逻辑 ---
const suggestions = reactive({ show: false, items: [] as { value: string, type: string }[], activeIndex: 0, style: {} });
const activeInputContext = ref<'field' | 'alert' | null>(null);
function handleFormulaInput(value: string, context: 'field' | 'alert') {
    activeInputContext.value = context;
    const inputRef = context === 'field' ? formulaInputRef : alertFormulaInputRef;
    if (!inputRef.value) return;
    const inputEl = inputRef.value.textarea as HTMLTextAreaElement;
    if (!inputEl) return;
    const cursorPos = inputEl.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    let match;
    suggestions.activeIndex = 0;
    match = textBeforeCursor.match(/\{([^\}]+)\}\[([^\[\]]*)$/);
    if (match) {
        const [, entityName, partialField] = match;
        suggestions.items = allAvailableFields.value.filter(f => f.toLowerCase().includes(partialField.toLowerCase())).map(f => ({ value: f, type: '字段' }));
        suggestions.show = suggestions.items.length > 0;
        updateSuggestionPanelPosition(inputEl); return;
    }
    match = textBeforeCursor.match(/\[([^\[\]]*)$/);
    if (match) {
        const [, partialField] = match;
        suggestions.items = allAvailableFields.value.filter(f => f.toLowerCase().includes(partialField.toLowerCase())).map(f => ({ value: f, type: '字段' }));
        suggestions.show = suggestions.items.length > 0;
        updateSuggestionPanelPosition(inputEl); return;
    }
    match = textBeforeCursor.match(/\{([^\}]*)$/);
    if (match) {
        const [, partialEntity] = match;
        suggestions.items = allAvailableEntities.value.filter(e => e.toLowerCase().includes(partialEntity.toLowerCase())).map(e => ({ value: e, type: '实体' }));
        suggestions.show = suggestions.items.length > 0;
        updateSuggestionPanelPosition(inputEl); return;
    }
    suggestions.show = false;
}
function handleFormulaKeyDown(event: KeyboardEvent) {
    if (!suggestions.show) return;
    switch (event.key) {
        case 'ArrowUp':
            event.preventDefault();
            suggestions.activeIndex = (suggestions.activeIndex - 1 + suggestions.items.length) % suggestions.items.length;
            break;
        case 'ArrowDown':
            event.preventDefault();
            suggestions.activeIndex = (suggestions.activeIndex + 1) % suggestions.items.length;
            break;
        case 'Enter':
        case 'Tab':
            event.preventDefault();
            handleSuggestionClick(suggestions.items[suggestions.activeIndex]);
            break;
        case 'Escape':
            event.preventDefault();
            hideSuggestions();
            break;
    }
}
function handleSuggestionClick(item: { value: string, type: string }) {
    const context = activeInputContext.value;
    const form = context === 'field' ? fieldForm : alertForm;
    const inputRef = context === 'field' ? formulaInputRef : alertFormulaInputRef;
    if (!inputRef.value) return;
    const inputEl = inputRef.value.textarea as HTMLTextAreaElement;
    if (!inputEl) return;
    const formula = context === 'field' ? form.value.formula : form.value.condition;
    const cursorPos = inputEl.selectionStart || 0;
    const textBeforeCursor = formula.substring(0, cursorPos);
    let prefix = '';
    let finalValue = '';
    const matchField = textBeforeCursor.match(/(\[)([^\[\]]*)$/);
    const matchEntity = textBeforeCursor.match(/(\{)([^\}]*)$/);
    const matchEntityField = textBeforeCursor.match(/(\{([^\}]+)\}\[)([^\[\]]*)$/);
    if (matchEntityField) {
        prefix = textBeforeCursor.substring(0, matchEntityField.index || 0) + matchEntityField[1];
        finalValue = item.value + ']';
    } else if (matchField) {
        prefix = textBeforeCursor.substring(0, matchField.index || 0);
        finalValue = `[${item.value}]`;
    } else if (matchEntity) {
        prefix = textBeforeCursor.substring(0, matchEntity.index || 0);
        finalValue = `{${item.value}}`;
    }
    const newFormula = prefix + finalValue + formula.substring(cursorPos);
    if (context === 'field') { fieldForm.value.formula = newFormula; }
    else { alertForm.value.condition = newFormula; }
    hideSuggestions();
}
function hideSuggestions() { setTimeout(() => { suggestions.show = false; activeInputContext.value = null; }, 200); }
function updateSuggestionPanelPosition(inputEl: HTMLTextAreaElement) {
    nextTick(() => {
        const coords = getCaretCoordinates(inputEl, inputEl.selectionEnd);
        const rect = inputEl.getBoundingClientRect();
        suggestions.style = { top: `${rect.top + coords.top + coords.height}px`, left: `${rect.left + coords.left}px` };
    });
}

// --- Editor Handlers ---
function openFieldEditor(entity: WorkspaceEntity | null = null) {
    if (entity) {
        fieldEditorMode.value = 'edit';
        editingFieldId.value = entity.id;
        fieldForm.value = { name: entity.name, formula: entity.definition.formula || '', };
    } else {
        fieldEditorMode.value = 'create';
        editingFieldId.value = null;
        fieldForm.value = { name: '', formula: '' };
    }
    fieldEditorVisible.value = true;
}
async function handleConfirmFieldSave() {
    if (!fieldForm.value.name.trim() || !fieldForm.value.formula.trim()) { ElMessage.warning('字段名称和公式均不能为空'); return; }
    const entityData = {
        entity_type: 'CUSTOM_FIELD', name: fieldForm.value.name.trim(),
        definition: { name: fieldForm.value.name.trim(), formula: fieldForm.value.formula.trim(), }
    };
    if (fieldEditorMode.value === 'create') { await workspaceStore.addEntity(entityData); }
    else if (editingFieldId.value) { await (workspaceStore as any).updateEntity(editingFieldId.value, entityData); }
    fieldEditorVisible.value = false;
}
function openAlertEditor(entity: WorkspaceEntity | null = null) {
    if (entity) {
        alertEditorMode.value = 'edit';
        editingAlertId.value = entity.id;
        alertForm.value = {
            name: entity.name, condition: entity.definition.condition || '',
            actions: entity.definition.actions || ['notification', 'sound'],
            frequency: entity.definition.frequency || 'once',
            is_active: entity.definition.is_active !== false,
        };
    } else {
        alertEditorMode.value = 'create';
        editingAlertId.value = null;
        alertForm.value = { name: '', condition: '', actions: ['notification', 'sound'], frequency: 'once', is_active: true };
    }
    alertEditorVisible.value = true;
}
async function handleConfirmAlertSave() {
    if (!alertForm.value.name.trim() || !alertForm.value.condition.trim()) { ElMessage.warning('警报名称和触发条件均不能为空'); return; }
    const entityData = {
        entity_type: 'ALERT_RULE', name: alertForm.value.name.trim(),
        definition: { ...alertForm.value }
    };
    if (alertEditorMode.value === 'create') { await workspaceStore.addEntity(entityData); }
    else if (editingAlertId.value) { await (workspaceStore as any).updateEntity(editingAlertId.value, entityData); }
    alertEditorVisible.value = false;
}
async function toggleAlertActive(alertEntity: WorkspaceEntity) {
    const updatedEntity = JSON.parse(JSON.stringify(alertEntity));
    await (workspaceStore as any).updateEntity(updatedEntity.id, {
        name: updatedEntity.name, entity_type: updatedEntity.entity_type,
        definition: updatedEntity.definition
    });
    ElMessage.success(`警报 "${alertEntity.name}" 状态已更新`);
}
async function handleSendTestEmail() {
    if (!alertEmail.value) { ElMessage.warning('请输入要测试的邮箱地址。'); return; }
    isSendingTestEmail.value = true;
    try {
        const res = await sendTestEmail(alertEmail.value);
        ElMessage.success(res.msg);
    } finally { isSendingTestEmail.value = false; }
}
function handleEditEntity(entity: WorkspaceEntity) {
    if (entity.entity_type === 'STOCK_GROUP') { openGroupEditor(entity); }
    else if (entity.entity_type === 'CUSTOM_FIELD') { openFieldEditor(entity); }
}

// --- Main Handlers ---
function toggleConnection() {
    if (isSseRunning.value) {
        sseClose();
        alertStore.resetTriggeredAlerts();
    } else {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        alertStore.resetTriggeredAlerts();
        startMonitoring();
    }
}
function startMonitoring() {
  const workspace = workspaceStore.activeWorkspace;
  const token = userStore.apiToken;
  if (!workspace || !token) { ElMessage.info('请先选择一个包含股票的工作区。'); return; }
  const codes = workspace.entities.filter(e => e.entity_type === 'BASE_STOCK' && e.definition?.code).map(e => e.definition.code).join(',');
  if (codes) {
    const interval = Math.max(settingsStore.refreshInterval, userMinInterval.value);
    const url = `/monitor/sse/market-data?codes=${codes}&interval=${interval}&token=${token}`;
    sseConnect(url);
  } else { ElMessage.info('当前工作区没有股票，监控已停止。'); sseClose(); }
}
async function handleCreateWorkspace() {
    if (!newWorkspaceName.value.trim()) { ElMessage.warning('请输入工作区名称'); return; }
    isCreatingWs.value = true;
    await workspaceStore.createNewWorkspace(newWorkspaceName.value.trim());
    newWorkspaceName.value = '';
    isCreatingWs.value = false;
}
async function handleCreateWorkspaceInDialog() {
    if (!newWorkspaceNameDialog.value.trim()) { ElMessage.warning('请输入工作区名称'); return; }
    await workspaceStore.createNewWorkspace(newWorkspaceNameDialog.value.trim());
    newWorkspaceNameDialog.value = '';
}
async function handleConfirmAddStock() {
    if (!newStockCode.value.trim()) { ElMessage.warning('请输入股票代码'); return; }
    const codeToAdd = newStockCode.value.trim().toUpperCase();
    const entityData = { entity_type: 'BASE_STOCK', name: codeToAdd, definition: { code: codeToAdd } };
    await workspaceStore.addEntity(entityData);
    newStockCode.value = '';
    addStockDialogVisible.value = false;
}
function handlePaneResize(panes: { size: number }[]) {
    if (chartInstance) { setTimeout(() => { chartInstance?.resize(); }, 150); }
    settingsStore.paneSize = panes[0].size;
}
function addChartSeries() {
    settingsStore.chartSeries.push({
        id: Date.now().toString() + Math.random(),
        entityName: '', fieldName: '', yAxis: 'left'
    });
}
function removeChartSeries(index: number) {
    settingsStore.chartSeries.splice(index, 1);
}

// --- Chart Logic ---
const leftYAxisConfig = reactive<ChartAxisConfig>({ min: undefined, max: undefined });
const rightYAxisConfig = reactive<ChartAxisConfig>({ min: undefined, max: undefined });
const defaultDatePickerTime: [Date, Date] = [ new Date(2000, 1, 1, 9, 30, 0), new Date(2000, 1, 1, 16, 0, 0) ];
const xAxisRange = computed({
    get(): [Date, Date] | null {
        const { min, max } = settingsStore.chartXAxisConfig;
        if (min && max) { return [new Date(min), new Date(max)]; }
        return null;
    },
    set(value: [Date, Date] | null) {
        if (value) {
            settingsStore.chartXAxisConfig.min = value[0].getTime();
            settingsStore.chartXAxisConfig.max = value[1].getTime();
        } else {
            settingsStore.chartXAxisConfig.min = null;
            settingsStore.chartXAxisConfig.max = null;
        }
    }
});
function getDefaultTimeRange(): ChartAxisConfig {
    const today = new Date();
    const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30, 0);
    const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0, 0);
    return { min: startTime.getTime(), max: endTime.getTime() };
}
function resetXAxisRange() {
    settingsStore.chartXAxisConfig = getDefaultTimeRange();
}
function initChart() {
    if (chartRef.value && !chartInstance) {
        chartInstance = echarts.init(chartRef.value);
        const option: echarts.EChartsOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', position: (pt: number[]) => [pt[0], '10%'], backgroundColor: 'rgba(15, 23, 42, 0.85)', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
            legend: { show: true, textStyle: { color: '#94a3b8' }, type: 'scroll', bottom: 10, inactiveColor: '#475569' },
            grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
            xAxis: { type: 'time', axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { show: false } },
            yAxis: [
                { type: 'value', scale: true, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
                { type: 'value', scale: true, axisLabel: { color: '#94a3b8' }, splitLine: { show: false } }
            ],
            series: []
        };
        chartInstance.setOption(option);
    }
}
function updateChart() {
    if (!chartInstance) return;
    const seriesConfig = settingsStore.chartSeries;
    const seriesData = [];
    const legendData = [];
    const hasRightAxis = seriesConfig.some(s => s.yAxis === 'right');
    const yAxisConfig: echarts.EChartsOption['yAxis'] = [{
        type: 'value', scale: true,
        min: leftYAxisConfig.min ?? 'dataMin',
        max: leftYAxisConfig.max ?? 'dataMax',
        axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } }
    }];
    if(hasRightAxis) {
        yAxisConfig.push({
            type: 'value', scale: true, position: 'right',
            min: rightYAxisConfig.min ?? 'dataMin',
            max: rightYAxisConfig.max ?? 'dataMax',
            axisLabel: { color: '#94a3b8' }, splitLine: { show: false }
        });
    }
    for (const config of seriesConfig) {
        if (!config.entityName || !config.fieldName) continue;
        const history = historyStore.timeSeriesData[config.entityName]?.[config.fieldName];
        const seriesName = `${config.entityName}-${config.fieldName}`;
        if (history && history.length > 0) {
            legendData.push(seriesName);
            seriesData.push({
                name: seriesName, type: 'line', smooth: true, showSymbol: false,
                yAxisIndex: config.yAxis === 'right' && hasRightAxis ? 1 : 0,
                data: history.map(p => [p.t, p.v])
            });
        }
    }
    const xAxisConfig: echarts.EChartsOption['xAxis'] = {
        type: 'time',
        min: settingsStore.chartXAxisConfig.min || 'dataMin',
        max: settingsStore.chartXAxisConfig.max || 'dataMax',
    };
    chartInstance.setOption({
        legend: { data: legendData },
        xAxis: xAxisConfig,
        yAxis: yAxisConfig,
        series: seriesData
    }, { notMerge: false });
}

// --- Lifecycle & Watchers ---
onMounted(() => {
  if (isLoggedIn.value) { workspaceStore.fetchWorkspaces(); initChart(); }
  window.addEventListener('resize', handlePaneResize);
});
onUnmounted(() => {
    sseClose();
    if (chartInstance) { chartInstance.dispose(); chartInstance = null; }
    window.removeEventListener('resize', handlePaneResize);
});
watch(isLoggedIn, (loggedIn) => {
    if (loggedIn) {
        workspaceStore.fetchWorkspaces();
        import('vue').then(({ nextTick }) => nextTick(initChart));
    } else {
        workspaceStore.clearWorkspaces();
    }
});
watch(() => historyStore.timeSeriesData, updateChart, { deep: true });
watch(() => workspaceStore.activeWorkspace, (newWs, oldWs) => {
    if (newWs?.id !== oldWs?.id && isSseRunning.value) {
        alertStore.resetTriggeredAlerts();
        startMonitoring();
    }
}, { deep: true });
watch([() => settingsStore.chartSeries, leftYAxisConfig, rightYAxisConfig, () => settingsStore.chartXAxisConfig], updateChart, { deep: true });
</script>

<style scoped>
/* --- (所有样式保持不变) --- */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Fira+Code:wght@400;500&display=swap');
.monitor-page-container {
  background-color: #0f172a; color: #cbd5e1; height: 100vh; width: 100vw;
  display: flex; flex-direction: column; overflow: hidden; font-family: 'Inter', sans-serif; position: relative;
}
.fullscreen-prompt { flex-grow: 1; display: flex; align-items: center; justify-content: center; z-index: 1; }
.create-first-ws { display: flex; gap: 1rem; margin-top: 1rem; width: 400px; }
.monitor-layout { display: flex; flex-direction: column; height: 100%; padding: 1rem; box-sizing: border-box; }
.monitor-header {
  display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem;
  background-color: #1e293b; border-radius: 8px; flex-shrink: 0; margin-bottom: 1rem;
}
.header-left .workspace-title { font-size: 1.2rem; font-weight: 600; }
.header-right { display: flex; align-items: center; gap: 1rem; }
.status-indicator { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; transition: background-color 0.3s; }
.status-indicator.disconnected .status-dot { background-color: #909399; }
.status-indicator.connecting .status-dot { background-color: #e6a23c; animation: pulse 1.5s infinite; }
.status-indicator.connected .status-dot { background-color: #67c23a; }
.status-indicator.error .status-dot { background-color: #f56c6c; }
.monitor-content-resizable { flex-grow: 1; min-height: 0; }
.grid-item {
  background-color: #1e293b; border-radius: 8px; padding: 1rem;
  display: flex; flex-direction: column; overflow: hidden;
  width: 100%; height: 100%; box-sizing: border-box;
}
.grid-item-title { font-size: 1.1rem; font-weight: 600; margin: 0 0 1rem 0; color: #e2e8f0; flex-shrink: 0; }
.data-table-container { padding: 1rem 1rem 0 1rem; min-height: 0; }
.chart-instance { width: 100%; height: 100%; }
.empty-settings { text-align: center; padding: 2rem; color: #9ca3af; }
.workspace-manager-content { display: flex; align-items: center; }
.entity-manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.group-editor-body { padding: 0 20px; height: calc(100% - 60px); overflow-y: auto; }
.group-editor-footer { padding: 10px 20px; border-top: 1px solid var(--el-border-color-lighter); text-align: right; }
.weights-container { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.weight-item { display: flex; align-items: center; justify-content: space-between; }
.weight-label { flex-shrink: 0; margin-right: 20px; color: #cbd5e1; }
.formula-helper-text { font-size: 12px; color: #9ca3af; margin-top: 4px; }
.suggestion-item { display: flex; justify-content: space-between; }
.suggestion-type { font-size: 12px; color: #9ca3af; margin-left: 1rem;}
:deep(.el-table .cell) { display: flex; gap: 8px; }
:deep(.el-transfer-panel) { width: 250px; background-color: #0f172a; border: 1px solid #334155; }
:deep(.el-transfer-panel__header .el-checkbox__label), :deep(.el-transfer-panel__body), :deep(.el-transfer-panel .el-checkbox__label) { color: #cbd5e1; }
:deep(.splitpanes.default-theme .splitpanes__splitter) {
  background-color: transparent; box-sizing: border-box; position: relative;
  border: none; height: 9px; cursor: ns-resize;
}
:deep(.splitpanes.default-theme .splitpanes__splitter:before),
:deep(.splitpanes.default-theme .splitpanes__splitter:after) {
  content: none;
}
:deep(.splitpanes__splitter:hover) { background-color: rgba(56, 189, 248, 0.1); }
:deep(.splitpanes__splitter) { border-top: 1px solid #334155; transition: border-color 0.2s ease; }
:deep(.splitpanes__splitter:hover) { border-top-color: #38bdf8; }
.setting-panel-fixed-height {
    height: 400px;
    overflow-y: auto;
}
.setting-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 8px;
    border-bottom: 1px solid #334155;
}
.handle {
    cursor: grab;
    color: #9ca3af;
}
.chart-series-item {
    display: grid;
    grid-template-columns: 1fr 1fr auto auto;
    gap: 1rem;
}
.draggable-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.setting-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; }
.axis-config-section { margin-top: 1.5rem; border-top: 1px solid #334155; padding-top: 1.5rem; }
.axis-item { display: grid; grid-template-columns: 80px 1fr 1fr auto; gap: 1rem; }
.formula-popper { min-width: 300px !important; }
.formula-editor-wrapper { position: relative; }
.suggestions-panel {
    position: fixed; z-index: 2100;
    background-color: #2d3748; border: 1px solid #4a5568; border-radius: 6px;
    max-height: 200px; overflow-y: auto;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    min-width: 200px;
}
.suggestions-panel ul { list-style: none; padding: 4px; margin: 0; }
.suggestions-panel li {
    padding: 8px 12px; cursor: pointer; border-radius: 4px;
    display: flex; justify-content: space-between;
}
.suggestions-panel li.active { background-color: #4299e1; color: white; }
.suggestions-panel li:hover { background-color: #4a5568; }
.suggestions-panel li.active .suggestion-type { color: #e2e8f0; }
.notification-config-section {
    margin-top: 1.5rem;
    border-top: 1px solid #334155;
    padding-top: 1.5rem;
}
.email-item {
    display: flex;
    align-items: center;
    gap: 1rem;
}
.email-label {
    font-weight: 500;
    flex-shrink: 0;
}
.tutorial-panel {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; gap: 1rem; height: 400px; padding: 2rem; color: #9ca3af;
}
.tutorial-title { font-size: 1.5rem; font-weight: 600; color: #e2e8f0; }
.tutorial-text { max-width: 500px; line-height: 1.6; }
.tutorial-examples {
    background-color: rgba(15, 23, 42, 0.5); padding: 1rem; border-radius: 8px;
    border: 1px solid #334155; text-align: left; font-family: 'Fira Code', monospace; font-size: 14px;
}
.tutorial-examples ul { list-style-type: disc; padding-left: 20px; margin-top: 0.5rem; }

@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(230, 162, 60, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(230, 162, 60, 0); } 100% { box-shadow: 0 0 0 0 rgba(230, 162, 60, 0); } }
</style>
