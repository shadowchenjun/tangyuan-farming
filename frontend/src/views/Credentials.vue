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
    <div class="no-farm" v-else-if="!farmInfo && !claiming">
      <div class="no-farm-content">
        <div class="no-farm-icon">🌾</div>
        <h3>您还没有认养田地</h3>
        <p>参与云认养，获得专属数字田地凭证</p>
        <el-button type="primary" size="large" @click="goFarming">立即认养</el-button>
      </div>
    </div>

    <!-- 领取证书页面 -->
    <div class="claim-page" v-else-if="claiming && !farmInfo">
      <div class="claim-card">
        <div class="claim-header">
          <div class="claim-badge">数字田地凭证</div>
          <div class="claim-year">{{ currentYear }} 年度</div>
        </div>

        <div class="claim-body">
          <div class="claim-user" v-if="user">
            <span class="label">认养人</span>
            <span class="value">{{ user.nickname || '匿名用户' }}</span>
          </div>

          <div class="claim-form" v-if="!claimed">
            <h3 class="claim-title">填写认养信息</h3>

            <el-form ref="claimFormRef" :model="claimForm" :rules="claimRules" label-position="top">
              <el-form-item label="认养面积" prop="area">
                <el-select v-model="claimForm.area" placeholder="请选择认养面积" size="large">
                  <el-option label="1亩（体验版）" :value="1" />
                  <el-option label="3亩（标准版）" :value="3" />
                  <el-option label="5亩（尊享版）" :value="5" />
                  <el-option label="10亩（旗舰版）" :value="10" />
                </el-select>
              </el-form-item>

              <el-form-item label="田地位置" prop="address">
                <el-input v-model="claimForm.address" placeholder="黑龙江省汤原县" size="large" />
              </el-form-item>

              <el-form-item label="订单编号" prop="orderNo">
                <el-input v-model="claimForm.orderNo" placeholder="请输入您的订单编号" size="large" />
              </el-form-item>
            </el-form>

            <el-button type="primary" size="large" class="claim-btn" :loading="claimingLoading" @click="handleClaim">
              领取证书
            </el-button>
          </div>

          <!-- 领取成功 -->
          <div class="claim-success" v-else>
            <div class="success-icon">🎉</div>
            <h3>领取成功！</h3>
            <p>您的数字田地凭证已生成</p>
            <el-button type="primary" size="large" class="view-cert-btn" @click="viewCertificate">
              查看我的证书
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 我的证书展示 -->
    <div class="certificate-display" v-else-if="farmInfo">
      <!-- 多证书选择器 -->
      <div class="farm-selector" v-if="farms.length > 1">
        <div class="selector-label">选择查看的证书：</div>
        <el-select v-model="selectedFarmIndex" size="large" placeholder="请选择">
          <el-option
            v-for="(farm, index) in farms"
            :key="farm.id"
            :label="`${farm.land_no || '田地' + (index + 1)} - ${farm.area}亩`"
            :value="index"
          />
        </el-select>
      </div>

      <div class="certificate-wrapper">
        <!-- 证书主体 -->
        <div class="certificate">
          <div class="cert-decor top-left"></div>
          <div class="cert-decor top-right"></div>
          <div class="cert-decor bottom-left"></div>
          <div class="cert-decor bottom-right"></div>

          <div class="cert-header">
            <div class="cert-badge">数字田地凭证</div>
            <div class="cert-seal">
              <div class="seal-circle">汤原</div>
            </div>
          </div>

          <div class="cert-body">
            <h1 class="cert-title">云认养证书</h1>
            <p class="cert-subtitle">CLOUD ADOPTION CERTIFICATE</p>

            <div class="cert-content">
              <div class="cert-user">
                <span class="label">认养人</span>
                <span class="name">{{ user?.nickname || farmInfo.owner_name || '匿名用户' }}</span>
              </div>

              <div class="cert-divider"></div>

              <div class="cert-details">
                <div class="detail-row">
                  <span class="label">认养面积</span>
                  <span class="value">{{ farmInfo.area || 1 }}亩</span>
                </div>
                <div class="detail-row">
                  <span class="label">田地编号</span>
                  <span class="value">{{ farmInfo.land_no || 'TY-' + farmInfo.id?.slice(0, 8).toUpperCase() }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">田地地址</span>
                  <span class="value">{{ farmInfo.address || '黑龙江省汤原县' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">认养周期</span>
                  <span class="value">{{ farmInfo.year || currentYear }}年度</span>
                </div>
              </div>

              <div class="cert-divider"></div>

              <div class="cert-footer-info">
                <div class="ddc-section">
                  <span class="label">DDC 链 ID</span>
                  <div class="ddc-id">{{ formatDdcId(farmInfo.ddc_id) }}</div>
                </div>
                <div class="cert-date">
                  <span class="label">发证日期</span>
                  <span class="value">{{ formatDate(farmInfo.created_at) }}</span>
                </div>
              </div>
            </div>

            <div class="cert-qr">
              <div class="qr-placeholder">📱</div>
              <span>扫码验证</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="cert-actions">
          <el-button size="large" class="action-btn" @click="shareCertificate">
            <span class="btn-icon">📤</span>
            分享证书
          </el-button>
          <el-button type="primary" size="large" class="action-btn primary" @click="goRights">
            <span class="btn-icon">🎁</span>
            查看权益
          </el-button>
        </div>

        <!-- 再次认养 -->
        <div class="re-adopt">
          <p>认养更多田地，享受更多权益</p>
          <el-button text type="primary" @click="goFarming">再次认养 →</el-button>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-bar" v-if="user && farmInfo">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserFarms, allocateLand } from '../api'
import type { FormInstance } from 'element-plus'

const router = useRouter()

interface UserInfo {
  id: string
  phone: string
  nickname?: string
}

interface FarmInfo {
  id: string
  land_no: string
  area: number
  address: string
  year: number
  ddc_id: string
  owner_name?: string
  created_at?: string
}

const user = ref<UserInfo | null>(null)
const farms = ref<FarmInfo[]>([])
const selectedFarmIndex = ref(0)
const claiming = ref(false)
const claimed = ref(false)
const claimingLoading = ref(false)
const claimFormRef = ref<FormInstance>()
const currentFarmInfo = ref<FarmInfo | null>(null)

// 计算属性：当前选中的认养信息
const farmInfo = computed(() => {
  return currentFarmInfo.value || farms.value[selectedFarmIndex.value] || null
})

const claimForm = ref({
  area: 1,
  address: '黑龙江省汤原县',
  orderNo: ''
})

const claimRules = {
  area: [{ required: true, message: '请选择认养面积', trigger: 'change' }],
  address: [{ required: true, message: '请输入田地位置', trigger: 'blur' }],
  orderNo: [{ required: true, message: '请输入订单编号', trigger: 'blur' }]
}

const currentYear = new Date().getFullYear()

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr && userStr !== 'undefined' && userStr !== 'null') {
    try {
      user.value = JSON.parse(userStr)
    } catch (e) {
      user.value = null
    }
    loadFarmInfo()
  }
})

