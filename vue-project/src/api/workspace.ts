// 文件路径: src/api/workspace.ts

import request from './request';
import type { ApiResponse } from '@/types/api';
import type { MonitorWorkspace, WorkspaceEntity } from '@/types/workspace';

// 获取所有工作区
export const getWorkspaces = (): Promise<ApiResponse<MonitorWorkspace[]>> => {
  return request.get('/workspaces/');
};

// 创建新工作区
export const createWorkspace = (name: string): Promise<ApiResponse<MonitorWorkspace>> => {
  return request.post('/workspaces/', { name });
};

// 更新工作区
export const updateWorkspace = (id: number, name: string): Promise<ApiResponse<MonitorWorkspace>> => {
  return request.put(`/workspaces/${id}`, { name });
};

// 删除工作区
export const deleteWorkspace = (id: number): Promise<ApiResponse<null>> => {
  return request.delete(`/workspaces/${id}`);
};

// --- 实体相关 API ---

// 添加实体到工作区
export const addEntityToWorkspace = (workspaceId: number, entityData: any): Promise<ApiResponse<WorkspaceEntity>> => {
  return request.post(`/workspaces/${workspaceId}/entities`, entityData);
};

// 更新实体
export const updateEntity = (workspaceId: number, entityId: number, entityData: any): Promise<ApiResponse<WorkspaceEntity>> => {
  return request.put(`/workspaces/${workspaceId}/entities/${entityId}`, entityData);
};

// 删除实体
export const deleteEntity = (workspaceId: number, entityId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/workspaces/${workspaceId}/entities/${entityId}`);
};
