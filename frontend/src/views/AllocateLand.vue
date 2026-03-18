<template>
  <div class="allocate-container">
    <div class="allocate-box">
      <h2 class="title">分配数字田地</h2>
      
      <!-- 订单信息 -->
      <div class="info-card">
        <h3>订单信息</h3>
        <div class="info-row">
          <span class="label">订单编号：</span>
          <span class="value">{{ orderInfo?.orderNo }}</span>
        </div>
        <div class="info-row">
          <span class="label">订购时间：</span>
          <span class="value">{{ orderInfo?.year }}年</span>
        </div>
        <div class="info-row">
          <span class="label">购买大米：</span>
          <span class="value">{{ orderInfo?.riceQty }}斤</span>
        </div>
      </div>
      
      <!-- 田地分配结果 -->
      <div class="result-card">
        <h3>田地分配结果</h3>
        <div class="land-img">
          <img src="https://picsum.photos/600/300?random=10" alt="田地" />
        </div>
        
        <div class="land-info">
          <div class="info-row">
            <span class="label">认养田地面积：</span>
            <span class="value highlight">{{ orderInfo?.landSize }}亩</span>
          </div>
          <div class="info-row">
            <span class="label">田地编号：</span>
            <span class="value">TY-{{ orderInfo?.year }}-001</span>
          </div>
          <div class="info-row">
            <span class="label">田地地址：</span>
            <span class="value">{{ orderInfo?.address }}</span>
          </div>
          <div class="info-row">
            <span class="label">认养周期：</span>
            <span class="value">{{ orderInfo?.year }}年度</span>
          </div>
        </div>
        
        <div class="exchange-rule">
          <h4>兑换规则</h4>
          <p>10斤大米 = 1亩田地</p>
        </div>
      </div>
      
      <el-button 
        type="primary" 
        size="large" 
        class="claim-btn"
        @click="handleClaim"
      >
        领取数字田地凭证
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { allocateLand } from '../api'

const router = useRouter()
const loading = ref(false)

interface OrderInfo {
  orderNo: string
  phone: string
  riceQty: number
  landSize: number
  address: string
  year: number
}

const orderInfo = ref<OrderInfo | null>(null)
const farmInfo = ref<any>(null)

onMounted(() => {
  const info = localStorage.getItem('orderInfo')
  if (info) {
    orderInfo.value = JSON.parse(info)
    // 如果之前已经分配过田地，获取之前的分配信息
    const farm = localStorage.getItem('farmInfo')
    if (farm) {
      farmInfo.value = JSON.parse(farm)
    }
  } else {
    ElMessage.warning('请先完成身份验证')
    router.push('/verify')
  }
})

const handleClaim = async () => {
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  const user = JSON.parse(userStr)
  loading.value = true
  
  try {
    const res = await allocateLand(user.id, orderInfo.value!.orderNo)
    
    // 保存田地信息
    farmInfo.value = res.farm
    localStorage.setItem('farmInfo', JSON.stringify(res.farm))
    
    ElMessage.success('领取成功！')
    router.push('/credentials')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '领取失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.allocate-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  padding-top: 40px;
}

.allocate-box {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 500px;
  margin: 0 auto;
}

.title {
  text-align: center;
  font-size: 22px;
  color: #333;
  margin-bottom: 24px;
}

.info-card, .result-card {
  padding: 16px;
  background: #f8f9ff;
  border-radius: 12px;
  margin-bottom: 16px;
}

.info-card h3, .result-card h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.label {
  color: #999;
  font-size: 14px;
}

.value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.value.highlight {
  color: #667eea;
  font-size: 18px;
}

.land-img img {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 12px;
}

.land-info {
  margin-bottom: 12px;
}

.exchange-rule {
  padding: 12px;
  background: white;
  border-radius: 8px;
  text-align: center;
}

.exchange-rule h4 {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.exchange-rule p {
  font-size: 12px;
  color: #999;
}

.claim-btn {
  width: 100%;
  margin-top: 16px;
  height: 48px;
  font-size: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}
</style>
