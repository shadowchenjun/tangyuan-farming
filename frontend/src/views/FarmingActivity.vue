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

    <!-- 昵称设置（首次登录/未设置昵称） -->
    <div class="section nickname-section" v-if="!hasNickname">
      <h2 class="section-title">欢迎加入</h2>
      <div class="nickname-form">
        <p class="welcome-text">为了更好地为您提供服务，请设置您的昵称</p>
        <el-input
          v-model="nickname"
          placeholder="请输入昵称（2-10字符）"
          size="large"
          maxlength="10"
          show-word-limit
        />
        <el-button type="primary" size="large" class="save-nickname-btn" @click="saveNickname">
          保存昵称
        </el-button>
      </div>
    </div>

    <!-- 已设置昵称，显示欢迎信息 -->
    <div class="section welcome-section" v-else>
      <h2 class="section-title">欢迎你，{{ user?.nickname }}</h2>
    </div>

    <!-- 活动介绍 -->
    <div class="section">
      <h2 class="section-title">活动介绍</h2>
      <div class="intro-content">
        <div class="intro-hero">
          <span class="hero-icon">🌾</span>
          <span class="hero-text">我在汤原有分田</span>
        </div>
        <p class="intro-desc">汤原农文旅云认养平台为用户提供云认养服务，通过数字田地凭证，让你在家就能体验农田认养的乐趣。</p>
      </div>

      <!-- 活动详情 -->
      <div class="activity-details">
        <div class="detail-item">
          <div class="detail-icon">📍</div>
          <div class="detail-content">
            <h4>地理位置</h4>
            <p>黑龙江省汤原县优质的寒地黑土资源</p>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon">🌱</div>
          <div class="detail-content">
            <h4>种植品种</h4>
            <p>精选齐粳10号优质水稻</p>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon">📱</div>
          <div class="detail-content">
            <h4>实时监控</h4>
            <p>物联网设备全程监控生长过程</p>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon">🏆</div>
          <div class="detail-content">
            <h4>品质保证</h4>
            <p>区块链溯源，确保每一粒米的品质</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 权益说明 -->
    <div class="section">
      <h2 class="section-title">参与云认养可获得权益</h2>
      <div class="rights-grid">
        <div class="right-item">
          <div class="right-icon">📜</div>
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

    <!-- 认养产品 -->
    <div class="section adoption-section">
      <h2 class="section-title">选择认养方案</h2>
      <div class="adoption-cards">
        <div class="adoption-card" v-for="pkg in packages" :key="pkg.id" @click="selectPackage(pkg)">
          <div class="card-badge" v-if="pkg.popular">热门</div>
          <div class="card-content">
            <div class="pkg-name">{{ pkg.name }}</div>
            <div class="pkg-price">
              <span class="price">¥{{ pkg.price }}</span>
              <span class="unit">/{{ pkg.unit }}</span>
            </div>
            <div class="pkg-desc">{{ pkg.desc }}</div>
            <ul class="pkg-features">
              <li v-for="feature in pkg.features" :key="feature">{{ feature }}</li>
            </ul>
          </div>
          <el-button type="primary" class="adopt-now-btn">立即认养</el-button>
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
import { ref, computed, onMounted, triggerRef } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { updateUserInfo, getUserFarms, getUserInfo } from '../api'

const router = useRouter()

interface User {
  id: string
  phone: string
  nickname?: string
}

interface Farm {
  id: string
  land_no: string
}

const user = ref<User | null>(null)
const nickname = ref('')
const hasFarm = ref(false)

const hasNickname = computed(() => {
  return user.value?.nickname && user.value.nickname.trim() !== ''
})

const packages = [
  {
    id: 1,
    name: '体验版',
    price: 999,
    unit: '亩/年',
    desc: '适合初次体验',
    popular: false,
    features: ['1亩田地', '数字凭证', '基础溯源']
  },
  {
    id: 2,
    name: '标准版',
    price: 2999,
    unit: '亩/年',
    desc: '性价比之选',
    popular: true,
    features: ['3亩田地', '数字凭证', '全程溯源', '专属客服']
  },
  {
    id: 3,
    name: '尊享版',
    price: 8999,
    unit: '亩/年',
    desc: '高端定制',
    popular: false,
    features: ['10亩田地', '数字凭证', '全程溯源', '专属客服', '线下体验']
  }
]

