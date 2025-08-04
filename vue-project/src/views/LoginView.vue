
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = '请输入邮箱和密码。';
    return;
  }
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const success = await userStore.login({
      username: email.value,
      password: password.value,
    });

    if (success) {
      // 检查 URL 中是否有 redirect 参数
      const redirectPath = route.query.redirect as string | undefined;

      if (userStore.userInfo?.role === 'admin') {
        // 管理员总是跳转到管理员页面
        await router.push('/super-manager');
      } else if (redirectPath) {
        // 如果有重定向路径，则跳转到该路径
        await router.push(redirectPath);
      } else {
        // 否则，跳转到默认的主页
        await router.push('/');
      }
    } else {
      // The error message is now handled globally by the request interceptor,
      // but we can set a generic one here as a fallback.
      errorMessage.value = '登录失败，请检查您的凭据。';
    }
  } catch (error: any) {
    // This catch block will now primarily catch network errors,
    // as API errors are handled by the interceptor.
    errorMessage.value = error.message || '登录时发生网络错误。';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="auth-page">
    <el-card class="auth-card" shadow="always">
      <template #header>
        <div class="card-header">
          <span>用户登录</span>
        </div>
      </template>
      <el-form @submit.prevent="handleLogin" label-position="top">
        <el-form-item label="邮箱">
          <el-input v-model="email" type="email" placeholder="请输入您的邮箱" size="large" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" placeholder="请输入您的密码" show-password size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="isLoading" size="large" style="width: 100%;">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div v-if="errorMessage" class="error-message">
        <el-alert :title="errorMessage" type="error" show-icon :closable="false" />
      </div>
      <div class="auth-links">
        <RouterLink to="/register">还没有账户？立即注册</RouterLink>
        <RouterLink to="/forgot-password">忘记密码？</RouterLink>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
/* Styles remain unchanged */
.auth-page { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #020617; }
.auth-card { width: 400px; }
.card-header { text-align: center; font-size: 1.5rem; font-weight: 600; }
.error-message { margin-top: 1rem; }
.auth-links { margin-top: 1.5rem; display: flex; justify-content: space-between; font-size: 0.875rem; }
a { color: var(--el-color-primary); text-decoration: none; }
a:hover { text-decoration: underline; }
</style>
