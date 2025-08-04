<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import type { UserInfo } from '@/stores/user';
import service from '@/api/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  CopyDocument, User as UserIcon, PriceTag, Setting, Lock, Phone, DataBoard, Promotion, Check, View, Timer, Platform, MagicStick, Grid, Bell
} from '@element-plus/icons-vue';

const userStore = useUserStore();
const activeTab = ref('dashboard');

// --- 状态变量 ---
interface PlanConfig {
  [key: string]: any;
}
const plansConfig = ref<PlanConfig>({});
interface PricingConfig {
  [key: string]: {
    monthly: { price: number; daily_price: string; };
    yearly: { price: number; };
  };
}
const localPricing: PricingConfig = {
  pro: { monthly: { price: 28, daily_price: '0.9' }, yearly: { price: 268 } },
  master: { monthly: { price: 588, daily_price: '19.6' }, yearly: { price: 5888 } }
};
const profileForm = ref({ nickname: '', real_name: '', id_card_number: '' });
const phoneForm = ref({ phone_number: '', code: '' });
const passwordForm = ref({ current_password: '', new_password: '', confirm_password: '' });
const isCodeSending = ref(false);
const countdown = ref(0);



// 用户统计数据
const userStats = ref({
  totalTrades: 156,
  winRate: 68.5,
  avgReturn: 12.3,
  totalProfit: 15680,
  ranking: 1250,
  level: '金牌交易员',
  achievements: [
    { id: 1, name: '首次交易', description: '完成第一笔交易', unlocked: true },
    { id: 2, name: '盈利达人', description: '连续盈利10天', unlocked: true },
    { id: 3, name: '风险控制', description: '单日亏损不超过5%', unlocked: false },
    { id: 4, name: '交易大师', description: '完成1000笔交易', unlocked: false }
  ]
});

// --- 计算属性 ---
const user = computed(() => userStore.userInfo);

const daysRemaining = computed(() => {
  if (user.value?.expires_at) {
    const expiryDate = new Date(user.value.expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    if (diffTime < 0) return '已过期';
    return `${Math.ceil(diffTime / (1000 * 60 * 60 * 24))} 天`;
  }
  return '无限期';
});

const plansList = computed(() => {
  return Object.entries(plansConfig.value)
    .map(([name, details]) => ({ name, details }))
});

// --- API 调用与方法 (无修改) ---
const fetchPlans = async () => { try { plansConfig.value = await service.get('/subscription/plans'); } catch (error) { console.error('获取套餐信息失败:', error); } };
const copyApiToken = () => { 
  const token = userStore.token;
  if (token) { 
    navigator.clipboard.writeText(token); 
    ElMessage.success('API Token 已复制到剪贴板'); 
  } else {
    ElMessage.error('无法获取API Token');
  }
};
const resetApiToken = async () => { 
  try { 
    await ElMessageBox.confirm('您确定要重置 API Token 吗？旧的 Token 将立即失效。', '确认操作', { type: 'warning' }); 
    const updatedUserInfo: any = await service.post('/auth/me/reset-api-token'); 
    userStore.setUserInfo(updatedUserInfo); 
    // 更新本地存储的token
    if (updatedUserInfo.token) {
      localStorage.setItem('accessToken', updatedUserInfo.token);
      userStore.accessToken = updatedUserInfo.token;
    }
    ElMessage.success('API Token 重置成功！'); 
  } catch (error) { 
    if (error !== 'cancel') ElMessage.error('API Token 重置失败'); 
  } 
};
const updateProfile = async () => { 
  if (!user.value) return; 
  try { 
    const payload: Partial<UserInfo> = {}; 
    if (profileForm.value.nickname !== user.value.nickname) { 
      payload.nickname = profileForm.value.nickname; 
    } 
    if (profileForm.value.real_name !== user.value.real_name) { 
      payload.real_name = profileForm.value.real_name; 
    } 
    if (profileForm.value.id_card_number !== user.value.id_card_number) { 
      payload.id_card_number = profileForm.value.id_card_number; 
    } 
    if (Object.keys(payload).length === 0) { 
      ElMessage.info('没有需要更新的信息。'); 
      return; 
    } 
    const response: any = await service.put('/auth/me/profile', payload); 
    userStore.setUserInfo(response); 
    ElMessage.success('个人资料更新成功！'); 
  } catch (error: any) { 
    ElMessage.error(error.response?.data?.detail || '更新失败'); 
  } 
};
const sendPhoneCode = () => { 
  if (!/1[3-9]\d{9}/.test(phoneForm.value.phone_number)) { 
    ElMessage.error('请输入有效的手机号码'); 
    return; 
  } 
  isCodeSending.value = true; 
  countdown.value = 60; 
  ElMessage.success('验证码已发送 (模拟: 000000)'); 
  const timer = setInterval(() => { 
    countdown.value--; 
    if (countdown.value <= 0) { 
      clearInterval(timer); 
      isCodeSending.value = false; 
    } 
  }, 1000); 
}
const bindPhoneNumber = async () => { 
  if (phoneForm.value.code !== '000000') { 
    ElMessage.error('验证码不正确 (模拟验证码为 000000)'); 
    return; 
  } 
  try { 
    const response: any = await service.put('/auth/me/profile', { 
      phone_number: phoneForm.value.phone_number 
    }); 
    userStore.setUserInfo(response); 
    ElMessage.success('手机号绑定成功！'); 
  } catch (error: any) { 
    ElMessage.error(error.response?.data?.detail || '绑定失败'); 
  } 
}
const changePassword = async () => { 
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) { 
    ElMessage.error('新密码和确认密码不一致'); 
    return; 
  } 
  try { 
    const response: any = await service.put('/auth/me/password', { 
      current_password: passwordForm.value.current_password, 
      new_password: passwordForm.value.new_password, 
    }); 
    ElMessage.success(response.message + ' 请重新登录。'); 
    setTimeout(() => { 
      userStore.logout(); 
      window.location.href = '/login'; 
    }, 2000); 
  } catch (error) { 
    /* Interceptor handles message */ 
  } 
};
const handleUpgrade = async (plan: string, duration: string) => { 
  ElMessage.info(`正在跳转到支付页面以购买 ${plan} (${duration})... (模拟)`); 
  try { 
    const response: any = await service.post('/subscription/upgrade', { 
      plan, 
      duration 
    }); 
    userStore.setUserInfo(response); 
    ElMessage.success("套餐升级成功！"); 
  } catch (error) { 
    /* Interceptor handles message */ 
  } 
}


