<template>
  <div class="rights-container">
    <div class="rights-header">
      <h2>我的权益</h2>
      <p>您认养田地后获得的专属权益</p>
    </div>
    
    <div class="rights-list" v-if="rights.length > 0">
      <div class="right-card" v-for="right in rights" :key="right.id">
        <div class="right-icon">{{ right.icon }}</div>
        <div class="right-content">
          <h3>{{ right.title }}</h3>
          <p>{{ right.description }}</p>
          <p class="supplier">提供方: {{ right.supplier }}</p>
        </div>
      </div>
    </div>
    
    <div class="rights-list" v-else>
      <div class="right-card">
        <div class="right-icon">🌾</div>
        <div class="right-content">
          <h3>优质大米</h3>
          <p>每年可获得认养面积对应的新鲜大米</p>
        </div>
      </div>
      
      <div class="right-card">
        <div class="right-icon">📷</div>
        <div class="right-content">
          <h3>实时监控</h3>
          <p>通过物联网设备实时查看田地生长情况</p>
        </div>
      </div>
      
      <div class="right-card">
        <div class="right-icon">🔍</div>
        <div class="right-content">
          <h3>溯源查询</h3>
          <p>全程追溯农产品生长、加工、运输过程</p>
        </div>
      </div>
      
      <div class="right-card">
        <div class="right-icon">🎁</div>
        <div class="right-content">
          <h3>线下活动</h3>
          <p>优先参与汤原县线下农旅活动</p>
        </div>
      </div>
      
      <div class="right-card">
        <div class="right-icon">🏨</div>
        <div class="right-content">
          <h3>民宿优惠</h3>
          <p>合作民宿享受专属折扣</p>
        </div>
      </div>
      
      <div class="right-card">
        <div class="right-icon">🎫</div>
        <div class="right-content">
          <h3>景区门票</h3>
          <p>汤原县景区免费或优惠门票</p>
        </div>
      </div>
    </div>
    
    <div class="supplier-info">
      <h4>权益来源</h4>
      <p>本平台权益由本来生活、汤原文旅创新中心提供</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getRights } from '../api'

interface Right {
  id: string
  title: string
  description: string
  icon: string
  supplier: string
}

const rights = ref<Right[]>([])

onMounted(async () => {
  try {
    const res = await getRights()
    rights.value = res.rights || []
  } catch (error) {
    console.error('Failed to load rights:', error)
  }
})
</script>

<style scoped>
.rights-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.rights-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  text-align: center;
  color: white;
}

.rights-header h2 {
  font-size: 24px;
  margin-bottom: 8px;
}

.rights-header p {
  font-size: 14px;
  opacity: 0.8;
}

.rights-list {
  padding: 20px;
}

.right-card {
  display: flex;
  align-items: center;
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.right-icon {
  font-size: 32px;
  margin-right: 16px;
}

.right-content h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.right-content p {
  font-size: 13px;
  color: #999;
  line-height: 1.5;
}

.right-content .supplier {
  font-size: 11px;
  color: #667eea;
  margin-top: 4px;
}

.supplier-info {
  margin: 20px;
  padding: 16px;
  background: #f8f9ff;
  border-radius: 12px;
  text-align: center;
}

.supplier-info h4 {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.supplier-info p {
  font-size: 12px;
  color: #999;
}
</style>