const loadFarmInfo = async () => {
  // 先从localStorage获取farmInfo
  const farmStr = localStorage.getItem('farmInfo')
  if (farmStr && farmStr !== 'undefined' && farmStr !== 'null') {
    try {
      currentFarmInfo.value = JSON.parse(farmStr)
    } catch (e) {
      currentFarmInfo.value = null
    }
  }

  // 如果有token，尝试从API获取所有农场
  const token = localStorage.getItem('token')
  if (token && user.value) {
    try {
      const res = await getUserFarms(user.value.id, token)
      if (res.farms && res.farms.length > 0) {
        farms.value = res.farms
        // 如果当前没有选中农场，选择第一个
        if (!currentFarmInfo.value) {
          currentFarmInfo.value = res.farms[0]
        } else {
          // 找到当前选中的农场
          const idx = res.farms.findIndex(f => f.id === currentFarmInfo.value?.id)
          if (idx >= 0) {
            selectedFarmIndex.value = idx
          } else {
            currentFarmInfo.value = res.farms[0]
          }
        }
        // 更新localStorage
        localStorage.setItem('farmInfo', JSON.stringify(currentFarmInfo.value))
      } else {
        // 没有认养记录，显示领取页面
        claiming.value = true
      }
    } catch {
      claiming.value = true
    }
  }
}

const handleClaim = async () => {
  if (!claimFormRef.value) return

  await claimFormRef.value.validate()
  claimingLoading.value = true

  try {
    const token = localStorage.getItem('token')
    if (!token || !user.value) {
      ElMessage.error('请先登录')
      router.push('/login')
      return
    }

    // 调用分配田地API
    const res = await allocateLand(user.value.id, claimForm.value.orderNo, token)

    // 使用API返回的农场数据
    const newFarm: FarmInfo = {
      id: res.farm.id,
      land_no: res.farm.land_no,
      area: res.farm.area,
      address: res.farm.address,
      year: res.farm.year,
      ddc_id: res.farm.ddc_id,
      created_at: res.farm.created_at
    }

    // 添加到认养列表
    farms.value.push(newFarm)
    selectedFarmIndex.value = farms.value.length - 1
    currentFarmInfo.value = newFarm
    localStorage.setItem('farmInfo', JSON.stringify(newFarm))
    claimed.value = true
    claiming.value = false

    ElMessage.success('证书领取成功！')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '领取失败，请检查订单编号')
  } finally {
    claimingLoading.value = false
  }
}

