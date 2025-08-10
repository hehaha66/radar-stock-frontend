import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
    { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue') },
    { path: '/admin/login', name: 'admin-login', component: () => import('@/views/AdminLoginView.vue') },
    { path: '/forgot-password', name: 'forgot-password', component: () => import('@/views/ForgotPasswordView.vue') },
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
        { path: 'monitor', name: 'monitor', component: () => import('@/views/MonitorView.vue')},
        { path: 'history', name: 'history', component: () => import('@/views/HistoryView.vue')},
        { path: 'docs', name: 'api-docs', component: () => import('@/views/ApiView.vue') },
        { path: 'ai-stock', name: 'ai选股', component: () => import('@/views/AIStockView.vue') },
        { path: 'about', name: 'about', component: () => import('@/views/AboutView.vue') },
        { path: 'user', name: 'user', component: () => import('@/views/UserCenterView.vue'), meta: { requiresAuth: true } },
        { path: 'super-manager', name: 'super-manager', component: () => import('@/views/SuperManagerView.vue'), meta: { requiresAdmin: true } }
      ]
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // --- 关键修改点 ---
  // 在判断登录状态前，先尝试自动登录
  await userStore.tryAutoLogin();

  const isLoggedIn = userStore.isLoggedIn;
  const isAdmin = userStore.userInfo?.is_superuser === true;

  // 检查管理员权限
  if (to.meta.requiresAdmin) {
    if (isLoggedIn && isAdmin) {
      next();
    } else {
      ElMessage.error('需要管理员权限！');
      next(isLoggedIn ? { name: 'home' } : { name: 'admin-login' });
    }
    return;
  }

  // 检查普通用户权限
  if (to.meta.requiresAuth && !isLoggedIn) {
    ElMessage.warning('请先登录以访问该页面。');
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if ((to.name === 'login' || to.name === 'register') && isLoggedIn) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router
