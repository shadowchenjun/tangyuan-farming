<template>
  <div class="credentials-container">
    <!-- Banner -->
    <div class="banner">
      <el-carousel height="150px" :autoplay="false">
        <el-carousel-item v-for="i in 3" :key="i">
          <img :src="`https://picsum.photos/800/300?random=${i+20}`" alt="banner" />
        </el-carousel-item>
      </el-carousel>
    </div>
    
    <!-- 未登录提示 -->
    <div class="login-prompt" v-if="!user">
      <el-empty description="请先登录">
        <el-button type="primary" @click="goLogin">去登录</el-button>
      </el-empty>
    </div>
    
    <!-- 无田地提示 -->
    <div class="no-farm" v-else-if="!farmInfo">
      <el-empty description="您还没有认养田地">
        <el-button type="primary" @click="goFarming">立即认养</el-button>
      </el-empty>
    </div>
    
    <!-- 数字田地凭证卡片 -->
    <div class="credential-card" v-else>
      <div class="credential-header">
        <span class="badge">云认养凭证</span>
        <span class="year">{{ farmInfo.year }}年度</span>
      </div>
      
      <div class="credential-body">
        <div class="farmer-info">
          <span class="label">认养人：</span>
          <span class="name">{{ user.nickname }}</span>
        </div>
        
        <div class="land-info">
          <div class="info-item">
            <span class="label">认养田地面积</span>
            <span class="value">{{ farmInfo.area }}亩</span>
          </div>
          <div class="info-item">
            <span class="label">田地编号</span>
            <span class="value">{{ farmInfo.land_no }}</span>
          </div>
          <div class="info-item">
            <span class="label">田地地址</span>
            <span class="value">{{ farmInfo.address }}</span>
          </div>
          <div class="info-item">
            <span class="label">认养周期</span>
            <span class="value">{{ farmInfo.year }}年度</span>
          </div>
        </div>
        
        <div class="ddc-info">
          <span class="label">DDC ID：</span>
          <span class="ddc-id">{{ formatDdcId(farmInfo.ddc_id) }}</span>
        </div>
      </div>
    </div>
    
    <!-- 底部操作栏 -->
    <div class="bottom-bar" v-if="user">
      <div class="action-btn" @click="goFarming">
        <span class="icon">➕</span>
        <span>新认养</span>
      </div>
      <div class="action-btn primary" @click="goRights">
        <span class="icon">🎁</span>
        <span>查看权益</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserFarms } from '../api'

const router = useRouter()

interface UserInfo {
  id: string
  phone: string
  nickname: string
}

interface FarmInfo {
  id: string
  land_no: string
  area: number
  address: string
  year: number
  ddc_id: string
}

const user = ref<UserInfo | null>(null)
const farmInfo = ref<FarmInfo | null>(null)
const loading = ref(false)

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    user.value = JSON.parse(userStr)
    loadFarmInfo()
  }
})

const loadFarmInfo = async () => {
  // 先从localStorage获取
  const farmStr = localStorage.getItem('farmInfo')
  if (farmStr) {
    farmInfo.value = JSON.parse(farmStr)
    return
  }
  
  // 如果有token，尝试从API获取
  const token = localStorage.getItem('token')
  if (token && user.value) {
    try {
      loading.value = true
      const res = await getUserFarms(token)
      if (res.farms && res.farms.length > 0) {
        farmInfo.value = res.farms[0]
        localStorage.setItem('farmInfo', JSON.stringify(res.farms[0]))
      }
    } catch (error) {
      console.error('Failed to load farm info:', error)
    } finally {
      loading.value = false
    }
  }
}

const formatDdcId = (ddcId: string) => {
  if (!ddcId) return '-'
  if (ddcId.length <= 8) return ddcId
  return ddcId.substring(0, 6) + '...' + ddcId.substring(ddcId.length - 4)
}

const goLogin = () => {
  router.push('/login')
}

const goFarming = () => {
  router.push('/farming')
}

const goRights = () => {
  router.push('/rights')
}
</script>

<style scoped>
.credentials-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

.banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-prompt, .no-farm {
  padding: 60px 20px;
  text-align: center;
}

.credential-card {
  margin: 20px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.credential-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge {
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.year {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.credential-body {
  padding: 20px;
}

.farmer-info {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #eee;
}

.farmer-info .label {
  color: #999;
  font-size: 14px;
}

.farmer-info .name {
  color: #333;
  font-size: 18px;
  font-weight: 600;
  margin-left: 8px;
}

.land-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item .label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.info-item .value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.ddc-info {
  padding: 12px;
  background: #f8f9ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
}

.ddc-info .label {
  color: #999;
  font-size: 12px;
}

.ddc-info .ddc-id {
  color: #667eea;
  font-size: 14px;
  font-family: monospace;
  margin-left: 8px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.action-btn:hover {
  background: #f5f7fa;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn .icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.action-btn span:last-child {
  font-size: 14px;
}
</style>
