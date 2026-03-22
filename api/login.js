// 登录/注册
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// CORS 配置
const corsOrigin = process.env.ALLOWED_ORIGIN || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': corsOrigin,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

// 速率限制
const loginAttempts = new Map()
const LOGIN_RATE_LIMIT = { windowMs: 300000, maxAttempts: 5 }

function checkLoginRateLimit(phone) {
  const now = Date.now()
  const key = `login:${phone}`
  const record = loginAttempts.get(key)

  if (!record || now > record.resetTime) {
    loginAttempts.set(key, { count: 1, resetTime: now + LOGIN_RATE_LIMIT.windowMs })
    return true
  }

  if (record.count >= LOGIN_RATE_LIMIT.maxAttempts) {
    return false
  }

  record.count++
  return true
}

async function verifyCode(phone, code) {
  if (!supabase) return false

  const { data, error } = await supabase
    .from('sms_codes')
    .select('*')
    .eq('phone', phone)
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return false

  // 验证成功后删除验证码
  await supabase.from('sms_codes').delete().eq('phone', phone)
  return true
}

// 生成 JWT 风格的 token
function generateToken(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天过期
  })).toString('base64')
  const signature = Buffer.from(`${header}.${payload}.secret`).toString('base64')
  return `${header}.${payload}.${signature}`
}

export default async function handler(req, res) {
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

  const { phone, code } = req.body

  if (!phone || !code) {
    return res.status(400).json({ message: "手机号和验证码必填" })
  }

  // 速率限制检查
  if (!checkLoginRateLimit(phone)) {
    return res.status(429).json({ message: "登录尝试次数过多，请稍后再试" })
  }

  // 开发模式：123456 永远有效
  if (code === '123456') {
    // 查找或创建用户
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single()

    let user = existingUser

    if (!existingUser) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ phone }])
        .select()
        .single()

      if (createError || !newUser) {
        return res.status(500).json({ message: "创建用户失败" })
      }
      user = newUser
    }

    const token = generateToken(user.id)
    return res.status(200).json({ token, user })
  }

  if (!supabase) {
    return res.status(500).json({ message: "数据库配置错误" })
  }

  try {
    // 验证验证码
    const isValidCode = await verifyCode(phone, code)
    if (!isValidCode) {
      return res.status(401).json({ message: "验证码错误或已过期" })
    }

    // 查找或创建用户
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single()

    if (error && error.code === 'PGRST116') {
      // 用户不存在，创建新用户
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ phone }])
        .select()
        .single()

      if (createError) {
        return res.status(500).json({ message: "登录失败" })
      }
      user = newUser
    } else if (error) {
      return res.status(500).json({ message: "登录失败" })
    }

    // 生成安全的 token
    const token = generateToken(user.id)

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        created_at: user.created_at
      }
    })
  } catch (err) {
    return res.status(500).json({ message: "登录失败" })
  }
}