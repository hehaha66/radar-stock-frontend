<!-- 文件: src/views/AdminLoginView.vue (全新恢复版) -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';

const router = useRouter();
const userStore = useUserStore();

// 登录表单的数据模型
const loginForm = ref({
  username: '', // 对应后端的 username 字段
  password: '',
});
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    errorMessage.value = '请输入管理员邮箱和密码。';
    return;
  }
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const success = await userStore.login(loginForm.value);

    if (success) {
      // 登录成功后，检查是否真的是管理员
      if (userStore.userInfo?.is_superuser) {
        ElMessage.success('管理员登录成功！');
        await router.push({ name: 'super-manager' }); // 跳转到管理员主页
      } else {
        // 如果登录的账号不是管理员，则登出并提示错误
        userStore.logout();
        errorMessage.value = '该账户不是管理员账户。';
        ElMessage.error('该账户不是管理员账户。');
      }
    }
    // 如果 success 为 false, store 或拦截器已处理错误
  } catch (error: any) {
    // 捕获 store 或拦截器抛出的最终错误
    errorMessage.value = error.message || '登录时发生未知错误。';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="admin-login-page">
    <el-card class="login-card" shadow="always">
      <template #header>
        <div class="card-header">
          <span>管理员登录</span>
        </div>
      </template>
      <el-form @submit.prevent="handleLogin" :model="loginForm" label-position="top">
        <el-form-item label="管理员邮箱">
          <el-input
            v-model="loginForm.username"
            type="email"
            placeholder="请输入管理员邮箱"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            size="large"
            :prefix-icon="Lock"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="isLoading"
            size="large"
            style="width: 100%;"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div v-if="errorMessage" class="error-message">
        <el-alert :title="errorMessage" type="error" show-icon :closable="false" />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.admin-login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #020617;
  background-image: radial-gradient(circle at center, #1e293b 0%, #020617 70%);
}
.login-card {
  width: 400px;
  background-color: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.2);
  backdrop-filter: blur(10px);
}
.card-header {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: #e2e8f0;
}
.error-message {
  margin-top: 1rem;
}
</style>
