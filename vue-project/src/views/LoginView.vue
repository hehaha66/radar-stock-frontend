<!-- 文件: LoginView.vue (最终修正完整版 V2.0) -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 统一使用 username
const username = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = '请输入邮箱和密码。';
    return;
  }
  errorMessage.value = '';
  isLoading.value = true;

  try {
    // 【【核心修正】】
    // 传递给 store 的对象，属性名现在是 username，
    // 与 LoginFormData 类型完全匹配。
    const success = await userStore.login({
      username: username.value,
      password: password.value,
    });

    if (success) {
      const redirectPath = route.query.redirect as string | undefined;

      // 使用 is_superuser 来判断管理员身份
      if (userStore.userInfo?.is_superuser) {
        await router.push('/super-manager'); // 假设这是您的管理员后台路径
      } else if (redirectPath) {
        await router.push(redirectPath);
      } else {
        await router.push('/');
      }
    }
    // 错误处理已由拦截器和store完成
  } catch (error: any) {
    // 拦截器和store抛出的最终错误会在这里被捕获
    errorMessage.value = error.message || '登录时发生未知错误。';
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
          <!-- v-model 绑定的是 username -->
          <el-input v-model="username" type="email" placeholder="请输入您的邮箱" size="large" />
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
/* 样式保持不变 */
.auth-page { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #020617; }
.auth-card { width: 400px; }
.card-header { text-align: center; font-size: 1.5rem; font-weight: 600; }
.error-message { margin-top: 1rem; }
.auth-links { margin-top: 1.5rem; display: flex; justify-content: space-between; font-size: 0.875rem; }
a { color: var(--el-color-primary); text-decoration: none; }
a:hover { text-decoration: underline; }
</style>
