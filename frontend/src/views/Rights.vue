<template>
  <div class="rights-container">
    <!-- 顶部Header -->
    <div class="rights-header">
      <div class="header-content">
        <h1 class="header-title">我的权益</h1>
        <p class="header-subtitle">专属认养权益，尊享品质生活</p>
      </div>
      <div class="header-decoration"></div>
    </div>

    <!-- 权益卡片列表 -->
    <div class="rights-content">
      <transition-group name="card" tag="div" class="rights-grid">
        <div
          v-for="(right, index) in rightsList"
          :key="right.id"
          class="right-card"
          :class="[`card-${index % 6}`]"
          @click="goToDetail(right)"
        >
          <div class="card-badge" v-if="right.badge">{{ right.badge }}</div>
          <div class="card-icon">
            <span class="icon-emoji">{{ right.icon }}</span>
            <div class="icon-shine"></div>
          </div>
          <div class="card-body">
            <h3 class="card-title">{{ right.title }}</h3>
            <p class="card-desc">{{ right.description }}</p>
            <div class="card-tags" v-if="right.tags">
              <span class="tag" v-for="tag in right.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="card-footer">
            <span class="supplier">提供方: {{ right.supplier }}</span>
            <span class="arrow">
              <el-icon><ArrowRight /></el-icon>
            </span>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- 底部供应商信息 -->
    <div class="supplier-section">
      <div class="supplier-header">
        <span class="supplier-line"></span>
        <span class="supplier-text">权益来源</span>
        <span class="supplier-line"></span>
      </div>
      <div class="supplier-logos">
        <div class="supplier-logo">
          <span class="logo-icon">🏡</span>
          <span class="logo-name">本来生活</span>
        </div>
        <div class="supplier-logo">
          <span class="logo-icon">🏛️</span>
          <span class="logo-name">汤原文旅创新中心</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'

interface Right {
  id: string
  title: string
  description: string
  icon: string
  supplier: string
  badge?: string
  tags?: string[]
  detail?: {
    content: string
    howToUse: string[]
    notes: string
  }
}

const router = useRouter()

const rightsList = ref<Right[]>([
  {
    id: 'rice',
    title: '优质大米',
    description: '每年可获得认养面积对应的新鲜大米，产地直发',
    icon: '🌾',
    supplier: '本来生活',
    badge: '年度重磅',
    tags: ['包邮配送', '品质保障'],
    detail: {
      content: '认养成功后，每年秋收季节我们将为您配送当季新鲜大米。根据认养面积，每亩可获得约500公斤优质大米。',
      howToUse: ['秋收后自动发货', '支持修改配送地址', '可转赠给好友'],
      notes: '具体产量可能因当年气候有所浮动，以实际为准'
    }
  },
  {
    id: 'monitor',
    title: '实时监控',
    description: '通过物联网设备实时查看田地生长情况',
    icon: '📷',
    supplier: '汤原文旅创新中心',
    tags: ['24小时', '高清画质'],
    detail: {
      content: '田地部署有高清摄像头和土壤传感器，您可以通过手机随时随地查看田地实况，包括作物生长状态、土壤湿度、温度等数据。',
      howToUse: ['打开APP进入"我的田地"', '点击摄像头图标即可查看', '数据每5分钟更新一次'],
      notes: '监控数据仅供实时查看，不提供录像存储服务'
    }
  },
  {
    id: 'trace',
    title: '溯源查询',
    description: '全程追溯农产品生长、加工、运输过程',
    icon: '🔍',
    supplier: '本来生活',
    badge: '品质溯源',
    tags: ['区块链存证', '全程可查'],
    detail: {
      content: '从播种到收货，全程数据上链存储。您可以追溯到每一粒粮食的种植时间、施肥记录、加工过程、物流信息。',
      howToUse: ['扫描产品包装二维码', '进入溯源页面查看详情', '可分享给朋友展示您的认养成果'],
      notes: '溯源信息仅保留认养有效期内的数据'
    }
  },
  {
    id: 'activity',
    title: '线下活动',
    description: '优先参与汤原县线下农旅活动',
    icon: '🎁',
    supplier: '汤原文旅创新中心',
    tags: ['优先报名', '专属折扣'],
    detail: {
      content: '每年举办插秧节、丰收节、乡村体验等特色活动，认养用户可优先报名参加，并享受专属折扣。',
      howToUse: ['关注公众号获取活动通知', '报名时填写认养手机号', '活动当天出示认养凭证'],
      notes: '部分活动需提前预约，名额有限先到先得'
    }
  },
  {
    id: 'hotel',
    title: '民宿优惠',
    description: '合作民宿享受专属折扣',
    icon: '🏨',
    supplier: '本来生活',
    tags: ['专属价', '周末可用'],
    detail: {
      content: '与汤原县多家精品民宿合作，认养用户可享受协议价入住，体验乡村田园生活。',
      howToUse: ['联系客服获取民宿名录', '预定时报认养手机号', '到店出示认养凭证'],
      notes: '节假日需提前7天预定，享受优惠房价'
    }
  },
  {
    id: 'ticket',
    title: '景区门票',
    description: '汤原县景区免费或优惠门票',
    icon: '🎫',
    supplier: '汤原文旅创新中心',
    tags: ['免费入园', '全年有效'],
    detail: {
      content: '认养用户可免费进入合作景区游览，包括大亮子河国家森林公园、愿景园等汤原著名景点。',
      howToUse: ['到景区门口出示认养凭证', '或联系客服换取电子门票', '每个景区限免一次'],
      notes: '部分特殊活动期间不适用，详情见景区公告'
    }
  }
])

