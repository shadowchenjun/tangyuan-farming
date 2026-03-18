<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="title">汤原农文旅云认养平台</h1>
      <p class="subtitle">我在汤原有分田</p>
      
      <el-form ref="formRef" :model="form" :rules="rules" class="login-form">
        <el-form-item prop="phone">
          <el-input 
            v-model="form.phone" 
            placeholder="请输入手机号"
            size="large"
            :prefix-icon="Phone"
          />
        </el-form-item>
        
        <el-form-item prop="code">
          <el-input 
            v-model="form.code" 
            placeholder="请输入验证码"
            size="large"
            :prefix-icon="Lock"
          >
            <template #append>
              <el-button :disabled="countdown > 0" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="nickname">
          <el-input 
            v-model="form.nickname" 
            placeholder="请输入昵称（2-10字符）"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-checkbox v-model="form.agree">
          我已阅读并同意相关条款
        </el-checkbox>
        
        <el-button 
          type="primary" 
          size="large" 
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </el-button>
        
        <el-button size="large" class="login-btn mobile-btn">
          移动认证一键登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Phone, Lock, User } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { sendCode as sendCodeApi, login as loginApi } from '../api'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const countdown = ref(0)

const form = reactive({
  phone: '',
  code: '',
  nickname: '',
  agree: false
})

const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 10, message: '昵称2-10字符', trigger: 'blur' }
  ]
}

const sendCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.warning('请先输入正确的手机号')
    return
  }
  
  try {
    await sendCodeApi(form.phone)
    ElMessage.success('验证码已发送')
    
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (error: any) {
    ElMessage.error(error.message || '发送失败')
  }
}

const handleLogin = async () => {
  if (!form.agree) {
    ElMessage.warning('请先阅读并同意相关条款')
    return
  }
  
  await formRef.value?.validate()
  loading.value = true
  
  try {
    const res = await loginApi(form.phone, form.code, form.nickname)
    
    // 保存用户信息和token
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    
    ElMessage.success('登录成功')
    router.push('/credentials')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '登录失败，请检查验证码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.title {
  text-align: center;
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-bottom: 32px;
}

.login-form {
  margin-top: 24px;
}

.login-btn {
  width: 100%;
  margin-top: 16px;
  height: 48px;
  font-size: 16px;
}

.mobile-btn {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.mobile-btn:hover {
  background: #f0f0ff;
}
</style>
