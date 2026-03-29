<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { benlaiApi, type BenlaiOrder } from '../../api/benlai'

const loading = ref(false)
const orders = ref<BenlaiOrder[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const searchForm = ref({
  out_trade_no: '',
  phone: '',
  status: ''
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增订单')
const isBatchCreate = ref(false)
const formRef = ref()
const batchData = ref('')

const form = ref({
  out_trade_no: '',
  order_id: '',
  receive_contact: '',
  receive_phone: '',
  province: '',
  city: '',
  county: '',
  receive_address: '',
  order_price: 0,
  ship_price: 0,
  order_status: 'ORDER_STATUS_INITIAL',
  order_status_remark: '订单初始',
  order_detail: ''
})

const statusOptions = [
  { label: '订单初始', value: 'ORDER_STATUS_INITIAL' },
  { label: '订单作废', value: 'ORDER_STATUS_REVOKE' },
  { label: '订单取消', value: 'ORDER_STATUS_CANCEL' },
  { label: '订单确认', value: 'ORDER_STATUS_CONFIRM' },
  { label: '待出库', value: 'ORDER_STATUS_EXPRESS_WAIT' },
  { label: '部分出库', value: 'ORDER_STATUS_EXPRESS_PART' },
  { label: '全出库', value: 'ORDER_STATUS_EXPRESS_FULL' },
  { label: '妥投完成', value: 'ORDER_STATUS_EXPRESS_COMPLETE' }
]

const statusTypeMap: Record<string, string> = {
  'ORDER_STATUS_INITIAL': 'info',
  'ORDER_STATUS_REVOKE': 'danger',
  'ORDER_STATUS_CANCEL': 'danger',
  'ORDER_STATUS_CONFIRM': 'warning',
  'ORDER_STATUS_EXPRESS_WAIT': 'warning',
  'ORDER_STATUS_EXPRESS_PART': 'primary',
  'ORDER_STATUS_EXPRESS_FULL': 'primary',
  'ORDER_STATUS_EXPRESS_COMPLETE': 'success'
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await benlaiApi.getOrders({
      page: page.value,
      page_size: pageSize.value,
      status: searchForm.value.status || undefined,
      phone: searchForm.value.phone || undefined,
      out_trade_no: searchForm.value.out_trade_no || undefined
    })
    orders.value = res.items
    total.value = res.total
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchData()
}

const handleReset = () => {
  searchForm.value = { out_trade_no: '', phone: '', status: '' }
  page.value = 1
  fetchData()
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  page.value = 1
  fetchData()
}

const showAddDialog = () => {
  dialogTitle.value = '新增订单'
  isBatchCreate.value = false
  form.value = {
    out_trade_no: '',
    order_id: '',
    receive_contact: '',
    receive_phone: '',
    province: '',
    city: '',
    county: '',
    receive_address: '',
    order_price: 0,
    ship_price: 0,
    order_status: 'ORDER_STATUS_INITIAL',
    order_status_remark: '订单初始',
    order_detail: ''
  }
  dialogVisible.value = true
}

const showBatchDialog = () => {
  dialogTitle.value = '批量导入订单'
  isBatchCreate.value = true
  batchData.value = ''
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    if (isBatchCreate.value) {
      // 批量导入
      const orders = JSON.parse(batchData.value)
      if (!Array.isArray(orders)) {
        ElMessage.error('请输入有效的JSON数组')
        return
      }
      await benlaiApi.batchCreateOrders(orders)
      ElMessage.success('导入成功')
    } else {
      // 单个创建
      if (!form.value.out_trade_no) {
        ElMessage.error('商户订单号必填')
        return
      }
      await benlaiApi.createOrder({
        ...form.value,
        order_detail: form.value.order_detail ? JSON.parse(form.value.order_detail) : undefined
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

const handleDelete = async (row: BenlaiOrder) => {
  try {
    await ElMessageBox.confirm('确定要删除该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await benlaiApi.deleteOrder(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

const getDetail = (row: BenlaiOrder) => {
  if (row.order_detail) {
    try {
      return JSON.parse(row.order_detail as any)
    } catch {
      return row.order_detail
    }
  }
  return []
}

onMounted(fetchData)
</script>

<template>
  <div class="benlai-view" v-loading="loading">
    <div class="toolbar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.out_trade_no" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="toolbar">
      <el-button type="primary" @click="showAddDialog">新增订单</el-button>
      <el-button type="success" @click="showBatchDialog">批量导入</el-button>
    </div>

    <el-table :data="orders" stripe>
      <el-table-column prop="out_trade_no" label="商户订单号" width="180" />
      <el-table-column prop="order_id" label="接单方订单号" width="150" />
      <el-table-column prop="receive_contact" label="收货人" width="100" />
      <el-table-column prop="receive_phone" label="手机号" width="120" />
      <el-table-column prop="province" label="省" width="80" />
      <el-table-column prop="city" label="市" width="80" />
      <el-table-column prop="county" label="县区" width="80" />
      <el-table-column prop="receive_address" label="收货地址" min-width="150" show-overflow-tooltip />
      <el-table-column prop="order_price" label="订单金额" width="100">
        <template #default="{ row }">¥{{ row.order_price }}</template>
      </el-table-column>
      <el-table-column prop="ship_price" label="运费" width="80">
        <template #default="{ row }">¥{{ row.ship_price }}</template>
      </el-table-column>
      <el-table-column prop="order_status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTypeMap[row.order_status] || 'info'">
            {{ row.order_status_remark || row.order_status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="verification_code" label="验证码" width="90">
        <template #default="{ row }">
          <span class="code">{{ row.verification_code }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="verified" label="已验证" width="80">
        <template #default="{ row }">
          <el-tag :type="row.verified ? 'success' : 'info'">
            {{ row.verified ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
      style="margin-top: 20px; justify-content: flex-end"
    />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
      <template v-if="!isBatchCreate">
        <el-form :model="form" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="商户订单号" required>
                <el-input v-model="form.out_trade_no" placeholder="请输入订单号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="接单方订单号">
                <el-input v-model="form.order_id" placeholder="可选" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="收货人">
                <el-input v-model="form.receive_contact" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号">
                <el-input v-model="form.receive_phone" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="省">
                <el-input v-model="form.province" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="市">
                <el-input v-model="form.city" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="县区">
                <el-input v-model="form.county" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="收货地址">
            <el-input v-model="form.receive_address" />
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="订单金额">
                <el-input-number v-model="form.order_price" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="运费">
                <el-input-number v-model="form.ship_price" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="订单状态">
                <el-select v-model="form.order_status" style="width: 100%">
                  <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="订单详情">
            <el-input v-model="form.order_detail" type="textarea" :rows="3" placeholder='JSON格式，如：[{"product_id":"P001","product_name":"商品","quantity":1,"price":100}]' />
          </el-form-item>
        </el-form>
      </template>
      <template v-else>
        <el-form>
          <el-form-item label="订单JSON">
            <el-input v-model="batchData" type="textarea" :rows="15" placeholder='请输入JSON数组格式的订单数据，如：[{"out_trade_no":"123","receive_phone":"138..."},...]' />
          </el-form-item>
          <el-alert type="info" :closable="false" style="margin-top: 10px">
            请确保JSON格式正确，每个订单的 out_trade_no 必须唯一
          </el-alert>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.benlai-view { padding: 20px; }
.toolbar { margin-bottom: 20px; }
.code { font-family: monospace; font-weight: bold; color: #409eff; }
</style>
