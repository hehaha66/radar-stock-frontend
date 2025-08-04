<template>
  <div class="auth-page">
    <el-card class="auth-card" shadow="always">
      <template #header>
        <div class="card-header">
          <span>重置密码</span>
        </div>
      </template>
      <el-form @submit.prevent="handleForgotPassword" label-position="top">
        <el-form-item label="注册邮箱">
          <el-input v-model="email" type="email" placeholder="请输入您注册时使用的邮箱" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="isLoading" size="large" style="width: 100%;">
            发送重置链接
          </el-button>
        </el-form-item>
      </el-form>
      <div class="auth-links">
        <RouterLink to="/login">返回登录</RouterLink>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import service from '@/api';
import { ElMessage } from 'element-plus';

const email = ref('');
const isLoading = ref(false);

const handleForgotPassword = async () => {
  if (!email.value) {
    ElMessage.error('请输入邮箱地址');
    return;
  }
  isLoading.value = true;
  try {
    const response: any = await service.post('/auth/forgot-password', { email: email.value });
    ElMessage.success(response.message);
  } catch (error: any) {
    // ElMessage is already handled by the interceptor
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* 样式与 LoginView 共享 */
.auth-page { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #020617; }
.auth-card { width: 400px; }
.card-header { text-align: center; font-size: 1.5rem; font-weight: 600; }
.auth-links { margin-top: 1.5rem; text-align: center; }
a { color: var(--el-color-primary); text-decoration: none; }
a:hover { text-decoration: underline; }
</style>
