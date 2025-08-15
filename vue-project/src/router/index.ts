// 文件: src/router/index.ts (最终修正完整版 - 联动加载Workspace)

import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useUserStore } from '@/stores/user'
// 【【核心新增】】导入我们新的 workspaceStore
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // 您的所有路由定义都完整保留
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue')
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/AdminLoginView.vue')
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordView.vue')
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue')
        },
        {
          path: 'monitor',
          name: 'monitor',
          component: () => import('@/views/MonitorView.vue')
        },
        {
          path: 'history',
          name: 'history',
          component: () => import('@/views/HistoryView.vue')
        },
        {
          path: 'docs',
          name: 'api-docs',
          component: () => import('@/views/ApiView.vue')
        },
        {
          path: 'ai-stock',
          name: 'ai选股',
          component: () => import('@/views/AIStockView.vue')
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('@/views/AboutView.vue')
        },
        {
          path: 'user',
          name: 'user',
          component: () => import('@/views/UserCenterView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'super-manager',
          name: 'super-manager',
          component: () => import('@/views/SuperManagerView.vue'),
          meta: { requiresAdmin: true }
        }
      ]
    }
  ]
})

let hasRefreshedUserInfo = false;

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  // 【【核心新增】】获取 workspaceStore 实例
  const workspaceStore = useWorkspaceStore();

  if (userStore.token && !hasRefreshedUserInfo) {
    // forceRefreshUserInfo 会返回一个布尔值表示是否刷新成功
    const refreshSuccess = await userStore.forceRefreshUserInfo();
    hasRefreshedUserInfo = true;

    // 【【核心新增】】
    // 如果用户信息刷新成功（意味着用户已确认登录），
    // 那么就在这里，在这个确认了用户身份的时刻，去获取工作区列表！
    if (refreshSuccess) {
      await workspaceStore.fetchWorkspaces();
    }
  }

  // 后续的权限判断逻辑保持不变
  const isLoggedIn = userStore.isLoggedIn;
  const isAdmin = userStore.userInfo?.is_superuser === true;

  if (to.meta.requiresAdmin) {
    if (isLoggedIn && isAdmin) {
      next();
    } else {
      ElMessage.error('需要管理员权限才能访问该页面！');
      next(isLoggedIn ? { name: 'home' } : { name: 'admin-login' });
    }
    return;
  }

  if (to.meta.requiresAuth && !isLoggedIn) {
    ElMessage.warning('请先登录以访问该页面。');
    next({ name: 'login', query: { redirect: to.fullPath } });
  }
  else if ((to.name === 'login' || to.name === 'register') && isLoggedIn) {
    next({ name: 'home' });
  }
  else {
    next();
  }
});

export default router
