// 文件: src/types/workspace.ts (全新创建)

// 定义工作区中“实体”的结构
// 它应该与您后端 app/schemas.py 中的 WorkspaceEntityOut 模型相匹配
export interface WorkspaceEntity {
  id: number;
  entity_type: string;
  name: string;
  definition: any; // 这是一个灵活的JSON对象
  display_order: number;
}

// 定义“监控工作区”的结构
// 它应该与您后端 app/schemas.py 中的 MonitorWorkspaceOut 模型相匹配
export interface MonitorWorkspace {
  id: number;
  name: string;
  is_active: boolean;
  entities: WorkspaceEntity[];
}
