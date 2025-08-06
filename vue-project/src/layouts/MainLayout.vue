<template>
  <div class="main-layout" :class="{'header-collapsed': !isHeaderVisible}" :style="layoutStyle">
    <header class="header">
      <div class="nav-content-wrapper" :class="{'visible': isHeaderVisible}">
        <nav class="nav">
          <RouterLink to="/" class="nav-brand">
            <svg class="brand-logo" viewBox="0 0 24 24"><path d="M12,2L2,12L12,22L22,12L12,2M12,4.83L17.17,10H6.83L12,4.83M12,19.17L6.83,14H17.17L12,19.17Z" /></svg>
            <span>雷达股眼</span>
          </RouterLink>
          <div class="nav-links">
            <RouterLink to="/" class="nav-link">首页</RouterLink>
            <RouterLink to="/monitor" class="nav-link">监控</RouterLink>
            <RouterLink to="/history" class="nav-link">历史数据</RouterLink>
            <RouterLink to="/ai-stock" class="nav-link">AI选股</RouterLink>
            <RouterLink to="/docs" class="nav-link">API文档</RouterLink>
            <RouterLink to="/about" class="nav-link">关于</RouterLink>
          </div>

          <div class="user-auth-section">
            <div v-if="!userStore.isLoggedIn" class="auth-buttons">
              <RouterLink to="/login" class="auth-btn login-btn">
                <el-icon><User /></el-icon>
                登录
              </RouterLink>
              <RouterLink to="/register" class="auth-btn register-btn">
                <el-icon><UserFilled /></el-icon>
                注册
              </RouterLink>
            </div>

            <div v-else class="user-menu">
              <el-dropdown trigger="click" @command="handleUserCommand">
                <div class="user-info">
                  <el-avatar :size="32" class="user-avatar">
                    {{ userStore.userInfo?.nickname?.[0] || userStore.userInfo?.email?.[0] || 'U' }}
                  </el-avatar>
                  <span class="user-name">{{ userStore.userInfo?.nickname || userStore.userInfo?.email }}</span>
                  <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="profile">
                      <el-icon><User /></el-icon>
                      个人资料
                    </el-dropdown-item>
                    <el-dropdown-item v-if="userStore.userInfo?.role === 'admin'" command="admin" divided>
                      <el-icon><Setting /></el-icon>
                      管理界面
                    </el-dropdown-item>
                    <el-dropdown-item divided command="logout">
                      <el-icon><SwitchButton /></el-icon>
                      退出登录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </nav>
      </div>

      <button @click="isHeaderVisible = !isHeaderVisible" class="header-toggle-btn">
        <el-icon><CaretTop /></el-icon>
      </button>
    </header>

    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, readonly } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  User,
  UserFilled,
  ArrowDown,
  SwitchButton,
  Setting,
  CaretTop
} from '@element-plus/icons-vue';

const router = useRouter();
const userStore = useUserStore();
const isHeaderVisible = ref(true);

const layoutStyle = computed(() => ({
  '--header-height': isHeaderVisible.value ? '60px' : '20px'
}));

provide('isHeaderVisible', readonly(isHeaderVisible));

const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/user');
      break;
    case 'admin':
      router.push('/super-manager');
      break;
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '确认退出', {
          confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
        });
        userStore.logout();
        ElMessage.success('已退出登录');
        router.push('/');
      } catch {}
      break;
  }
};
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
  position: relative;
  overflow-x: hidden;
  padding-top: var(--header-height);
  transition: padding-top 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(56, 189, 248, 0.1);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-content-wrapper {
  max-height: 60px; /* Adjust to your nav height */
  overflow: hidden;
  opacity: 1;
  transform: translateY(0);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-content-wrapper:not(.visible) {
  max-height: 0;
  opacity: 0;
  transform: translateY(-20px);
}

.nav {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.75rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #e2e8f0;
  text-decoration: none;
}
.brand-logo {
  width: 28px;
  height: 28px;
  fill: #38bdf8;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-brand:hover .brand-logo {
  transform: rotate(360deg);
}

.nav-links {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
}
.nav-link {
  color: #94a3b8;
  padding: 0.75rem 1.25rem;
  text-decoration: none;
  border-radius: 8px;
}
.nav-link:hover,
.nav-link.router-link-exact-active {
  color: #fff;
  background: rgba(56, 189, 248, 0.1);
}

.user-auth-section, .user-menu {
  display: flex;
  align-items: center;
}

.header-toggle-btn {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 20px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.1);
  border-top: none;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.header-toggle-btn .el-icon {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-content-wrapper:not(.visible) + .header-toggle-btn .el-icon {
  transform: rotate(180deg);
}

.main-content {
  position: relative;
  z-index: 1;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
