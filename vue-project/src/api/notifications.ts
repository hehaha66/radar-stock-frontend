// 文件路径: src/api/notifications.ts
import request from './request';
import type { ApiResponse } from '@/types/api';

/**
 * 发送测试警报邮件
 * @param target_email 目标邮箱
 */
export const sendTestEmail = (target_email: string): Promise<ApiResponse<null>> => {
  return request.post('/notifications/send-test-email', { target_email });
};
