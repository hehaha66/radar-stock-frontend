// 文件: src/config/plans.ts
// 这个文件用来存放前端需要知晓的套餐配置，
// 与后端 app/plans.py 的 PLANS_CONFIG 保持同步。

export const PLANS_CONFIG: Record<string, any> = {
  freemium: {
    min_interval: 3.0,
    max_codes: 20,
    max_connections: 1
  },
  pro: {
    min_interval: 1.0,
    max_codes: 50,
    max_connections: 3
  },
  master: {
    min_interval: 0.2,
    max_codes: 500,
    max_connections: 10
  },
  admin: {
    min_interval: 0.1,
    max_codes: -1, // -1 代表无限
    max_connections: -1
  }
};
