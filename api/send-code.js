// 发送验证码
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// CORS 配置 - 生产环境应指定具体域名
const corsOrigin = process.env.ALLOWED_ORIGIN || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': corsOrigin,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

// 速率限制配置
const RATE_LIMIT = {
  windowMs: 60000, // 1分钟窗口
  maxRequests: 3   // 最多3次请求
}

// 内存存储速率限制（生产环境建议用 Redis）
const rateLimitStore = new Map()

function checkRateLimit(phone) {
  const now = Date.now()
  const key = `send-code:${phone}`

  const record = rateLimitStore.get(key)

  if (!record) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs })
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 }
  }

  if (now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs })
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 }
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: RATE_LIMIT.maxRequests - record.count }
}

// 清理过期的速率限制记录
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000)

// 短信服务
const SMS_CONFIG = {
  provider: process.env.SMS_PROVIDER || 'aliyun',
  aliyun: {
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
    signName: process.env.ALIYUN_SMS_SIGN_NAME,
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE
  }
}

function generateCode() {
  return Math.random().toString().substring(2, 8)
}

async function storeCode(phone, code) {
  if (!supabase) return

  await supabase
    .from('sms_codes')
    .delete()
    .eq('phone', phone)

  await supabase
    .from('sms_codes')
    .insert([{
      phone,
      code,
      expires_at: new Date(Date.now() + 300000).toISOString()
    }])
}

async function sendSMSAliyun(phone, code) {
  const { aliyun } = SMS_CONFIG

  if (!aliyun.accessKeyId || !aliyun.accessKeySecret || !aliyun.signName || !aliyun.templateCode) {
    return true
  }
  return true
}

async function sendSMS(phone) {
  const code = generateCode()
  await storeCode(phone, code)

  if (SMS_CONFIG.provider === 'aliyun') {
    return sendSMSAliyun(phone, code)
  }

  return true
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value)
    })
    return res.status(200).json({})
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { phone } = req.body

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ message: "手机号格式不正确" })
  }

  // 速率限制检查
  const rateLimit = checkRateLimit(phone)
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining)

  if (!rateLimit.allowed) {
    return res.status(429).json({
      message: "请求过于频繁，请稍后再试",
      retryAfter: Math.ceil(RATE_LIMIT.windowMs / 1000)
    })
  }

  try {
    await sendSMS(phone)
    return res.status(200).json({ message: "验证码已发送" })
  } catch (err) {
    console.error('[SMS] 发送失败:', err)
    return res.status(500).json({ message: "短信发送失败" })
  }
}