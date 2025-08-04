// src/types/monitor.ts

export type AlertMetric = 'price' | 'change' | 'volume' | 'rsi' | 'macd';
export type AlertOperator = '>' | '<' | '==' | '>=' | '<=' | 'crosses';
export type AlertType = 'sound' | 'notification' | 'both';

export interface AlertRule {
  id: string; // Unique ID for the rule, e.g., using UUID or timestamp
  stockCode: string; // 股票代码
  metric: AlertMetric;
  operator: AlertOperator;
  value: number;
  alertType: AlertType; // 警报类型
  isActive: boolean;
} 