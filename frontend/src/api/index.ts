import axios, { AxiosResponse } from 'axios'

const API_BASE_URL = '/api'  // 使用相对路径，走 vite 代理

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器 - 处理错误，直接返回data
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// ==================== API 接口 ====================

// 发送验证码
export const sendCode = (phone: string) => {
  return api.post('/send-code', { phone })
}

// 登录
export const login = (phone: string, code: string, nickname?: string) => {
  return api.post('/login', { phone, code, nickname })
}

// 验证订单
export const verifyOrder = (orderNo: string) => {
  return api.post('/verify-order', { order_no: orderNo })
}

// 分配田地
export const allocateLand = (userId: string, orderNo: string, token: string) => {
  return api.post('/allocate-land', { user_id: userId, order_no: orderNo }, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// 获取用户信息
export const getUserInfo = (userId: string) => {
  return api.get(`/user/${userId}`)
}

// 获取用户田地列表
export const getUserFarms = (userId: string) => {
  return api.get(`/farms/${userId}`)
}

// 获取权益列表
export const getRights = () => {
  return api.get('/rights')
}

export default api
