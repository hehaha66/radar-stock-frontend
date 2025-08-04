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
        { path: 'monitor', name: 'monitor', component: () => import('@/views/MonitorView.vue'), meta: { requiresAuth: true } },
        { path: 'history', name: 'history', component: () => import('@/views/HistoryView.vue'), meta: { requiresAuth: true } },

        { path: 'api-docs', name: 'api-docs', component: () => import('@/views/ApiView.vue') },
        { path: 'ai-stock', name: 'ai选股', component: () => import('@/views/AIStockView.vue'), meta: { requiresAuth: true } },
        { path: 'about', name: 'about', component: () => import('@/views/AboutView.vue') },
        { path: 'user', name: 'user', component: () => import('@/views/UserCenterView.vue'), meta: { requiresAuth: true } },
        { path: 'super-manager', name: 'super-manager', component: () => import('@/views/SuperManagerView.vue'), meta: { requiresAdmin: true } }
      ]
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // 关键修复：在每次导航前，如果 store 中没有用户信息但存在 token，
  // 则尝试从后端获取用户信息。这确保了刷新页面后登录状态能够恢复。
  if (localStorage.getItem('accessToken') && !userStore.isLoggedIn) {
    await userStore.getMe();
  }

  // 检查管理员权限
  if (to.meta.requiresAdmin) {
    if (userStore.isLoggedIn && userStore.userInfo?.role === 'admin') {
      next();
    } else {
      ElMessage.error('需要管理员权限！');
      // 如果已登录但不是管理员，则跳到主页；否则跳到管理员登录页
      next(userStore.isLoggedIn ? { name: 'home' } : { name: 'admin-login' });
    }
    return;
  } 

  // 检查普通用户权限
  if (to.meta.requiresAuth) {
    if (userStore.isLoggedIn) {
      next();
    } else {
      ElMessage.warning('请先登录以访问该页面。');
      next({ name: 'login', query: { redirect: to.fullPath } });
    }
    return;
  }

  next();
})

export default router
