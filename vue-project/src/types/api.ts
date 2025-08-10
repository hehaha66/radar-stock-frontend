// 文件: src/types/api.ts
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}
