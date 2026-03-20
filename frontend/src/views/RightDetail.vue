<template>
  <div class="detail-container">
    <!-- 顶部返回栏 -->
    <div class="nav-bar">
      <div class="nav-back" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <span class="nav-title">权益详情</span>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 权益详情内容 -->
    <div class="detail-content" v-if="currentRight">
      <!-- 头部卡片 -->
      <div class="detail-header">
        <div class="header-icon" :class="`bg-${currentIndex % 6}`">
          <span class="icon-emoji">{{ currentRight.icon }}</span>
        </div>
        <div class="header-info">
          <h1 class="right-title">{{ currentRight.title }}</h1>
          <p class="right-supplier">提供方: {{ currentRight.supplier }}</p>
        </div>
      </div>

      <!-- 权益介绍 -->
      <div class="section">
        <div class="section-header">
          <span class="section-icon">📋</span>
          <h2 class="section-title">权益介绍</h2>
        </div>
        <div class="section-body">
          <p class="detail-text">{{ currentRight.detail?.content }}</p>
        </div>
      </div>

      <!-- 使用方式 -->
      <div class="section">
        <div class="section-header">
          <span class="section-icon">📖</span>
          <h2 class="section-title">如何使用</h2>
        </div>
        <div class="section-body">
          <div class="steps">
            <div class="step" v-for="(step, index) in currentRight.detail?.howToUse" :key="index">
              <div class="step-num">{{ index + 1 }}</div>
              <div class="step-text">{{ step }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 注意事项 -->
      <div class="section notice-section">
        <div class="section-header">
          <span class="section-icon">⚠️</span>
          <h2 class="section-title">注意事项</h2>
        </div>
        <div class="section-body">
          <p class="notice-text">{{ currentRight.detail?.notes }}</p>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="bottom-action">
        <el-button type="primary" class="action-btn" @click="handleUse">
          立即使用
        </el-button>
      </div>
    </div>

    <!-- 未找到 -->
    <div class="not-found" v-else>
      <div class="not-found-icon">❓</div>
      <p class="not-found-text">未找到该权益信息</p>
      <el-button type="primary" @click="goBack">返回</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

interface RightDetail {
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
const route = useRoute()

const rightsData: Record<string, RightDetail> = {
  rice: {
    id: 'rice',
    title: '优质大米',
    description: '每年可获得认养面积对应的新鲜大米，产地直发',
    icon: '🌾',
    supplier: '本来生活',
    badge: '年度重磅',
    tags: ['包邮配送', '品质保障'],
    detail: {
      content: '认养成功后，每年秋收季节我们将为您配送当季新鲜大米。根据认养面积，每亩可获得约500公斤优质大米。我们精选当地优质稻种，采用传统农耕方式，保留大米最纯正的香味和营养。',
      howToUse: [
        '秋收后系统自动安排发货，请保持收货地址正确',
        '支持在"我的订单"中修改配送地址',
        '可转赠给好友，分享您的认养成果'
      ],
      notes: '具体产量可能因当年气候有所浮动，以实际为准。如遇自然灾害等不可抗力，我们会提前通知并提供替代方案。'
    }
  },
  monitor: {
    id: 'monitor',
    title: '实时监控',
    description: '通过物联网设备实时查看田地生长情况',
    icon: '📷',
    supplier: '汤原文旅创新中心',
    tags: ['24小时', '高清画质'],
    detail: {
      content: '田地部署有高清摄像头和土壤传感器，您可以通过手机随时随地查看田地实况，包括作物生长状态、土壤湿度、温度等数据。足不出户就能感受田园乐趣。',
      howToUse: [
        '打开APP进入"我的田地"页面',
        '点击摄像头图标即可查看实时画面',
        '数据每5分钟自动更新一次'
      ],
      notes: '监控数据仅供实时查看，不提供录像存储服务。建议在WiFi环境下使用以节省流量。'
    }
  },
  trace: {
    id: 'trace',
    title: '溯源查询',
    description: '全程追溯农产品生长、加工、运输过程',
    icon: '🔍',
    supplier: '本来生活',
    badge: '品质溯源',
    tags: ['区块链存证', '全程可查'],
    detail: {
      content: '从播种到收货，全程数据上链存储，不可篡改。您可以追溯到每一粒粮食的种植时间、施肥记录、加工过程、物流信息。真正做到吃得放心。',
      howToUse: [
        '扫描产品包装上的溯源二维码',
        '进入溯源页面查看详细记录',
        '可生成分享卡片展示您的认养成果'
      ],
      notes: '溯源信息仅保留认养有效期内的数据，过期后将无法查询。请在认养有效期内完成查询。'
    }
  },
  activity: {
    id: 'activity',
    title: '线下活动',
    description: '优先参与汤原县线下农旅活动',
    icon: '🎁',
    supplier: '汤原文旅创新中心',
    tags: ['优先报名', '专属折扣'],
    detail: {
      content: '每年举办插秧节、丰收节、乡村体验等特色活动，认养用户可优先报名参加，并享受专属折扣。带上家人一起来体验田园生活的乐趣。',
      howToUse: [
        '关注"汤原农文旅"公众号获取活动推送通知',
        '报名时填写认养手机号以验证身份',
        '活动当天出示认养凭证电子码'
      ],
      notes: '部分活动需提前预约，名额有限先到先得。如需取消预约，请提前3天通知以便安排候补。'
    }
  },
  hotel: {
    id: 'hotel',
    title: '民宿优惠',
    description: '合作民宿享受专属折扣',
    icon: '🏨',
    supplier: '本来生活',
    tags: ['专属价', '周末可用'],
    detail: {
      content: '与汤原县多家精品民宿合作，认养用户可享受协议价入住，体验乡村田园生活。清晨推开窗就是金黄的稻田，夜晚能看到满天繁星。',
      howToUse: [
        '联系客服获取合作民宿名录和价格',
        '预定时报认养手机号以享受优惠',
        '到店出示认养凭证即可核销'
      ],
      notes: '节假日需提前7天预定，享受优惠房价。民宿房型有限，建议提前规划行程。'
    }
  },
  ticket: {
    id: 'ticket',
    title: '景区门票',
    description: '汤原县景区免费或优惠门票',
    icon: '🎫',
    supplier: '汤原文旅创新中心',
    tags: ['免费入园', '全年有效'],
    detail: {
      content: '认养用户可免费进入合作景区游览，包括大亮子河国家森林公园、愿景园等汤原著名景点。呼吸清新空气，感受大自然的魅力。',
      howToUse: [
        '到景区门口出示认养凭证',
        '或联系客服换取电子门票',
        '每个景区限免一次入园'
      ],
      notes: '部分特殊活动期间不适用，详情见景区公告。建议提前了解景区开放时间和预约要求。'
    }
  }
}

const currentRight = ref<RightDetail | null>(null)
const currentIndex = computed(() => {
  const keys = Object.keys(rightsData)
  return keys.findIndex(k => k === currentRight.value?.id)
})

onMounted(() => {
  const id = route.query.id as string
  if (id && rightsData[id]) {
    currentRight.value = rightsData[id]
  }
})

const goBack = () => {
  router.back()
}

const handleUse = () => {
  // 实际项目中这里会根据权益类型跳转到不同页面
  router.back()
}
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-back {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
}

.nav-back:active {
  background: #e8e8e8;
}

.nav-back .el-icon {
  font-size: 18px;
  color: #333;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
}

.nav-placeholder {
  width: 36px;
}

/* 内容区 */
.detail-content {
  padding: 16px;
}

/* 头部卡片 */
.detail-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.header-icon {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-0 { background: linear-gradient(135deg, #fff7e6 0%, #ffe4c4 100%); }
.bg-1 { background: linear-gradient(135deg, #e6f3ff 0%, #b3d9ff 100%); }
.bg-2 { background: linear-gradient(135deg, #f0fff0 0%, #c1f0c1 100%); }
.bg-3 { background: linear-gradient(135deg, #fff0f5 0%, #ffd6e0 100%); }
.bg-4 { background: linear-gradient(135deg, #f5f0ff 0%, #d6c9ff 100%); }
.bg-5 { background: linear-gradient(135deg, #fff9e6 0%, #ffeb99 100%); }

.icon-emoji {
  font-size: 36px;
}

.header-info {
  flex: 1;
}

.right-title {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
}

.right-supplier {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

/* 通用区块 */
.section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-icon {
  font-size: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.section-body {
  padding-left: 4px;
}

.detail-text {
  font-size: 15px;
  color: #444;
  line-height: 1.8;
}

/* 使用步骤 */
.steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  padding-top: 2px;
}

/* 注意事项 */
.notice-section {
  background: #fff9e6;
}

.notice-text {
  font-size: 13px;
  color: #8b6914;
  line-height: 1.7;
}

/* 底部按钮 */
.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.action-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 24px;
}

.action-btn:active {
  opacity: 0.9;
  transform: scale(0.98);
}

/* 未找到 */
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
}

.not-found-icon {
  font-size: 48px;
}

.not-found-text {
  font-size: 16px;
  color: #999;
}
</style>