const generateDdcId = () => {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

const formatDdcId = (ddcId: string) => {
  if (!ddcId) return '-'
  if (ddcId.length <= 12) return ddcId
  return ddcId.slice(0, 8) + '...' + ddcId.slice(-6)
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const viewCertificate = () => {
  claimed.value = false
  claiming.value = false
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

const shareCertificate = () => {
  ElMessage.success('分享功能开发中')
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

.no-farm-content {
  padding: 40px 20px;
}

.no-farm-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.no-farm-content h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 8px;
}

.no-farm-content p {
  color: #666;
  margin-bottom: 24px;
}

/* 领取证书页面 */
.claim-page {
  padding: 20px;
}

.claim-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.claim-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  text-align: center;
  color: white;
}

.claim-badge {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.claim-year {
  font-size: 14px;
  opacity: 0.9;
}

.claim-body {
  padding: 24px;
}

.claim-user {
  text-align: center;
  margin-bottom: 24px;
}

.claim-user .label {
  color: #999;
  font-size: 14px;
}

.claim-user .value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-left: 8px;
}

.claim-title {
  font-size: 18px;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.claim-btn {
  width: 100%;
  margin-top: 20px;
  height: 48px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.claim-success {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.claim-success h3 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.claim-success p {
  color: #666;
  margin-bottom: 24px;
}

.view-cert-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
}

/* 证书展示 */
.certificate-wrapper {
  padding: 20px;
}

.certificate {
  position: relative;
  background: linear-gradient(135deg, #fefefe 0%, #f8f9ff 100%);
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #667eea;
}

.cert-decor {
  position: absolute;
  width: 40px;
  height: 40px;
  border: 3px solid #667eea;
}

.top-left {
  top: -3px;
  left: -3px;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 16px;
}

.top-right {
  top: -3px;
  right: -3px;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 16px;
}

.bottom-left {
  bottom: -3px;
  left: -3px;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 16px;
}

.bottom-right {
  bottom: -3px;
  right: -3px;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 16px;
}

.cert-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.cert-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.cert-seal {
  width: 60px;
  height: 60px;
  border: 3px solid #667eea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.seal-circle {
  font-size: 12px;
  font-weight: 700;
  color: #667eea;
  text-align: center;
}

.cert-body {
  text-align: center;
}

.cert-title {
  font-size: 28px;
  color: #333;
  font-weight: 700;
  margin-bottom: 4px;
}

.cert-subtitle {
  font-size: 12px;
  color: #999;
  letter-spacing: 2px;
  margin-bottom: 24px;
}

.cert-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
}

.cert-user {
  margin-bottom: 20px;
}

.cert-user .label {
  color: #999;
  font-size: 14px;
}

.cert-user .name {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-left: 12px;
}

.cert-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
  margin: 20px 0;
}

.cert-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  text-align: left;
}

.detail-row {
  display: flex;
  flex-direction: column;
}

.detail-row .label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.detail-row .value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.cert-footer-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.ddc-section {
  text-align: left;
}

.ddc-section .label {
  font-size: 12px;
  color: #999;
  display: block;
  margin-bottom: 4px;
}

.ddc-id {
  font-family: monospace;
  font-size: 12px;
  color: #667eea;
  background: #f0f0ff;
  padding: 6px 10px;
  border-radius: 6px;
}

.cert-date {
  text-align: right;
}

.cert-date .label {
  font-size: 12px;
  color: #999;
  display: block;
  margin-bottom: 4px;
}

.cert-date .value {
  font-size: 14px;
  color: #333;
}

.cert-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f8f9ff;
  border-radius: 12px;
}

.qr-placeholder {
  font-size: 48px;
}

.cert-qr span {
  font-size: 12px;
  color: #999;
}

/* 操作按钮 */
.cert-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.action-btn {
  flex: 1;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.btn-icon {
  font-size: 18px;
}

.re-adopt {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px dashed #e0e0e0;
}

.re-adopt p {
  color: #999;
  font-size: 14px;
  margin-bottom: 8px;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.bottom-bar .action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.bottom-bar .action-btn:hover {
  background: #f5f7fa;
}

.bottom-bar .action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.bottom-bar .icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.bottom-bar span:last-child {
  font-size: 14px;
}

/* 多证书选择器 */
.farm-selector {
  background: white;
  padding: 16px 20px;
  margin-bottom: 12px;
  border-radius: 8px;
}

.selector-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.farm-selector .el-select {
  width: 100%;
}
</style>
