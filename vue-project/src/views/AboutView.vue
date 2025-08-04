<template>
  <div class="about-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>关于雷达股眼</h1>
      <p>专业的金融科技平台，致力于为投资者提供最先进的股票监控和交易工具</p>
    </div>

    <!-- 公司介绍 -->
    <section class="company-intro">
      <div class="content-wrapper">
        <div class="intro-text">
          <h2>我们的使命</h2>
          <p>
            雷达股眼 (LDSTOCK) 成立于2024年，是一家专注于金融科技创新的企业。
            我们致力于通过先进的技术手段，为投资者提供专业、高效、安全的股票监控和交易平台。
          </p>
          <p>
            在当今快速变化的金融市场中，信息就是力量。我们相信，通过毫秒级的数据处理、
            智能化的分析工具和用户友好的界面，可以帮助每一位投资者做出更明智的投资决策。
          </p>
        </div>
        <div class="intro-stats">
          <div class="stat-item">
            <div class="stat-number">10万+</div>
            <div class="stat-label">注册用户</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">5000+</div>
            <div class="stat-label">股票代码</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">99.9%</div>
            <div class="stat-label">系统可用性</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">50ms</div>
            <div class="stat-label">数据延迟</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 核心优势 -->
    <section class="advantages">
      <h2>核心优势</h2>
      <div class="advantages-grid">
        <div class="advantage-card">
          <div class="advantage-icon">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <h3>实时数据</h3>
          <p>毫秒级数据更新，覆盖A股、港股、美股等多个市场，确保您获得最新的市场信息。</p>
        </div>
        <div class="advantage-card">
          <div class="advantage-icon">
            <el-icon><Setting /></el-icon>
          </div>
          <h3>自定义指标</h3>
          <p>支持自定义技术指标和策略，让您可以根据自己的交易理念构建专属的分析工具。</p>
        </div>
        <div class="advantage-card">
          <div class="advantage-icon">
            <el-icon><Monitor /></el-icon>
          </div>
          <h3>智能监控</h3>
          <p>智能告警系统，当市场出现重要变化时及时通知您，不错过任何投资机会。</p>
        </div>
        <div class="advantage-card">
          <div class="advantage-icon">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <h3>模拟交易</h3>
          <p>零风险模拟交易环境，让您可以在真实市场数据基础上练习交易策略。</p>
        </div>
        <div class="advantage-card">
          <div class="advantage-icon">
            <el-icon><Connection /></el-icon>
          </div>
          <h3>API接口</h3>
          <p>稳定的API接口，支持量化交易和第三方应用集成，满足专业用户需求。</p>
        </div>
        <div class="advantage-card">
          <div class="advantage-icon">
            <el-icon><Lock /></el-icon>
          </div>
          <h3>安全保障</h3>
          <p>银行级安全标准，多重加密保护，确保您的账户和交易信息安全。</p>
        </div>
      </div>
    </section>

    <!-- 技术架构 -->
    <section class="tech-architecture">
      <h2>技术架构</h2>
      <div class="tech-content">
        <div class="tech-diagram">
          <div class="tech-layer">
            <h4>前端层</h4>
            <div class="tech-items">
              <span class="tech-item">Vue 3</span>
              <span class="tech-item">TypeScript</span>
              <span class="tech-item">Element Plus</span>
            </div>
          </div>
          <div class="tech-layer">
            <h4>后端层</h4>
            <div class="tech-items">
              <span class="tech-item">FastAPI</span>
              <span class="tech-item">Python</span>
              <span class="tech-item">SQLAlchemy</span>
            </div>
          </div>
          <div class="tech-layer">
            <h4>数据层</h4>
            <div class="tech-items">
              <span class="tech-item">实时数据源</span>
              <span class="tech-item">Redis缓存</span>
              <span class="tech-item">SQLite</span>
            </div>
          </div>
        </div>
        <div class="tech-features">
          <h3>技术特色</h3>
          <ul>
            <li><strong>微服务架构：</strong>模块化设计，易于扩展和维护</li>
            <li><strong>实时数据流：</strong>Server-Sent Events技术，低延迟数据推送</li>
            <li><strong>响应式设计：</strong>支持多设备访问，移动端友好</li>
            <li><strong>高可用性：</strong>99.9%的系统可用性保证</li>
            <li><strong>安全认证：</strong>JWT + 静态Token双重认证机制</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 团队介绍 -->
    <section class="team">
      <h2>核心团队</h2>
      <div class="team-grid">
        <div class="team-member">
          <div class="member-avatar">
            <img src="https://placehold.co/150x150/0f172a/38bdf8?text=CEO" alt="CEO">
          </div>
          <h3>张明</h3>
          <p class="member-title">创始人 & CEO</p>
          <p class="member-desc">前某知名券商技术总监，15年金融科技经验，专注于量化交易和风险管理。</p>
        </div>
        <div class="team-member">
          <div class="member-avatar">
            <img src="https://placehold.co/150x150/0f172a/eab308?text=CTO" alt="CTO">
          </div>
          <h3>李强</h3>
          <p class="member-title">首席技术官</p>
          <p class="member-desc">资深全栈工程师，擅长高并发系统设计和实时数据处理技术。</p>
        </div>
        <div class="team-member">
          <div class="member-avatar">
            <img src="https://placehold.co/150x150/0f172a/22c55e?text=CPO" alt="CPO">
          </div>
          <h3>王芳</h3>
          <p class="member-title">产品总监</p>
          <p class="member-desc">10年产品设计经验，专注于用户体验和产品创新，深谙投资者需求。</p>
        </div>
      </div>
    </section>

    <!-- 联系我们 -->
    <section class="contact">
      <h2>联系我们</h2>
      <div class="contact-content">
        <div class="contact-info">
          <div class="contact-item">
            <el-icon><Message /></el-icon>
            <div>
              <h4>邮箱</h4>
              <p>support@ldstock.com</p>
            </div>
          </div>
          <div class="contact-item">
            <el-icon><Phone /></el-icon>
            <div>
              <h4>电话</h4>
              <p>400-888-8888</p>
            </div>
          </div>
          <div class="contact-item">
            <el-icon><Location /></el-icon>
            <div>
              <h4>地址</h4>
              <p>北京市朝阳区金融街88号</p>
            </div>
          </div>
          <div class="contact-item">
            <el-icon><Clock /></el-icon>
            <div>
              <h4>工作时间</h4>
              <p>周一至周五 9:00-18:00</p>
            </div>
          </div>
        </div>
        <div class="contact-form">
          <h3>留言咨询</h3>
          <el-form :model="contactForm" label-width="80px">
            <el-form-item label="姓名">
              <el-input v-model="contactForm.name" placeholder="请输入您的姓名" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="contactForm.email" placeholder="请输入您的邮箱" />
            </el-form-item>
            <el-form-item label="主题">
              <el-input v-model="contactForm.subject" placeholder="请输入咨询主题" />
            </el-form-item>
            <el-form-item label="留言">
              <el-input
                v-model="contactForm.message"
                type="textarea"
                :rows="4"
                placeholder="请输入您的留言内容"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitContact">提交留言</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  Setting,
  Monitor,
  TrendCharts,
  Connection,
  Lock,
  Message,
  Phone,
  Location,
  Clock
} from '@element-plus/icons-vue'

