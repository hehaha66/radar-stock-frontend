<!-- 文件: src/views/SuperManagerView.vue (最终完整版) -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
// 【修正】service 导入路径
import service from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'
// 【修正】UserInfo 类型导入路径
import type { UserInfo } from '@/types/user'
import { ArrowDown } from '@element-plus/icons-vue'

// --- 状态变量 ---
const userList = ref<UserInfo[]>([])
const totalUsers = ref(0)
const loading = ref(true)
const searchQuery = ref('')
const dialogVisible = ref(false)
const dialogMode = ref<'authorize'>('authorize')
const currentEditingUser = ref<UserInfo | null>(null)

const form = ref({
  plan: 'pro',
  duration: 'monthly',
})

// --- 计算属性 ---
const filteredUsers = computed(() => {
  if (!searchQuery.value) {
    return userList.value
  }
  const search = searchQuery.value.toLowerCase()
  return userList.value.filter(user =>
    user.email.toLowerCase().includes(search) ||
    (user.nickname && user.nickname.toLowerCase().includes(search)) ||
    user.id.toString().includes(search)
  )
})

// --- API 调用函数 (已与最新的 request.ts 匹配) ---
const fetchUsers = async () => {
  loading.value = true
  try {
    // service.get 现在返回 { code, msg, data }
    const response = await service.get('/admin/users')
    const responseData = response.data // responseData 是 { users, total }

    if (responseData && Array.isArray(responseData.users)) {
      // 使用 is_superuser 过滤管理员
      userList.value = responseData.users.filter((u: UserInfo) => !u.is_superuser);
      totalUsers.value = userList.value.length;
    } else {
      userList.value = []
      totalUsers.value = 0
    }
  } catch (error) {
    // 错误消息已由拦截器处理
  } finally {
    loading.value = false
  }
}

const handleAuthorize = async () => {
  if (!currentEditingUser.value) return
  try {
    // service.post 现在返回 { code, msg, data }
    const response = await service.post(
      `/admin/users/${currentEditingUser.value.id}/authorize`,
      {
        email: currentEditingUser.value.email,
        plan: form.value.plan,
        duration: form.value.duration
      }
    )
    updateUserInList(response.data)
    ElMessage.success(response.msg || '授权成功！')
    dialogVisible.value = false
  } catch (error) {
    // 拦截器已处理
  }
}

const toggleUserStatus = async (user: UserInfo) => {
    try {
        const newStatus = !user.is_active;
        // service.put 现在返回 { code, msg, data }
        const response = await service.put(
            `/admin/users/${user.id}/status`,
            { is_active: newStatus }
        );
        updateUserInList(response.data);
        ElMessage.success(response.msg || `用户状态已更新为: ${newStatus ? '激活' : '封禁'}`);
    } catch (error) {
        // 拦截器已处理
    }
}

const confirmDeleteUser = (user: UserInfo) => {
    ElMessageBox.prompt(`这是一个危险操作！请输入用户邮箱 "${user.email}" 以确认删除。`, '确认删除', {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        inputPattern: new RegExp(`^${user.email}$`),
        inputErrorMessage: '输入的邮箱不匹配',
    }).then(async () => {
        try {
            // service.delete 现在返回 { code, msg, data }
            const response = await service.delete(`/admin/users/${user.id}`);
            userList.value = userList.value.filter(u => u.id !== user.id);
            ElMessage.success(response.msg || `用户 ${user.email} 已被删除。`);
        } catch (error) {
            // 拦截器已处理
        }
    }).catch(() => {
        ElMessage.info('已取消删除操作');
    });
}


// --- 辅助函数 ---
const openDialog = (mode: 'authorize', user: UserInfo) => {
  dialogMode.value = mode
  currentEditingUser.value = user
  form.value = {
    plan: 'pro',
    duration: 'monthly',
  }
  dialogVisible.value = true
}

const updateUserInList = (updatedUser: UserInfo) => {
    const index = userList.value.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
        userList.value[index] = updatedUser;
    }
}

const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
}

// --- 生命周期钩子 ---
onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="manager-container">
    <h1 class="page-title">管理员主页</h1>

    <el-card shadow="never" class="main-card">
      <div class="toolbar">
        <el-input v-model="searchQuery" placeholder="按ID、邮箱或昵称搜索" clearable style="width: 300px;"/>
        <el-button type="primary" @click="fetchUsers" :loading="loading">刷新列表</el-button>
      </div>

      <el-table :data="filteredUsers" v-loading="loading" style="width: 100%" stripe border>
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="email" label="邮箱" sortable min-width="200" />
        <el-table-column prop="nickname" label="昵称" sortable min-width="150" />
        <el-table-column prop="plan" label="套餐" width="120" sortable />
        <el-table-column label="套餐到期时间" width="180" sortable>
          <template #default="scope">{{ formatDate(scope.row.expires_at) }}</template>
        </el-table-column>
        <el-table-column label="账户状态" width="120" align="center">
            <template #default="scope">
                <el-tag :type="scope.row.is_active ? 'success' : 'danger'">{{ scope.row.is_active ? '正常' : '封禁' }}</el-tag>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="scope">
            <el-button size="small" @click="openDialog('authorize', scope.row)">授权</el-button>
            <el-dropdown style="margin-left: 10px;">
                <el-button size="small" type="warning">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item @click="toggleUserStatus(scope.row)">{{ scope.row.is_active ? '封禁账户' : '解封账户' }}</el-dropdown-item>
                        <el-dropdown-item divided @click="confirmDeleteUser(scope.row)" style="color: #F56C6C;">删除用户</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="套餐授权" width="500px">
        <template v-if="currentEditingUser">
            <p style="margin-bottom: 20px;"><strong>正在操作用户:</strong> {{ currentEditingUser.email }}</p>

            <el-form v-if="dialogMode === 'authorize'" :model="form" label-width="80px">
                <el-form-item label="选择套餐">
                    <el-select v-model="form.plan" placeholder="请选择套餐">
                        <el-option label="专业版 (Pro)" value="pro"></el-option>
                        <el-option label="大师版 (Master)" value="master"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="选择时长">
                     <el-select v-model="form.duration" placeholder="请选择时长">
                        <el-option label="月度 (30天)" value="monthly"></el-option>
                        <el-option label="年度 (365天)" value="yearly"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>

        </template>
        <template #footer>
            <el-button @click="dialogVisible = false">取 消</el-button>
            <el-button v-if="dialogMode === 'authorize'" type="primary" @click="handleAuthorize">确 定 授 权</el-button>
        </template>
    </el-dialog>

  </div>
</template>

<style scoped>
.manager-container {
    padding: 2rem;
    background-color: #0f172a; /* 暗色背景 */
    min-height: calc(100vh - 50px); /* 适应屏幕高度 */
}
.page-title {
    color: #e2e8f0;
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
}
.main-card {
    background-color: #1e293b; /* 卡片背景色 */
    border: none;
}
.toolbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}
</style>