onMounted(async () => {
  const userStr = localStorage.getItem('user')
  const token = localStorage.getItem('token')

  if (userStr && userStr !== 'undefined' && userStr !== 'null') {
    try {
      user.value = JSON.parse(userStr)
    } catch (e) {
      user.value = null
    }

    // 从 API 获取最新用户信息（包含昵称）
    if (token && user.value) {
      try {
        const userRes = await getUserInfo(user.value.id)
        if (userRes && userRes.nickname) {
          user.value = { ...user.value, ...userRes }
          localStorage.setItem('user', JSON.stringify(user.value))
        }
        nickname.value = user.value?.nickname || ''

        const res = await getUserFarms(user.value.id, token)
        hasFarm.value = res.farms && res.farms.length > 0
      } catch (e) {
        nickname.value = user.value?.nickname || ''
        hasFarm.value = false
      }
    } else {
      nickname.value = user.value?.nickname || ''
    }
  }
})

const saveNickname = async () => {
  if (!nickname.value || nickname.value.trim().length < 2) {
    ElMessage.warning('请输入2-10字符的昵称')
    return
  }

  try {
    const token = localStorage.getItem('token')
    if (!token || !user.value) {
      ElMessage.error('请先登录')
      router.push('/login')
      return
    }

    await updateUserInfo(user.value.id, { nickname: nickname.value }, token)

    // 更新本地存储
    const updatedUser = { ...user.value, nickname: nickname.value }
    user.value = updatedUser
    localStorage.setItem('user', JSON.stringify(updatedUser))
    triggerRef(user)  // 强制触发响应式更新

    ElMessage.success('昵称保存成功')

    // 保存成功后延迟跳转到证书页面
    setTimeout(() => {
      router.push('/credentials')
    }, 1000)
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const selectPackage = (pkg: any) => {
  // 存储选择的套餐并跳转
  localStorage.setItem('selectedPackage', JSON.stringify(pkg))
  goVerify()
}

const goVerify = () => {
  router.push('/verify')
}

const goCredentials = () => {
  router.push('/credentials')
}
</script>

<style scoped>
.farming-activity {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 100px;
}

.banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section {
  padding: 20px;
  background: white;
  margin-bottom: 12px;
}

.section-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 4px solid #667eea;
}

/* 昵称设置 */
.nickname-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nickname-section .section-title {
  color: white;
  border-left-color: white;
}

.welcome-text {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 16px;
}

.save-nickname-btn {
  width: 100%;
  margin-top: 12px;
  background: white;
  color: #667eea;
  border: none;
  font-weight: 600;
}

/* 欢迎信息 */
.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.welcome-section .section-title {
  color: white;
  border-left-color: white;
  font-size: 20px;
}

/* 活动介绍 */
.intro-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.hero-icon {
  font-size: 32px;
}

.hero-text {
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.intro-desc {
  color: #666;
  line-height: 1.8;
  text-align: center;
}

.activity-details {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f8f9ff;
  border-radius: 12px;
}

.detail-icon {
  font-size: 24px;
}

.detail-content h4 {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.detail-content p {
  font-size: 12px;
  color: #666;
}

/* 权益 */
.rights-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.right-item {
  text-align: center;
  padding: 20px 12px;
  background: #f8f9ff;
  border-radius: 12px;
}

.right-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.right-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.right-desc {
  font-size: 12px;
  color: #999;
}

/* 认养方案 */
.adoption-section .section-title {
  margin-bottom: 20px;
}

.adoption-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.adoption-card {
  position: relative;
  padding: 20px;
  background: white;
  border: 2px solid #e8e8e8;
  border-radius: 16px;
  transition: all 0.3s;
}

.adoption-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.card-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

.pkg-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.pkg-price {
  margin-bottom: 8px;
}

.price {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
}

.unit {
  font-size: 14px;
  color: #999;
}

.pkg-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.pkg-features {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
}

.pkg-features li {
  font-size: 13px;
  color: #666;
  padding: 4px 0;
  padding-left: 20px;
  position: relative;
}

.pkg-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #10b981;
}

.adopt-now-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

/* 已认养 */
.adopted-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.adopted-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.adopted-icon {
  font-size: 40px;
}

.adopted-info {
  flex: 1;
}

.adopted-info h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.adopted-info p {
  font-size: 13px;
  color: #666;
}

/* 底部按钮 */
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