const contactForm = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

function submitContact() {
  if (!contactForm.value.name || !contactForm.value.email || !contactForm.value.message) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  ElMessage.success('留言提交成功，我们会尽快回复您')
  contactForm.value = {
    name: '',
    email: '',
    subject: '',
    message: ''
  }
}
</script>

<style scoped>
.about-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 4rem;
}

.page-header h1 {
  font-size: 3rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 1rem;
}

.page-header p {
  font-size: 1.125rem;
  color: #94a3b8;
  max-width: 600px;
  margin: 0 auto;
}

/* 公司介绍 */
.company-intro {
  margin-bottom: 4rem;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 4rem;
  align-items: center;
}

.intro-text h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1.5rem;
}

.intro-text p {
  font-size: 1.125rem;
  color: #94a3b8;
  line-height: 1.8;
  margin-bottom: 1rem;
}

.intro-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: #38bdf8;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #94a3b8;
}

/* 核心优势 */
.advantages {
  margin-bottom: 4rem;
}

.advantages h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 3rem;
}

.advantages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.advantage-card {
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  text-align: center;
  transition: transform 0.3s ease;
}

.advantage-card:hover {
  transform: translateY(-5px);
}

.advantage-icon {
  font-size: 3rem;
  color: #38bdf8;
  margin-bottom: 1rem;
}

.advantage-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 1rem;
}

.advantage-card p {
  color: #94a3b8;
  line-height: 1.6;
}

/* 技术架构 */
.tech-architecture {
  margin-bottom: 4rem;
}

.tech-architecture h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 3rem;
}

.tech-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;
}

.tech-diagram {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.tech-layer {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.tech-layer h4 {
  color: #38bdf8;
  margin-bottom: 1rem;
  font-size: 1.125rem;
}

.tech-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tech-item {
  padding: 0.5rem 1rem;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 20px;
  color: #38bdf8;
  font-size: 0.875rem;
}

.tech-features h3 {
  color: #fff;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.tech-features ul {
  list-style: none;
  padding: 0;
}

.tech-features li {
  color: #94a3b8;
  margin-bottom: 1rem;
  padding-left: 1.5rem;
  position: relative;
}

.tech-features li::before {
  content: "•";
  color: #38bdf8;
  position: absolute;
  left: 0;
  font-weight: bold;
}

/* 团队介绍 */
.team {
  margin-bottom: 4rem;
}

.team h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 3rem;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.team-member {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.member-avatar {
  margin-bottom: 1.5rem;
}

.member-avatar img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 3px solid #38bdf8;
}

.team-member h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.5rem;
}

.member-title {
  color: #38bdf8;
  font-weight: 500;
  margin-bottom: 1rem;
}

.member-desc {
  color: #94a3b8;
  line-height: 1.6;
}

/* 联系我们 */
.contact {
  margin-bottom: 4rem;
}

.contact h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 3rem;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.contact-item .el-icon {
  font-size: 1.5rem;
  color: #38bdf8;
}

.contact-item h4 {
  color: #fff;
  margin-bottom: 0.25rem;
}

.contact-item p {
  color: #94a3b8;
  margin: 0;
}

.contact-form h3 {
  color: #fff;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-wrapper,
  .tech-content,
  .contact-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .advantages-grid {
    grid-template-columns: 1fr;
  }
  
  .team-grid {
    grid-template-columns: 1fr;
  }
  
  .intro-stats {
    grid-template-columns: 1fr;
  }
}
</style>