onMounted(() => {
  fetchPlans();
  if (user.value) {
    profileForm.value.nickname = user.value.nickname || '';
    profileForm.value.real_name = user.value.real_name || '';
    profileForm.value.id_card_number = user.value.id_card_number || '';
    phoneForm.value.phone_number = user.value.phone_number || '';
  }
});

watch(user, (newUser) => {
    if (newUser) {
        profileForm.value.nickname = newUser.nickname || '';
        profileForm.value.real_name = newUser.real_name || '';
        profileForm.value.id_card_number = newUser.id_card_number || '';
        phoneForm.value.phone_number = newUser.phone_number || '';
    }
}, { deep: true });



</script>

<template>
  <div class="user-center-container" v-if="user">
    <el-row :gutter="24">
      <!-- 左侧导航菜单 -->
      <el-col :span="6">
        <div class="user-sidebar">
            <div class="user-avatar">
                <el-avatar :size="80">{{ user.nickname?.[0] || user.email[0] }}</el-avatar>
                <h3 class="user-nickname">{{ user.nickname || user.email }}</h3>
                <p class="user-email">{{ user.email }}</p>
            </div>
            <el-menu :default-active="activeTab" class="user-menu" @select="(index: string) => activeTab = index">
            <el-menu-item index="dashboard">
                <el-icon><DataBoard /></el-icon>
                <span>仪表盘</span>
            </el-menu-item>
            <el-menu-item index="plans">
                <el-icon><Promotion /></el-icon>
                <span>套餐与充值</span>
            </el-menu-item>
            <el-menu-item index="profile">
                <el-icon><UserIcon /></el-icon>
                <span>个人信息</span>
            </el-menu-item>
           <el-menu-item index="security">
            <el-icon><Setting /></el-icon>
            <span>账户安全</span>
          </el-menu-item>
        </el-menu>
        </div>
      </el-col>

      <!-- 右侧内容区 -->
      <el-col :span="18">
        <transition name="fade-up" mode="out-in">
          <div :key="activeTab">
            <!-- 仪表盘 -->
            <div v-if="activeTab === 'dashboard'">
              <el-row :gutter="20">
                  <el-col :span="16">
                      <el-card shadow="never" class="content-card">
                          <template #header><h3>我的套餐信息</h3></template>
                          <div class="dashboard-item">
                              <span>当前套餐:</span>
                              <el-tag type="success" size="large" effect="dark">{{ user.plan?.toUpperCase() }}</el-tag>
                          </div>
                          <div class="dashboard-item">
                              <span>到期时间:</span>
                              <strong>{{ user.expires_at ? new Date(user.expires_at).toLocaleDateString() : 'N/A' }} ({{ daysRemaining }})</strong>
                          </div>
                          <div class="dashboard-item">
                              <span>模拟积分:</span>
                              <strong>{{ user.total_points?.toLocaleString() }}</strong>
                          </div>
                          <el-divider />
                          <h4>权限概览</h4>
                          <div class="permissions-grid">
                              <div><el-icon><View /></el-icon> 可监控股票数: <strong>{{ user.max_codes === -1 ? '无限制' : user.max_codes }}</strong></div>
                              <div><el-icon><Timer /></el-icon> 最低刷新频率: <strong>{{ user.min_interval }} 秒</strong></div>
                              <div><el-icon><Platform /></el-icon> 最大并发连接: <strong>{{ user.max_connections === -1 ? '无限制' : user.max_connections }}</strong></div>
                              <div><el-icon><MagicStick /></el-icon> 自定义指标数: <strong>{{ user.max_custom_indicators === -1 ? '无限制' : user.max_custom_indicators }}</strong></div>
                              <div><el-icon><Grid /></el-icon> 股票分组数: <strong>{{ user.max_stock_groups === -1 ? '无限制' : user.max_stock_groups }}</strong></div>
                              <div><el-icon><Bell /></el-icon> 预警总数: <strong>{{ user.max_alerts === -1 ? '无限制' : user.max_alerts }}</strong></div>
                          </div>
                      </el-card>
                  </el-col>
                  <el-col :span="8">
                      <el-card shadow="never" class="content-card">
                      <template #header><h3>API Token</h3></template>
                      <p class="api-token-info">您的静态 API Token 用于外部程序调用。</p>
                      <el-input :model-value="user.token" readonly>
                          <template #append>
                          <el-button :icon="CopyDocument" @click="copyApiToken" />
                          </template>
                      </el-input>
                      <el-button type="danger" plain @click="resetApiToken" style="width: 100%; margin-top: 15px;">
                          重置 Token
                      </el-button>
                      </el-card>
                  </el-col>

              </el-row>
            </div>
            <!-- 套餐与充值 -->
            <div v-if="activeTab === 'plans'">
                <el-card shadow="never" class="content-card">
                  <template #header><h3>选择适合您的套餐计划</h3></template>
                                    <div class="plans-wrapper">
                    <template v-for="p in plansList" :key="p.name">
                      <el-card
                        v-if="p.name !== 'admin'"
                        shadow="hover"
                        class="plan-card"
                        :class="{'current-plan': user.plan === p.name, 'recommended-plan': p.name === 'pro'}"
                      >
                        <div class="plan-header">
                          <span class="plan-name">{{ p.name.toUpperCase() }}</span>
                          <el-tag v-if="user.plan === p.name" type="success" effect="dark" size="small" class="current-plan-tag">当前套餐</el-tag>
                        </div>

                        <div class="plan-pricing" v-if="localPricing[p.name]">
                          <div>
                            <span class="price-amount">¥<strong>{{ localPricing[p.name].monthly.price }}</strong></span>
                            <span class="price-period">/月</span>
                          </div>
                          <div class="daily-price">约 {{ localPricing[p.name].monthly.daily_price }} 元/天 年费再享八折优惠</div>
                        </div>

                        <ul class="plan-features">
                          <li><el-icon><DataBoard /></el-icon> <span><strong>{{ p.details.max_codes === -1 ? '无限制' : p.details.max_codes }}</strong> 支股票监控</span></li>
                          <li><el-icon><Timer /></el-icon> <span><strong>{{ p.details.min_interval }}</strong> 秒刷新频率</span></li>
                          <li><el-icon><Platform /></el-icon> <span><strong>{{ p.details.max_connections === -1 ? '无限制' : `${p.details.max_connections}个` }}</strong> 并发连接</span></li>
                          <li><el-icon><MagicStick /></el-icon> <span><strong>{{ p.details.max_custom_indicators === -1 ? '无限制' : `${p.details.max_custom_indicators}个` }}</strong> 自定义指标</span></li>
                          <li><el-icon><Promotion /></el-icon> <span>API 访问: <strong>{{ p.details.api_access_level !== 'none' ? '支持' : '不支持' }}</strong></span></li>
                        </ul>

                        <div class="plan-actions">
                          <div v-if="p.name === 'freemium'">
                            <el-button disabled size="large" class="action-button">基础套餐</el-button>
                          </div>
                          <div v-else-if="p.name === 'master'">
                              <el-button type="success" size="large" @click="ElMessage.info('请联系商务洽谈')" class="action-button contact-button">联系我们</el-button>
                          </div>
                          <div v-else class="subscription-buttons">
                            <el-button type="primary" plain @click="handleUpgrade(p.name, 'monthly')" size="large" class="action-button">按月订阅</el-button>
                            <div class="yearly-button-wrapper">
                              <el-button @click="handleUpgrade(p.name, 'yearly')" size="large" class="action-button">按年订阅</el-button>
                              <el-tag class="discount-tag" type="danger" effect="dark" size="small">8折优惠</el-tag>
                            </div>
                          </div>
                        </div>
                      </el-card>
                    </template>
                  </div>
                </el-card>
            </div>
            <!-- 个人信息 -->
            <div v-if="activeTab === 'profile'">
                <el-card shadow="never" class="content-card">
                    <template #header><h3>个人资料</h3></template>
                    <el-form :model="profileForm" label-position="top" style="max-width: 500px;" @submit.prevent="updateProfile">
                        <el-form-item label="邮箱">
                            <el-input :model-value="user.email" disabled />
                        </el-form-item>
                        <el-form-item label="昵称">
                            <el-input v-model="profileForm.nickname" />
                        </el-form-item>
                        <el-divider>实名信息 (可选)</el-divider>
                        <el-form-item label="真实姓名">
                            <el-input v-model="profileForm.real_name" placeholder="用于实名认证 (可选)" />
                        </el-form-item>
                        <el-form-item label="身份证号">
                            <el-input v-model="profileForm.id_card_number" placeholder="用于实名认证 (可选)" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" native-type="submit">保存资料</el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
            </div>
            <!-- 账户安全 -->
            <div v-if="activeTab === 'security'">
                <el-card shadow="never" class="content-card">
                    <template #header><h3>绑定手机</h3></template>
                    <el-form :model="phoneForm" label-position="top" style="max-width: 500px;" @submit.prevent="bindPhoneNumber">
                        <el-form-item label="手机号码">
                            <el-input v-model="phoneForm.phone_number" placeholder="请输入手机号">
                                <template #append>
                                    <el-button @click="sendPhoneCode" :disabled="isCodeSending">
                                        {{ isCodeSending ? `${countdown}秒后重发` : '发送验证码' }}
                                    </el-button>
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item label="验证码">
                            <el-input v-model="phoneForm.code" placeholder="输入6位验证码 (模拟: 000000)" />
                        </el-form-item>
                        <el-button type="primary" native-type="submit">确认绑定</el-button>
                    </el-form>
                </el-card>

                <el-card shadow="never" class="content-card" style="margin-top: 20px;">
                    <template #header><h3>修改密码</h3></template>
                    <el-form :model="passwordForm" label-position="top" style="max-width: 500px;" @submit.prevent="changePassword">
                        <el-form-item label="当前密码">
                            <el-input v-model="passwordForm.current_password" type="password" show-password />
                        </el-form-item>
                        <el-form-item label="新密码 (至少8位)">
                            <el-input v-model="passwordForm.new_password" type="password" show-password />
                        </el-form-item>
                        <el-form-item label="确认新密码">
                            <el-input v-model="passwordForm.confirm_password" type="password" show-password />
                        </el-form-item>
                        <el-button type="primary" native-type="submit">确认修改</el-button>
                    </el-form>
                </el-card>
            </div>
          </div>
        </transition>
      </el-col>
    </el-row>
  </div>
