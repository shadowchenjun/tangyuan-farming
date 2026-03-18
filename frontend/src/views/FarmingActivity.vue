<template>
  <div class="farming-activity">
    <!-- 顶部Banner -->
    <div class="banner">
      <el-carousel height="200px" :autoplay="true" :interval="3000">
        <el-carousel-item v-for="i in 3" :key="i">
          <div class="banner-item">
            <img :src="`https://picsum.photos/800/400?random=${i}`" alt="banner" />
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>
    
    <!-- 活动介绍 -->
    <div class="section">
      <h2 class="section-title">活动介绍</h2>
      <div class="intro-content">
        <p>我在汤原有分田</p>
        <p>汤原农文旅云认养平台为用户提供云认养服务，通过数字田地凭证，让你在家就能体验农田认养的乐趣。</p>
        <p>认养成功后，你将获得：</p>
        <ul>
          <li>专属数字田地凭证</li>
          <li>实时查看田地物联网数据</li>
          <li>农产品溯源信息</li>
          <li>线下权益与实物奖品</li>
        </ul>
      </div>
    </div>
    
    <!-- 权益说明 -->
    <div class="section">
      <h2 class="section-title">参与云认养可获得权益</h2>
      <div class="rights-grid">
        <div class="right-item">
          <div class="right-icon">🌾</div>
          <div class="right-title">数字田地凭证</div>
          <div class="right-desc">获得专属云认养凭证</div>
        </div>
        <div class="right-item">
          <div class="right-icon">📷</div>
          <div class="right-title">实时监控</div>
          <div class="right-desc">物联网数据实时查看</div>
        </div>
        <div class="right-item">
          <div class="right-icon">🔍</div>
          <div class="right-title">溯源查询</div>
          <div class="right-desc">全程溯源吃得放心</div>
        </div>
        <div class="right-item">
          <div class="right-icon">🎁</div>
          <div class="right-title">专属权益</div>
          <div class="right-desc">线下权益与实物奖品</div>
        </div>
      </div>
    </div>
    
    <!-- 底部按钮 -->
    <div class="bottom-bar">
      <el-button type="primary" size="large" class="adopt-btn" @click="goVerify">
        立即认养
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goVerify = () => {
  router.push('/verify')
}
</script>

<style scoped>
.farming-activity {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

.banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section {
  padding: 20px;
  background: white;
  margin-bottom: 10px;
}

.section-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 4px solid #667eea;
}

.intro-content {
  color: #666;
  line-height: 1.8;
}

.intro-content ul {
  margin-top: 12px;
  padding-left: 20px;
}

.intro-content li {
  margin: 8px 0;
}

.rights-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.right-item {
  text-align: center;
  padding: 20px;
  background: #f8f9ff;
  border-radius: 12px;
}

.right-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.right-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.right-desc {
  font-size: 12px;
  color: #999;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.adopt-btn {
  width: 100%;
  height: 48px;
  font-size: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}
</style>
