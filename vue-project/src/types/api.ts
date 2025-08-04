// src/types/api.ts

/**
 * Standardized backend API response structure.
 * @template T - The type of the 'data' field.
 */
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
} 