</template>


<style scoped>
/* 动画效果 */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.user-center-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}
.user-sidebar {
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.5));
    border: 1px solid rgba(51, 65, 85, 0.5);
    padding: 20px;
    border-radius: 12px;
    height: 100%;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
.user-avatar {
    text-align: center;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
    margin-bottom: 20px;
}
.user-nickname {
    margin-top: 15px;
    font-size: 1.25rem;
    font-weight: 600;
    color: #f1f5f9;
}
.user-email {
    font-size: 0.9rem;
    color: #94a3b8;
}
.user-menu {
  border-right: none;
  background-color: transparent;
}
.user-menu .el-menu-item {
  height: 50px;
  font-size: 1rem;
  border-radius: 6px;
  color: #94a3b8;
  margin-bottom: 5px;
}
.user-menu .el-menu-item:hover {
    background-color: rgba(51, 65, 85, 0.7);
    color: #f1f5f9;
}
.user-menu .el-menu-item.is-active {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.2), rgba(14, 165, 233, 0.05)) !important;
  color: #38bdf8;
  border-right: 3px solid #0ea5e9;
  font-weight: 600;
}
.content-card {
    background-color: rgba(30, 41, 59, 0.3);
    border: 1px solid rgba(51, 65, 85, 0.5);
    color: #cbd5e1;
}
.content-card :deep(.el-card__header) {
    font-size: 1.2rem;
    font-weight: 700;
    color: #f1f5f9;
    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
}
.dashboard-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 0;
    font-size: 1rem;
    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
}
.dashboard-item:last-child { border-bottom: none; }
.permissions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-top: 15px;
    color: #94a3b8;
}
.permissions-grid > div { display: flex; align-items: center; gap: 8px; }
.permissions-grid strong { color: #f1f5f9; }
.api-token-info { font-size: 14px; color: #94a3b8; margin-bottom: 10px; }
.plans-wrapper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.plan-card {
    transition: all 0.3s ease;
    height: 100%;
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(51, 65, 85, 0.5);
    display: flex;
    flex-direction: column;
}
.plan-card :deep(.el-card__body) {
    padding: 24px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}
.plan-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
.plan-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.plan-name {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f1f5f9;
}
.current-plan-tag {
    border-radius: 4px;
    font-weight: bold;
}
.plan-pricing {
    text-align: left;
    margin: 1rem 0 1.5rem 0;
    color: #f1f5f9;
}
.price-amount { font-size: 1.2rem; }
.price-amount strong { font-size: 2.2rem; font-weight: 800; color: #38bdf8; margin: 0 2px; }
.price-period { font-size: 1rem; color: #94a3b8; }
.daily-price { font-size: 0.9rem; color: #64748b; margin-top: 4px; }

.plan-features { list-style: none; padding: 0; margin: 0 0 1.5rem 0; color: #cbd5e1; flex-grow: 1; }
.plan-features li { display: flex; align-items: center; gap: 12px; padding: 10px 0; font-size: 1rem; }
.plan-features .el-icon { color: #38bdf8; font-size: 1.1rem; }
.plan-features strong { color: #f1f5f9; font-weight: 600; }

.plan-actions { margin-top: auto; }
.subscription-buttons { display: flex; gap: 10px; }
.action-button { width: 100%; }
.contact-button { background-color: #4ade80; border-color: #4ade80; color: #1e293b; }
.contact-button:hover { background-color: #6ee7b7; border-color: #6ee7b7; }

.yearly-button-wrapper { position: relative; flex: 1; }
.discount-tag { position: absolute; top: -10px; right: -10px; border: none; }
.current-plan {
    border: 2px solid #0ea5e9;
    box-shadow: 0 0 25px rgba(14, 165, 233, 0.3);
}
.recommended-plan {
    position: relative;
    overflow: hidden;
    border-color: #38bdf8;
}
.recommended-plan::after {
    content: '推荐';
    position: absolute;
    top: 7px;
    right: -28px;
    background: #38bdf8;
    color: #0f172a;
    padding: 4px 30px;
    font-size: 12px;
    font-weight: bold;
    transform: rotate(45deg);
    box-shadow: 0 0 10px rgba(56,189,248,0.5);
}



pre {
    background-color: #0f172a;
    border: 1px solid rgba(51, 65, 85, 0.5);
    padding: 15px;
    border-radius: 4px;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: "Courier New", Courier, monospace;
    min-height: 150px;
    color: #e2e8f0;
}
</style>
