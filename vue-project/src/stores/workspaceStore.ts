// 文件路径: src/stores/workspaceStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as workspaceApi from '@/api/workspace';
import type { MonitorWorkspace, WorkspaceEntity } from '@/types/workspace';
import { ElMessage, ElMessageBox } from 'element-plus';

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<MonitorWorkspace[]>([]);
  const activeWorkspaceId = ref<number | null>(null);
  const isLoading = ref(false);

  const activeWorkspace = computed(() => {
    if (!activeWorkspaceId.value) return null;
    return workspaces.value.find(ws => ws.id === activeWorkspaceId.value);
  });
  const hasWorkspaces = computed(() => workspaces.value.length > 0);

  // --- 工作区 Actions ---

  async function fetchWorkspaces() {
    isLoading.value = true;
    try {
      const response = await workspaceApi.getWorkspaces();
      workspaces.value = response.data || [];
      const currentIdIsValid = workspaces.value.some(ws => ws.id === activeWorkspaceId.value);
      if (!currentIdIsValid && workspaces.value.length > 0) {
        activeWorkspaceId.value = workspaces.value[0].id;
      } else if (workspaces.value.length === 0) {
        activeWorkspaceId.value = null;
      }
    } catch (error) {
      console.error("获取工作区失败:", error);
      ElMessage.error('获取工作区列表失败');
    } finally {
      isLoading.value = false;
    }
  }

  function setActiveWorkspace(id: number | null) {
    if (id !== null) {
        activeWorkspaceId.value = id;
    }
  }

  async function createNewWorkspace(name: string) {
    try {
      const response = await workspaceApi.createWorkspace(name);
      workspaces.value.push(response.data);
      activeWorkspaceId.value = response.data.id;
      ElMessage.success('工作区创建成功');
    } catch (error) {
       console.error("创建工作区失败:", error);
    }
  }

  async function deleteActiveWorkspace() {
      if (!activeWorkspace.value) return;
      try {
        await ElMessageBox.confirm(`确定要删除工作区 "${activeWorkspace.value.name}" 吗？此操作不可逆。`, '警告', {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
        });
        await workspaceApi.deleteWorkspace(activeWorkspace.value.id);
        await fetchWorkspaces(); // 删除后重新获取列表
        ElMessage.success('工作区已删除');
      } catch(error) {
        if (error !== 'cancel') {
            console.error("删除工作区失败:", error);
        }
      }
  }

  // --- 实体 Actions ---
  async function addEntity(entityData: any) {
      if (!activeWorkspace.value) return;
      try {
          const response = await workspaceApi.addEntityToWorkspace(activeWorkspace.value.id, entityData);
          // 后端返回新创建的实体，将其加入到当前工作区的entities数组
          activeWorkspace.value.entities.push(response.data);
          ElMessage.success('实体添加成功');
      } catch(e) {
        console.error("添加实体失败:", e)
      }
  }

  /**
   * 【新增】更新实体 Action
   * @param entityId 要更新的实体ID
   * @param entityData 新的实体数据
   */
  async function updateEntity(entityId: number, entityData: any) {
    if (!activeWorkspace.value) return;
    try {
      const response = await workspaceApi.updateEntity(activeWorkspace.value.id, entityId, entityData);
      const index = activeWorkspace.value.entities.findIndex(e => e.id === entityId);
      if (index > -1) {
        // 用后端返回的最新数据替换掉旧数据，确保状态同步
        activeWorkspace.value.entities[index] = response.data;
      }
      ElMessage.success('实体更新成功');
    } catch (error) {
      console.error("更新实体失败:", error);
    }
  }

  async function removeEntity(entityId: number) {
      if (!activeWorkspace.value) return;
      try {
          await workspaceApi.deleteEntity(activeWorkspace.value.id, entityId);
          const index = activeWorkspace.value.entities.findIndex(e => e.id === entityId);
          if (index > -1) {
            activeWorkspace.value.entities.splice(index, 1);
          }
          ElMessage.success('实体已删除');
      } catch(e) {
        console.error("删除实体失败:", e)
      }
  }

  function clearWorkspaces() {
    workspaces.value = [];
    activeWorkspaceId.value = null;
  }

  return {
    workspaces,
    activeWorkspaceId,
    isLoading,
    activeWorkspace,
    hasWorkspaces,
    fetchWorkspaces,
    setActiveWorkspace,
    createNewWorkspace,
    deleteActiveWorkspace,
    addEntity,
    updateEntity, // 导出新方法
    removeEntity,
    clearWorkspaces
  };
});
