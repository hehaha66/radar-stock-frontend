<!-- src/views/RegisterView.vue (代码与之前相同，此处省略) -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as api from '@/api/auth';

const router = useRouter();

const form = ref({ email: '', password: '', confirmPassword: '', code: '' });
const isLoading = ref(false);
const isCodeSending = ref(false);

const sendCode = async () => {
  if (!form.value.email) {
    ElMessage.error('请输入邮箱地址');
    return;
  }
  isCodeSending.value = true;
  try {
    const response = await api.sendRegistrationCode(form.value.email);
    ElMessage.success(response.message);
  } finally {
    isCodeSending.value = false;
  }
};

const handleRegister = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    ElMessage.error('两次输入的密码不一致');
    return;
  }
  isLoading.value = true;
  try {
    await api.register({
      email: form.value.email,
      password: form.value.password,
      verification_code: form.value.code
    });
    ElMessage.success('注册成功！正在跳转到登录页面...');
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="auth-page">
    <el-card class="auth-card" shadow="always">
      <template #header><div class="card-header"><span>创建新账户</span></div></template>
      <el-form @submit.prevent="handleRegister" label-position="top">
        <el-form-item label="邮箱">
          <el-input v-model="form.email" type="email" placeholder="请输入您的邮箱" size="large">
            <template #append><el-button @click="sendCode" :loading="isCodeSending">发送验证码</el-button></template>
          </el-input>
        </el-form-item>
        <el-form-item label="密码 (至少8位)">
          <el-input v-model="form.password" type="password" placeholder="请输入您的密码" show-password size="large" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password size="large" />
        </el-form-item>
        <el-form-item label="邮箱验证码">
          <el-input v-model="form.code" placeholder="请输入6位验证码" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="isLoading" size="large" style="width: 100%;">注 册</el-button>
        </el-form-item>
      </el-form>
      <div class="auth-links"><RouterLink to="/login">已有账户？直接登录</RouterLink></div>
    </el-card>
  </div>
</template>

<style scoped>
/* Styles are shared with LoginView */
.auth-page { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #020617; }
.auth-card { width: 400px; }
.card-header { text-align: center; font-size: 1.5rem; font-weight: 600; }
.auth-links { margin-top: 1.5rem; text-align: center; }
a { color: var(--el-color-primary); text-decoration: none; }
a:hover { text-decoration: underline; }
</style>