const goToDetail = (right: Right) => {
  router.push({
    path: '/rights/detail',
    query: { id: right.id }
  })
}
</script>

<style scoped>
.rights-container {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Header 样式 */
.rights-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 48px 24px 60px;
  position: relative;
  overflow: hidden;
}

.header-decoration {
  position: absolute;
  bottom: -20px;
  left: 0;
  right: 0;
  height: 40px;
  background: #f8fafc;
  border-radius: 20px 20px 0 0;
}

.header-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.header-title {
  font-size: 28px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 1px;
}

/* 权益内容区 */
.rights-content {
  padding: 24px 16px;
  margin-top: -20px;
  position: relative;
  z-index: 2;
}

.rights-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* 卡片样式 */
.right-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.right-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.card-badge {
  position: absolute;
  top: 12px;
  right: -24px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  font-size: 10px;
  padding: 2px 28px;
  transform: rotate(45deg);
  font-weight: 500;
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
}

.icon-emoji {
  font-size: 28px;
  position: relative;
  z-index: 1;
}

.icon-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 60%
  );
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

/* 不同卡片的图标背景色 */
.card-0 .card-icon { background: linear-gradient(135deg, #fff7e6 0%, #ffe4c4 100%); }
.card-1 .card-icon { background: linear-gradient(135deg, #e6f3ff 0%, #b3d9ff 100%); }
.card-2 .card-icon { background: linear-gradient(135deg, #f0fff0 0%, #c1f0c1 100%); }
.card-3 .card-icon { background: linear-gradient(135deg, #fff0f5 0%, #ffd6e0 100%); }
.card-4 .card-icon { background: linear-gradient(135deg, #f5f0ff 0%, #d6c9ff 100%); }
.card-5 .card-icon { background: linear-gradient(135deg, #fff9e6 0%, #ffeb99 100%); }

.card-body {
  flex: 1;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.card-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.tag {
  font-size: 10px;
  padding: 2px 6px;
  background: #f0f0f5;
  color: #666;
  border-radius: 4px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #f5f5f5;
  margin-top: auto;
}

.supplier {
  font-size: 11px;
  color: #999;
}

.arrow {
  color: #c0c0c0;
  display: flex;
  align-items: center;
  transition: transform 0.2s;
}

.right-card:active .arrow {
  transform: translateX(2px);
}

/* 卡片动画 */
.card-enter-active {
  transition: all 0.4s ease-out;
}

.card-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* 供应商区域 */
.supplier-section {
  padding: 32px 24px 48px;
  text-align: center;
}

.supplier-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.supplier-line {
  width: 40px;
  height: 1px;
  background: #e0e0e0;
}

.supplier-text {
  font-size: 13px;
  color: #999;
}

.supplier-logos {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.supplier-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 28px;
}

.logo-name {
  font-size: 12px;
  color: #666;
}
</style>
