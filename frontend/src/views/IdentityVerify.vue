<template>
  <div class="verify-container">
    <div class="verify-box">
      <h2 class="title">云认养身份验证</h2>
      <p class="desc">请输入您的订单编号后6位进行验证</p>
      
      <el-form ref="formRef" :model="form" :rules="rules">
        <el-form-item prop="orderNo">
          <el-input 
            v-model="form.orderNo" 
            placeholder="请输入订单编号后6位"
            size="large"
            maxlength="6"
            :prefix-icon="Document"
          />
        </el-form-item>
        
        <el-button 
          type="primary" 
          size="large" 
          class="verify-btn"
          :loading="loading"
          @click="handleVerify"
        >
          确认验证
        </el-button>
      </el-form>
      
      <div class="tips">
        <p>提示：订单编号来源于您在卓望消费帮扶平台的购买订单</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { verifyOrder } from '../api'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  orderNo: ''
})

const rules = {
  orderNo: [
    { required: true, message: '请输入订单编号', trigger: 'blur' },
    { len: 6, message: '订单编号为6位数字', trigger: 'blur' }
  ]
}

const handleVerify = async () => {
  await formRef.value?.validate()
  loading.value = true

  try {
    const res = await verifyOrder(form.orderNo)

    if (res.valid) {
      // 计算订单商品总数量
      let totalQuantity = 0
      let orderDetail = res.order.order_detail
      if (typeof orderDetail === 'string') {
        try { orderDetail = JSON.parse(orderDetail) } catch (e) { orderDetail = [] }
      }
      if (Array.isArray(orderDetail)) {
        totalQuantity = orderDetail.reduce((sum, item) => sum + (item.quantity || 0), 0)
      }

      // 计算认养亩数 (quantity / 20)
      const landSize = totalQuantity > 0 ? (totalQuantity / 20).toFixed(2) : 0
      // 假设1份商品 = 10斤大米
      const riceQty = totalQuantity * 10

      // 存储订单信息（包含预分配的田地信息）
      localStorage.setItem('orderInfo', JSON.stringify({
        orderNo: res.order.order_no || form.orderNo,
        phone: res.order.phone,
        riceQty: riceQty,
        landSize: landSize,
        address: res.order.land_location || res.order.address,
        year: res.order.year,
        source: res.order.source,
        order_detail: orderDetail,
        // 预分配的田地信息
        land_no: res.order.land_no,
        land_area: res.order.land_area,
        land_location: res.order.land_location
      }))
      ElMessage.success('验证成功')
      router.push('/allocate')
    } else {
      ElMessage.error(res.message || '订单编号无效')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '验证失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.verify-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.verify-box {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.title {
  text-align: center;
  font-size: 22px;
  color: #333;
  margin-bottom: 8px;
}

.desc {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-bottom: 32px;
}

.verify-btn {
  width: 100%;
  margin-top: 16px;
  height: 48px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.tips {
  margin-top: 24px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.tips p {
  font-size: 12px;
  color: #999;
  text-align: center;
  line-height: 1.6;
}
</style>
