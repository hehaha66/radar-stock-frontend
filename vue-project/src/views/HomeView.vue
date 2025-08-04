<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

function navigateTo(path: string) {
  if (userStore.isLoggedIn) {
    router.push(path);
  } else {
    router.push('/login');
  }
}
</script>

<template>
  <div class="home-view">
    <main class="main-content">
      <div class="hero-wrapper">
        <div class="radar-container">
          <div class="radar-beam"></div>
          <div class="radar-grid radar-grid-1"></div>
          <div class="radar-grid radar-grid-2"></div>
          <div class="radar-grid radar-grid-3"></div>
        </div>
        
        <div class="hero-text">
          <h1 class="slogan">洞悉毫秒间的市场脉搏</h1>
          <p class="description">
            自定义指标 · 跨市场覆盖 · 毫秒级监控
          </p>
        </div>
      </div>
      
      <div class="features-wrapper">
        <div class="feature-module" @click="navigateTo('/monitor')">
          <div class="module-icon">
            <svg viewBox="0 0 24 24"><path d="M3,3V12A9,9 0 0,0 12,21A9,9 0 0,0 21,12V3H3M19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12V5H19V12Z" /></svg>
          </div>
          <div class="module-text">
            <h3>实时监控</h3>
            <p>进入您的专业交易室</p>
          </div>
        </div>
        <div class="feature-module" @click="navigateTo('/history')">
          <div class="module-icon">
            <svg viewBox="0 0 24 24"><path d="M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z" /></svg>
          </div>
          <div class="module-text">
            <h3>策略回测</h3>
            <p>用历史数据验证策略</p>
          </div>
        </div>
        <div class="feature-module" @click="navigateTo('/api-docs')">
          <div class="module-icon">
            <svg viewBox="0 0 24 24"><path d="M4,6H2V20A2,2 0 0,0 4,22H18V20H4V6M20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M20,16H8V4H20" /></svg>
          </div>
          <div class="module-text">
            <h3>开发者 API</h3>
            <p>赋能您的量化交易</p>
          </div>
        </div>
        <div class="feature-module" @click="navigateTo('/ai-stock')">
          <div class="module-icon">
            <svg viewBox="0 0 24 24"><path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" /></svg>
          </div>
          <div class="module-text">
            <h3>AI选股</h3>
            <p>基于AI的智能选股</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-view {
  width: 100%;
  height: calc(100vh - 80px); /* Adjust based on collapsed header height */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0f172a;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Hero Section */
.hero-wrapper {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 4rem;
}

.radar-container {
  position: relative;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.radar-grid {
  position: absolute;
  border-radius: 50%;
  border: 1px dashed rgba(56, 189, 248, 0.2);
}
.radar-grid-1 { width: 50%; height: 50%; }
.radar-grid-2 { width: 100%; height: 100%; }
.radar-grid-3 { width: 150%; height: 150%; }

.radar-beam {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(0deg, transparent 50%, rgba(56, 189, 248, 0.5) 100%);
  border-radius: 50%;
  animation: rotate 4s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.hero-text {
  margin-top: 2rem;
  text-align: center;
}

.slogan {
  font-size: 2.5rem;
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
  margin-bottom: 0.75rem;
}

.description {
  font-size: 1.1rem;
  color: #94a3b8;
  white-space: nowrap;
}

/* Features Section */
.features-wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  width: 100%;
}

.feature-module {
  background: rgba(30, 41, 59, 0.7);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
  border: 1px solid rgba(56, 189, 248, 0.1);
  cursor: pointer;
  text-align: center;
}

.feature-module:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  border-color: rgba(56, 189, 248, 0.3);
}

.module-icon {
  margin-bottom: 1.5rem;
}
.module-icon svg {
  width: 48px;
  height: 48px;
  fill: #38bdf8;
}

.module-text h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.75rem;
}
.module-text p {
  font-size: 0.9rem;
  color: #94a3b8;
}
</style>
