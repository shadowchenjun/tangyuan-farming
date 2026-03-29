import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载环境变量 - 支持多种路径
const envPaths = [
  join(__dirname, '../.env'),           // 项目根目录
  join(__dirname, '../../.env'),         // 上两级目录
  join(__dirname, '.env'),              // 当前目录
  process.cwd() + '/.env'              // 当前工作目录
]

for (const envPath of envPaths) {
  try {
    config({ path: envPath })
    break
  } catch (e) {
    continue
  }
}

const app = express()
const PORT = process.env.PORT || 8000

// CORS 配置
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))
app.use(express.json())

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('[ERROR] 缺少 Supabase 配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// 速率限制存储
const rateLimitStore = new Map()
const RATE_LIMIT = { windowMs: 60000, maxRequests: 3 }
const LOGIN_RATE_LIMIT = { windowMs: 300000, maxAttempts: 5 }

function checkRateLimit(key, limit) {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.windowMs })
    return { allowed: true, remaining: limit.maxRequests - 1 }
  }

  if (record.count >= limit.maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: limit.maxRequests - record.count }
}

// 清理过期记录
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000)

// 生成 JWT Token
function generateToken(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  })).toString('base64')
  const signature = Buffer.from(`${header}.${payload}.${JWT_SECRET}`).toString('base64')
  return `${header}.${payload}.${signature}`
}

// 验证 JWT Token
function verifyToken(token) {
  try {
    const [header, payload, signature] = token.split('.')
    const expectedSignature = Buffer.from(`${header}.${payload}.${JWT_SECRET}`).toString('base64')
    if (signature !== expectedSignature) return null

    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
    if (decoded.exp < Date.now()) return null

    return decoded.sub
  } catch {
    return null
  }
}

// 短信配置
const SMS_CONFIG = {
  provider: process.env.SMS_PROVIDER || 'aliyun',
  aliyun: {
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
    signName: process.env.ALIYUN_SMS_SIGN_NAME,
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE
  }
}

// 开发模式固定验证码
function generateCode() {
  if (process.env.NODE_ENV === 'development') {
    return '123456'
  }
  return Math.random().toString().substring(2, 8)
}

async function storeCode(phone, code) {
  await supabase.from('sms_codes').delete().eq('phone', phone)
  await supabase.from('sms_codes').insert([{
    phone,
    code,
    expires_at: new Date(Date.now() + 300000).toISOString()
  }])
}

async function sendSMSAliyun(phone, code) {
  const { aliyun } = SMS_CONFIG

  if (!aliyun.accessKeyId || !aliyun.accessKeySecret) {
    return true
  }
  return true
}

async function verifyCode(phone, code) {
  const { data, error } = await supabase
    .from('sms_codes')
    .select('*')
    .eq('phone', phone)
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return false

  await supabase.from('sms_codes').delete().eq('phone', phone)
  return true
}

// ==================== 数据库初始化 ====================

async function initDatabase() {

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(20) NOT NULL UNIQUE,
      nickname VARCHAR(50),
      avatar VARCHAR(500),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  const alterUsersTable = `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS nickname VARCHAR(50),
    ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);
  `

  const createUpdateUserNicknameFunc = `
    CREATE OR REPLACE FUNCTION update_user_nickname(user_id UUID, new_nickname VARCHAR(50))
    RETURNS SETOF users AS $$
    BEGIN
      UPDATE users SET nickname = new_nickname WHERE id = user_id;
      RETURN QUERY SELECT * FROM users WHERE id = user_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  const createFarmsTable = `
    CREATE TABLE IF NOT EXISTS farms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      land_no VARCHAR(50) NOT NULL UNIQUE,
      area DECIMAL(10,2) DEFAULT 10,
      address VARCHAR(200) DEFAULT '黑龙江省汤原县胜利乡',
      year INTEGER NOT NULL,
      ddc_id VARCHAR(100),
      order_no VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  const createSmsCodesTable = `
    CREATE TABLE IF NOT EXISTS sms_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(20) NOT NULL,
      code VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  // 管理员表
  const createAdminRolesTable = `
    CREATE TABLE IF NOT EXISTS admin_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) NOT NULL UNIQUE,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      permissions TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  const createAdminUsersTable = `
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(100),
      email VARCHAR(100),
      phone VARCHAR(20),
      role_name VARCHAR(50),
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  const createLandParcelsTable = `
    CREATE TABLE IF NOT EXISTS land_parcels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      area DECIMAL(10,2) NOT NULL,
      location VARCHAR(200),
      status VARCHAR(20) DEFAULT 'available',
      type VARCHAR(20) DEFAULT 'farm',
      description TEXT,
      image_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  const createAdoptionCategoriesTable = `
    CREATE TABLE IF NOT EXISTS adoption_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      icon VARCHAR(50),
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  const createAdoptionConfigsTable = `
    CREATE TABLE IF NOT EXISTS adoption_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id UUID REFERENCES adoption_categories(id),
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      unit VARCHAR(20) DEFAULT 'year',
      duration_days INTEGER NOT NULL,
      benefits TEXT,
      images TEXT,
      is_active BOOLEAN DEFAULT true,
      stock INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  const createAdoptionOrdersTable = `
    CREATE TABLE IF NOT EXISTS adoption_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_no VARCHAR(50) NOT NULL UNIQUE,
      user_id UUID REFERENCES users(id),
      config_id UUID REFERENCES adoption_configs(id),
      land_parcel_id UUID REFERENCES land_parcels(id),
      quantity INTEGER DEFAULT 1,
      total_amount DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      harvest_info TEXT,
      remark TEXT,
      phone VARCHAR(20),
      rice_qty INTEGER DEFAULT 100,
      area DECIMAL(10,2) DEFAULT 10,
      address TEXT,
      year INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  // 为已存在的 adoption_orders 表添加缺失的列
  const alterAdoptionOrdersTable = `
    ALTER TABLE adoption_orders
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS rice_qty INTEGER DEFAULT 100,
    ADD COLUMN IF NOT EXISTS area DECIMAL(10,2) DEFAULT 10,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS year INTEGER;
  `

  const createDeviceTypesTable = `
    CREATE TABLE IF NOT EXISTS device_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      icon VARCHAR(50),
      description TEXT,
      specifications TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  const createDevicesTable = `
    CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      device_type_id UUID REFERENCES device_types(id),
      land_parcel_id UUID REFERENCES land_parcels(id),
      location VARCHAR(200),
      status VARCHAR(20) DEFAULT 'online',
      last_active TIMESTAMP WITH TIME ZONE,
      config TEXT,
      firmware_version VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  const createTraceabilityConfigsTable = `
    CREATE TABLE IF NOT EXISTS traceability_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  const createTraceabilityNodesTable = `
    CREATE TABLE IF NOT EXISTS traceability_nodes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      config_id UUID REFERENCES traceability_configs(id),
      name VARCHAR(100) NOT NULL,
      node_type VARCHAR(50) NOT NULL,
      description TEXT,
      icon VARCHAR(50),
      sort_order INTEGER DEFAULT 0,
      data_fields TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  const createCouponsTable = `
    CREATE TABLE IF NOT EXISTS coupons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      type VARCHAR(20) DEFAULT 'discount',
      discount_value DECIMAL(10,2) NOT NULL,
      min_amount DECIMAL(10,2) DEFAULT 0,
      max_discount DECIMAL(10,2),
      total_count INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      per_user_limit INTEGER DEFAULT 1,
      valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
      valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
      applicable_products TEXT,
      applicable_categories TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  const createSystemConfigsTable = `
    CREATE TABLE IF NOT EXISTS system_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key VARCHAR(100) NOT NULL UNIQUE,
      value TEXT,
      type VARCHAR(20) DEFAULT 'string',
      group_name VARCHAR(50) DEFAULT 'general',
      description VARCHAR(200),
      is_public BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  const createOperationLogsTable = `
    CREATE TABLE IF NOT EXISTS admin_operation_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_user_id UUID REFERENCES admin_users(id),
      action VARCHAR(100) NOT NULL,
      resource VARCHAR(50) NOT NULL,
      resource_id VARCHAR(100),
      detail TEXT,
      ip_address VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  try {
    await supabase.rpc('exec_sql', { sql: createUsersTable })
    await supabase.rpc('exec_sql', { sql: alterUsersTable })
    await supabase.rpc('exec_sql', { sql: createUpdateUserNicknameFunc })
    await supabase.rpc('exec_sql', { sql: createFarmsTable })
    await supabase.rpc('exec_sql', { sql: createSmsCodesTable })
    await supabase.rpc('exec_sql', { sql: createAdminRolesTable })
    await supabase.rpc('exec_sql', { sql: createAdminUsersTable })
    await supabase.rpc('exec_sql', { sql: createLandParcelsTable })
    await supabase.rpc('exec_sql', { sql: createAdoptionCategoriesTable })
    await supabase.rpc('exec_sql', { sql: createAdoptionConfigsTable })
    await supabase.rpc('exec_sql', { sql: createAdoptionOrdersTable })
    await supabase.rpc('exec_sql', { sql: alterAdoptionOrdersTable })
    await supabase.rpc('exec_sql', { sql: createDeviceTypesTable })
    await supabase.rpc('exec_sql', { sql: createDevicesTable })
    await supabase.rpc('exec_sql', { sql: createTraceabilityConfigsTable })
    await supabase.rpc('exec_sql', { sql: createTraceabilityNodesTable })
    await supabase.rpc('exec_sql', { sql: createCouponsTable })
    await supabase.rpc('exec_sql', { sql: createSystemConfigsTable })
    await supabase.rpc('exec_sql', { sql: createOperationLogsTable })

    // 创建默认管理员
    await createDefaultAdmin()
  } catch (error) {
    // 数据库初始化错误，忽略
  }
}

async function createDefaultAdmin() {
  try {
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', 'admin')
      .single()

    if (!existing) {
      await supabase.from('admin_users').insert([{
        username: 'admin',
        password: 'admin123456',
        full_name: '系统管理员',
        email: 'admin@tangyuan.com',
        role_name: '超级管理员',
        is_active: true
      }])
    }
  } catch (error) {
    // 管理员检查错误，忽略
  }
}

// ==================== API接口 ====================

app.get('/', (req, res) => {
  res.json({ message: "汤原农文旅云认养平台API", version: "2.0.0", storage: "Supabase" })
})

// 发送验证码
app.post('/api/send-code', async (req, res) => {
  const { phone } = req.body

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ message: "手机号格式不正确" })
  }

  const rateLimit = checkRateLimit(`send-code:${phone}`, RATE_LIMIT)
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining)

  if (!rateLimit.allowed) {
    return res.status(429).json({
      message: "请求过于频繁，请稍后再试",
      retryAfter: Math.ceil(RATE_LIMIT.windowMs / 1000)
    })
  }

  const code = generateCode()
  await storeCode(phone, code)

  if (SMS_CONFIG.provider === 'aliyun') {
    await sendSMSAliyun(phone, code)
  }

  res.json({ message: "验证码已发送" })
})

// 登录/注册
app.post('/api/login', async (req, res) => {
  const { phone, code } = req.body

  if (!phone || !code) {
    return res.status(400).json({ message: "手机号和验证码必填" })
  }

  const rateLimit = checkRateLimit(`login:${phone}`, LOGIN_RATE_LIMIT)
  if (!rateLimit.allowed) {
    return res.status(429).json({ message: "登录尝试次数过多，请稍后再试" })
  }

  // 开发模式：未配置真实短信平台或使用占位符时，跳过验证码验证
  const aliyunId = process.env.ALIYUN_ACCESS_KEY_ID || ''
  const aliyunKey = process.env.ALIYUN_ACCESS_KEY_SECRET || ''
  const hasRealSMSConfig = aliyunId.includes('your_') === false && aliyunKey.includes('your_') === false
  let isValidCode = false
  if (!hasRealSMSConfig && code === '123456') {
    isValidCode = true
  } else {
    isValidCode = await verifyCode(phone, code)
  }
  if (!isValidCode) {
    return res.status(401).json({ message: "验证码错误或已过期" })
  }

  try {
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single()

    if (error && error.code === 'PGRST116') {
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

    const token = generateToken(user.id)

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        created_at: user.created_at
      }
    })
  } catch (err) {
    res.status(500).json({ message: "登录失败" })
  }
})

// 验证订单
app.post('/api/verify-order', async (req, res) => {
  const { order_no, phone, rice_qty, area, address } = req.body

  if (!order_no) {
    return res.json({ valid: false, message: "订单编号不能为空" })
  }

  try {
    // 首先尝试查询本来生活订单（通过 out_trade_no 后6位 / verification_code）
    const { data: benlaiOrder } = await supabase
      .from('benlai_orders')
      .select('*')
      .eq('verification_code', order_no)
      .single()

    if (benlaiOrder) {
      // 找到了本来生活订单，返回订单信息
      return res.json({
        valid: true,
        order: {
          id: benlaiOrder.id,
          order_no: benlaiOrder.out_trade_no,
          phone: benlaiOrder.receive_phone,
          contact: benlaiOrder.receive_contact,
          province: benlaiOrder.province,
          city: benlaiOrder.city,
          county: benlaiOrder.county,
          address: benlaiOrder.receive_address,
          order_price: parseFloat(benlaiOrder.order_price),
          ship_price: parseFloat(benlaiOrder.ship_price),
          order_status: benlaiOrder.order_status,
          order_status_remark: benlaiOrder.order_status_remark,
          order_detail: benlaiOrder.order_detail ? JSON.parse(benlaiOrder.order_detail) : [],
          source: 'benlai',
          year: new Date().getFullYear()
        }
      })
    }

    // 如果本来生活订单没找到，返回无效
    // 注意：现在只支持本来生活订单验证，不再自动创建本地订单
    return res.json({
      valid: false,
      message: "订单编号无效，请确认后重新输入"
    })
  } catch (err) {
    console.error('验证订单异常:', err)
    res.status(500).json({ valid: false, message: "服务器错误" })
  }
})

// 分配田地
app.post('/api/allocate-land', async (req, res) => {
  const { user_id, order_no } = req.body
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "未授权" })
  }

  const token = authHeader.split(' ')[1]
  const tokenUserId = verifyToken(token)
  if (tokenUserId !== user_id) {
    return res.status(401).json({ message: "Token无效" })
  }

  if (!user_id) {
    return res.status(401).json({ message: "用户不存在" })
  }

  if (!order_no) {
    return res.status(400).json({ message: "订单号必填" })
  }

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return res.status(401).json({ message: "用户不存在" })
    }

    // 1. 获取本来生活订单信息
    const { data: benlaiOrder, error: orderError } = await supabase
      .from('benlai_orders')
      .select('*')
      .eq('out_trade_no', order_no)
      .single()

    if (orderError || !benlaiOrder) {
      return res.status(404).json({ message: "订单不存在" })
    }

    // 2. 从订单详情计算总数量，计算认养亩数 (quantity / 20)
    let totalQuantity = 0
    try {
      let orderDetail = benlaiOrder.order_detail
      // 处理双重JSON编码
      if (typeof orderDetail === 'string') {
        orderDetail = JSON.parse(orderDetail)
      }
      // 如果解析后还是字符串，再解析一次
      if (typeof orderDetail === 'string') {
        orderDetail = JSON.parse(orderDetail)
      }
      if (Array.isArray(orderDetail)) {
        totalQuantity = orderDetail.reduce((sum, item) => sum + (item.quantity || 0), 0)
      }
    } catch (e) {
      console.error('解析订单详情失败:', e)
      totalQuantity = 0
    }
    const calculatedArea = totalQuantity > 0 ? totalQuantity / 20 : 10

    // 3. 从土地管理表获取一个可用的土地
    const { data: availableLands, error: landError } = await supabase
      .from('land_parcels')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: true })
      .limit(1)

    if (landError || !availableLands || availableLands.length === 0) {
      return res.status(400).json({ message: "暂无可用土地，请联系管理员" })
    }

    const selectedLand = availableLands[0]

    // 4. 生成田地编号 = TY-年份-订单尾号后6位
    const year = new Date().getFullYear()
    const orderSuffix = order_no.slice(-6).padStart(6, '0')
    const landNo = `TY-${year}-${orderSuffix}`

    // 5. 生成DDC ID
    const ddcId = `0x${Math.random().toString(36).substring(2, 14)}`

    // 6. 创建农场记录
    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .insert([{
        user_id,
        land_no: landNo,                      // 使用订单尾号生成的编号
        area: calculatedArea,                  // 使用计算的面积
        address: selectedLand.location,       // 使用土地管理的地址
        year,
        ddc_id: ddcId,
        order_no: order_no
      }])
      .select()
      .single()

    if (farmError) {
      console.error('分配田地失败:', farmError)
      return res.status(500).json({ message: "分配失败" })
    }

    // 7. 更新土地状态为已分配
    await supabase
      .from('land_parcels')
      .update({ status: 'allocated' })
      .eq('id', selectedLand.id)

    res.json({
      farm,
      land: {
        code: landNo,
        name: selectedLand.name,
        location: selectedLand.location,
        area: calculatedArea
      }
    })
  } catch (err) {
    console.error('分配田地异常:', err)
    res.status(500).json({ message: "分配失败" })
  }
})

// 获取用户信息
app.get('/api/user/:userId', async (req, res) => {
  const { userId } = req.params
  const authHeader = req.headers.authorization

  if (authHeader) {
    const token = authHeader.split(' ')[1]
    const tokenUserId = verifyToken(token)
    if (tokenUserId !== userId) {
      return res.status(401).json({ error: "无权访问" })
    }
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return res.status(404).json({ error: "用户不存在" })
    }

    res.json(user)
  } catch (err) {
    res.status(500).json({ error: "查询失败" })
  }
})

// 更新用户信息
app.put('/api/user/:userId', async (req, res) => {
  const { userId } = req.params
  const { nickname, avatar } = req.body
  const authHeader = req.headers.authorization

  if (authHeader) {
    const token = authHeader.split(' ')[1]
    const tokenUserId = verifyToken(token)
    if (tokenUserId !== userId) {
      return res.status(401).json({ error: "无权访问" })
    }
  }

  try {
    const updateData = {}
    if (nickname !== undefined) updateData.nickname = nickname
    if (avatar !== undefined) updateData.avatar = avatar

    if (Object.keys(updateData).length === 0) {
      return res.json({ error: "没有要更新的字段" })
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('更新用户失败:', error)
      // 如果是因为列不存在，尝试用 raw 更新
      if (error.code === 'PGRST204') {
        return res.status(400).json({ error: "用户表缺少昵称列，请联系管理员" })
      }
      return res.status(500).json({ error: "更新失败" })
    }

    res.json(user)
  } catch (err) {
    res.status(500).json({ error: "更新失败" })
  }
})

// 获取用户田地
app.get('/api/farms/:userId', async (req, res) => {
  const { userId } = req.params

  try {
    const { data: farms, error } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: "查询失败" })
    }

    res.json({ farms: farms || [] })
  } catch (err) {
    res.status(500).json({ error: "查询失败" })
  }
})

// 获取权益列表
app.get('/api/rights', (req, res) => {
  const rights = [
    { id: "1", title: "优质大米", description: "每年可获得认养面积对应的新鲜大米", icon: "🌾", supplier: "本来生活" },
    { id: "2", title: "实时监控", description: "通过物联网设备实时查看田地生长情况", icon: "📷", supplier: "汤原县政府" },
    { id: "3", title: "溯源查询", description: "全程追溯农产品生长、加工、运输过程", icon: "🔍", supplier: "区块链溯源平台" },
    { id: "4", title: "线下活动", description: "优先参与汤原县线下农旅活动", icon: "🎁", supplier: "文旅创新中心" },
    { id: "5", title: "民宿优惠", description: "合作民宿享受专属折扣", icon: "🏨", supplier: "本来生活" },
    { id: "6", title: "景区门票", description: "汤原县景区免费或优惠门票", icon: "🎫", supplier: "文旅创新中心" },
  ]
  res.json({ rights })
})

// ==================== 管理员API ====================

// 管理员注册（仅用于初始化）
app.post('/api/admin/setup', async (req, res) => {
  try {
    // 尝试插入管理员
    const { data, error } = await supabase
      .from('admin_users')
      .insert([{
        username: 'admin',
        password: 'admin123456',
        full_name: '系统管理员',
        email: 'admin@tangyuan.com',
        role_name: '超级管理员',
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.json({ message: "管理员已存在" })
      }
      return res.status(500).json({ message: "创建失败: " + error.message })
    }

    res.json({ message: "管理员创建成功", admin: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 管理员登录
app.post('/api/admin/auth/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: "用户名和密码必填" })
  }

  try {
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !admin) {
      return res.status(401).json({ message: "用户名或密码错误" })
    }

    // 简单密码验证（生产环境应使用bcrypt）
    if (admin.password !== password) {
      return res.status(401).json({ message: "用户名或密码错误" })
    }

    if (!admin.is_active) {
      return res.status(401).json({ message: "账号已被禁用" })
    }

    const token = generateToken(admin.id)

    res.json({
      access_token: token,
      token_type: 'bearer',
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role_name
      }
    })
  } catch (err) {
    res.status(500).json({ message: "登录失败" })
  }
})

// 获取管理员信息
app.get('/api/admin/auth/profile', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "未授权" })
  }

  const token = authHeader.split(' ')[1]
  const tokenUserId = verifyToken(token)
  if (!tokenUserId) {
    return res.status(401).json({ message: "Token无效" })
  }

  try {
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', tokenUserId)
      .single()

    if (error || !admin) {
      return res.status(404).json({ message: "管理员不存在" })
    }

    res.json({
      id: admin.id,
      username: admin.username,
      full_name: admin.full_name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role_name,
      last_login: admin.last_login
    })
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 登出
app.post('/api/admin/auth/logout', (req, res) => {
  res.json({ message: "登出成功" })
})

// 管理员中间件
async function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "未授权" })
  }

  const token = authHeader.split(' ')[1]
  const tokenUserId = verifyToken(token)
  if (!tokenUserId) {
    return res.status(401).json({ message: "Token无效" })
  }

  try {
    const { data: admin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', tokenUserId)
      .single()

    if (!admin || !admin.is_active) {
      return res.status(401).json({ message: "管理员不存在或已禁用" })
    }

    req.admin = admin
    next()
  } catch (err) {
    return res.status(401).json({ message: "认证失败" })
  }
}

// 获取看板统计
app.get('/api/admin/dashboard/stats', adminAuth, async (req, res) => {
  try {
    // 用户统计
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // 土地统计
    const { data: lands } = await supabase.from('land_parcels').select('*')
    const totalLand = lands?.length || 0
    const availableLand = lands?.filter(l => l.status === 'available').length || 0

    // 认养订单统计
    const { count: totalAdoptionOrders } = await supabase
      .from('adoption_orders')
      .select('*', { count: 'exact', head: true })
    const { data: activeAdoptions } = await supabase
      .from('adoption_orders')
      .select('*')
      .eq('status', 'active')

    // 设备统计
    const { data: devices } = await supabase.from('devices').select('*')
    const totalDevices = devices?.length || 0
    const onlineDevices = devices?.filter(d => d.status === 'online').length || 0

    res.json({
      users: { total: totalUsers || 0, new_today: 0, new_month: 0 },
      land: { total: totalLand, available: availableLand, rented: totalLand - availableLand },
      adoption_orders: { total: totalAdoptionOrders || 0, today: 0, pending: 0, active: activeAdoptions?.length || 0, revenue: 0 },
      rental_orders: { total: 0, today: 0, pending: 0, revenue: 0 },
      devices: { total: totalDevices, online: onlineDevices, offline: totalDevices - onlineDevices },
      products: { total: 0, categories: 0 }
    })
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 获取看板图表数据
app.get('/api/admin/dashboard/charts', adminAuth, async (req, res) => {
  const { days = 7 } = req.query

  try {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - parseInt(days) + 1)

    // 生成每日数据
    const daily_orders = []
    const daily_revenue = []
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      daily_orders.push({
        date: date.toISOString().slice(0, 10),
        adoption: 0,
        rental: 0,
        total: 0
      })
      daily_revenue.push({
        date: date.toISOString().slice(0, 10),
        adoption: 0,
        rental: 0,
        total: 0
      })
    }

    // 土地使用情况
    const { data: lands } = await supabase.from('land_parcels').select('status')
    const land_usage = [
      { status: 'available', count: lands?.filter(l => l.status === 'available').length || 0 },
      { status: 'rented', count: lands?.filter(l => l.status === 'rented').length || 0 }
    ]

    // 设备状态
    const { data: devices } = await supabase.from('devices').select('status')
    const device_status = [
      { status: 'online', count: devices?.filter(d => d.status === 'online').length || 0 },
      { status: 'offline', count: devices?.filter(d => d.status === 'offline').length || 0 }
    ]

    // 认养分类统计
    const { data: categoryData } = await supabase.from('adoption_configs').select('name')
    const category_data = categoryData?.map(c => ({ name: c.name, count: 0 })) || []

    res.json({
      daily_orders,
      daily_revenue,
      land_usage,
      device_status,
      category_data
    })
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 获取土地列表
app.get('/api/admin/land/parcels', adminAuth, async (req, res) => {
  const { status, type, keyword, page = 1, page_size = 20 } = req.query

  try {
    let query = supabase.from('land_parcels').select('*', { count: 'exact' })

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)
    if (keyword) query = query.or(`name.ilike.%${keyword}%,code.ilike.%${keyword}%`)

    const { data, count } = await query
      .range((page - 1) * page_size, page * page_size - 1)
      .order('created_at', { ascending: false })

    res.json({ total: count || 0, page: parseInt(page), page_size: parseInt(page_size), items: data || [] })
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 创建土地
app.post('/api/admin/land/parcels', adminAuth, async (req, res) => {
  const { name, code, area, location, type, description, image_url } = req.body

  if (!name || !code || !area) {
    return res.status(400).json({ message: "名称、编号、面积必填" })
  }

  try {
    const { data, error } = await supabase
      .from('land_parcels')
      .insert([{ name, code, area, location, type: type || 'farm', description, image_url, status: 'available' }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(400).json({ message: "土地编号已存在" })
      return res.status(500).json({ message: "创建失败" })
    }

    res.json({ message: "创建成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 更新土地
app.put('/api/admin/land/parcels/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { name, area, location, type, description, image_url, status } = req.body

  try {
    const updateData = {}
    if (name) updateData.name = name
    if (area) updateData.area = area
    if (location) updateData.location = location
    if (type) updateData.type = type
    if (description) updateData.description = description
    if (image_url) updateData.image_url = image_url
    if (status) updateData.status = status

    const { data, error } = await supabase
      .from('land_parcels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ message: "更新失败" })

    res.json({ message: "更新成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 删除土地
app.delete('/api/admin/land/parcels/:id', adminAuth, async (req, res) => {
  const { id } = req.params

  try {
    const { error } = await supabase
      .from('land_parcels')
      .delete()
      .eq('id', id)

    if (error) return res.status(500).json({ message: "删除失败" })

    res.json({ message: "删除成功" })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 获取租地订单
app.get('/api/admin/land/rental-orders', adminAuth, async (req, res) => {
  const { status, page = 1, page_size = 20 } = req.query

  try {
    let query = supabase.from('rental_orders').select('*', { count: 'exact' })

    if (status) query = query.eq('status', status)

    const { data, count } = await query
      .range((page - 1) * page_size, page * page_size - 1)
      .order('created_at', { ascending: false })

    res.json({ total: count || 0, page: parseInt(page), page_size: parseInt(page_size), items: data || [] })
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 获取认养订单
app.get('/api/admin/adoption/orders', adminAuth, async (req, res) => {
  const { status, page = 1, page_size = 20 } = req.query

  try {
    let query = supabase.from('adoption_orders').select('*', { count: 'exact' })

    if (status) query = query.eq('status', status)

    const { data, count } = await query
      .range((page - 1) * page_size, page * page_size - 1)
      .order('created_at', { ascending: false })

    res.json({ total: count || 0, page: parseInt(page), page_size: parseInt(page_size), items: data || [] })
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 获取认养分类
app.get('/api/admin/adoption/categories', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('adoption_categories')
      .select('*')
      .order('sort_order')

    res.json(data || [])
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 获取认养配置
app.get('/api/admin/adoption/configs', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('adoption_configs')
      .select('*')
      .order('created_at', { ascending: false })

    res.json(data || [])
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 创建认养分类
app.post('/api/admin/adoption/categories', adminAuth, async (req, res) => {
  const { name, code, icon, description, sort_order } = req.body

  if (!name || !code) {
    return res.status(400).json({ message: "名称和代码必填" })
  }

  try {
    const { data, error } = await supabase
      .from('adoption_categories')
      .insert([{ name, code, icon, description, sort_order: sort_order || 0, is_active: true }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(400).json({ message: "分类代码已存在" })
      return res.status(500).json({ message: "创建失败" })
    }

    res.json({ message: "创建成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 创建认养配置
app.post('/api/admin/adoption/configs', adminAuth, async (req, res) => {
  const { category_id, name, price, duration_days, description, unit, benefits, stock } = req.body

  if (!category_id || !name || !price || !duration_days) {
    return res.status(400).json({ message: "分类、名称、价格、时长必填" })
  }

  try {
    const { data, error } = await supabase
      .from('adoption_configs')
      .insert([{
        category_id, name, price, duration_days,
        description, unit: unit || 'year',
        benefits: benefits ? JSON.stringify(benefits) : null,
        stock: stock || 0, is_active: true
      }])
      .select()
      .single()

    if (error) return res.status(500).json({ message: "创建失败" })

    res.json({ message: "创建成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 获取设备列表
app.get('/api/admin/device/devices', adminAuth, async (req, res) => {
  const { status, page = 1, page_size = 20 } = req.query

  try {
    let query = supabase.from('devices').select('*', { count: 'exact' })

    if (status) query = query.eq('status', status)

    const { data, count } = await query
      .range((page - 1) * page_size, page * page_size - 1)
      .order('created_at', { ascending: false })

    res.json({ total: count || 0, page: parseInt(page), page_size: parseInt(page_size), items: data || [] })
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 获取设备类型
app.get('/api/admin/device/types', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('device_types')
      .select('*')
      .order('created_at')

    res.json(data || [])
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 创建设备类型
app.post('/api/admin/device/types', adminAuth, async (req, res) => {
  const { name, code, icon, description } = req.body

  if (!name || !code) {
    return res.status(400).json({ message: "名称和代码必填" })
  }

  try {
    const { data, error } = await supabase
      .from('device_types')
      .insert([{ name, code, icon, description, is_active: true }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(400).json({ message: "类型代码已存在" })
      return res.status(500).json({ message: "创建失败" })
    }

    res.json({ message: "创建成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 创建设备
app.post('/api/admin/device/devices', adminAuth, async (req, res) => {
  const { name, code, device_type_id, location, land_parcel_id, firmware_version } = req.body

  if (!name || !code || !device_type_id) {
    return res.status(400).json({ message: "名称、编号、类型必填" })
  }

  try {
    const { data, error } = await supabase
      .from('devices')
      .insert([{
        name, code, device_type_id, location,
        land_parcel_id, firmware_version,
        status: 'online'
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(400).json({ message: "设备编号已存在" })
      return res.status(500).json({ message: "创建失败" })
    }

    res.json({ message: "创建成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 获取用户列表
app.get('/api/admin/user/users', adminAuth, async (req, res) => {
  const { keyword, page = 1, page_size = 20 } = req.query

  try {
    let query = supabase.from('users').select('*', { count: 'exact' })

    if (keyword) query = query.or(`username.ilike.%${keyword}%,phone.ilike.%${keyword}%`)

    const { data, count } = await query
      .range((page - 1) * page_size, page * page_size - 1)
      .order('created_at', { ascending: false })

    res.json({ total: count || 0, page: parseInt(page), page_size: parseInt(page_size), items: data || [] })
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 更新用户状态
app.put('/api/admin/user/users/:id/status', adminAuth, async (req, res) => {
  const { id } = req.params
  const { is_active } = req.body

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(400).json({ message: "更新失败" })
    res.json({ message: "更新成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 创建用户分组
app.post('/api/admin/user/groups', adminAuth, async (req, res) => {
  const { name, code, description, criteria } = req.body

  if (!name || !code) {
    return res.status(400).json({ message: "名称和代码必填" })
  }

  try {
    const { data, error } = await supabase
      .from('user_groups')
      .insert([{ name, code, description, criteria, is_active: true }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(400).json({ message: "分组代码已存在" })
      return res.status(400).json({ message: "创建失败" })
    }
    res.json({ message: "创建成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 更新用户分组
app.put('/api/admin/user/groups/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { name, description, criteria, is_active } = req.body

  try {
    const { data, error } = await supabase
      .from('user_groups')
      .update({ name, description, criteria, is_active })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(400).json({ message: "更新失败" })
    res.json({ message: "更新成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 删除用户分组
app.delete('/api/admin/user/groups/:id', adminAuth, async (req, res) => {
  const { id } = req.params

  try {
    const { error } = await supabase
      .from('user_groups')
      .delete()
      .eq('id', id)

    if (error) return res.status(400).json({ message: "删除失败" })
    res.json({ message: "删除成功" })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 获取活动列表
app.get('/api/admin/marketing/activities', adminAuth, async (req, res) => {
  const { page = 1, page_size = 20 } = req.query

  try {
    const { data, count } = await supabase
      .from('activities')
      .select('*', { count: 'exact' })
      .range((page - 1) * page_size, page * page_size - 1)
      .order('created_at', { ascending: false })

    res.json({ total: count || 0, page: parseInt(page), page_size: parseInt(page_size), items: data || [] })
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 获取用户分组
app.get('/api/admin/user/groups', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('user_groups')
      .select('*')
      .order('created_at')

    res.json(data || [])
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 获取优惠券
app.get('/api/admin/marketing/coupons', adminAuth, async (req, res) => {
  const { page = 1, page_size = 20 } = req.query

  try {
    const { data, count } = await supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .range((page - 1) * page_size, page * page_size - 1)
      .order('created_at', { ascending: false })

    res.json({ total: count || 0, page: parseInt(page), page_size: parseInt(page_size), items: data || [] })
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 创建优惠券
app.post('/api/admin/marketing/coupons', adminAuth, async (req, res) => {
  const { name, code, type, discount_value, min_amount, max_discount, total_count, per_user_limit, valid_from, valid_until } = req.body

  if (!name || !code || !discount_value || !valid_from || !valid_until) {
    return res.status(400).json({ message: "名称、代码、优惠值、有效期必填" })
  }

  try {
    const { data, error } = await supabase
      .from('coupons')
      .insert([{
        name, code, type: type || 'discount',
        discount_value, min_amount: min_amount || 0,
        max_discount, total_count: total_count || 100,
        per_user_limit: per_user_limit || 1,
        valid_from: new Date(valid_from).toISOString(),
        valid_until: new Date(valid_until).toISOString(),
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(400).json({ message: "优惠券代码已存在" })
      return res.status(500).json({ message: "创建失败" })
    }

    res.json({ message: "创建成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 创建活动
app.post('/api/admin/marketing/activities', adminAuth, async (req, res) => {
  const { name, type, description, rules, start_time, end_time, banner_url } = req.body

  if (!name || !type || !start_time || !end_time) {
    return res.status(400).json({ message: "名称、类型、开始时间、结束时间必填" })
  }

  try {
    const { data, error } = await supabase
      .from('activities')
      .insert([{
        name, type, description, rules: rules ? JSON.stringify(rules) : null,
        start_time: new Date(start_time).toISOString(),
        end_time: new Date(end_time).toISOString(),
        banner_url, status: 'pending'
      }])
      .select()
      .single()

    if (error) return res.status(500).json({ message: "创建失败" })

    res.json({ message: "创建成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 获取管理员列表
app.get('/api/admin/admin-user/admins', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false })

    res.json({ total: data?.length || 0, page: 1, page_size: 100, items: data || [] })
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 获取角色列表
app.get('/api/admin/admin-user/roles', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('admin_roles')
      .select('*')
      .order('created_at')

    res.json(data || [])
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 获取系统配置
app.get('/api/admin/system/configs', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('system_configs')
      .select('*')
      .order('group_name')

    res.json(data || [])
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 创建系统配置
app.post('/api/admin/system/configs', adminAuth, async (req, res) => {
  const { key, value, type = 'string', group_name, description, is_public = false } = req.body

  if (!key || value === undefined) {
    return res.status(400).json({ message: "键和值必填" })
  }

  try {
    const { data, error } = await supabase
      .from('system_configs')
      .insert([{ key, value, type, group_name, description, is_public }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(400).json({ message: "配置键已存在" })
      return res.status(400).json({ message: "创建失败" })
    }
    res.json({ message: "创建成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 更新系统配置
app.put('/api/admin/system/configs/:key', adminAuth, async (req, res) => {
  const { key } = req.params
  const { value } = req.body

  if (value === undefined) {
    return res.status(400).json({ message: "值必填" })
  }

  try {
    const { data, error } = await supabase
      .from('system_configs')
      .update({ value })
      .eq('key', key)
      .select()
      .single()

    if (error) return res.status(400).json({ message: "更新失败" })
    res.json({ message: "更新成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 获取操作日志
app.get('/api/admin/system/logs', adminAuth, async (req, res) => {
  const { page = 1, page_size = 50 } = req.query

  try {
    const { data, count } = await supabase
      .from('admin_operation_logs')
      .select('*', { count: 'exact' })
      .range((page - 1) * page_size, page * page_size - 1)
      .order('created_at', { ascending: false })

    res.json({ total: count || 0, page: parseInt(page), page_size: parseInt(page_size), items: data || [] })
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 获取溯源配置
app.get('/api/admin/traceability/configs', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('traceability_configs')
      .select('*')
      .order('created_at')

    res.json(data || [])
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 获取溯源节点
app.get('/api/admin/traceability/configs/:configId/nodes', adminAuth, async (req, res) => {
  const { configId } = req.params

  try {
    const { data } = await supabase
      .from('traceability_nodes')
      .select('*')
      .eq('config_id', configId)
      .order('sort_order')

    res.json(data || [])
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 创建溯源配置
app.post('/api/admin/traceability/configs', adminAuth, async (req, res) => {
  const { name, code, description } = req.body

  if (!name || !code) {
    return res.status(400).json({ message: "名称和代码必填" })
  }

  try {
    const { data, error } = await supabase
      .from('traceability_configs')
      .insert([{ name, code, description, is_active: true }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(400).json({ message: "溯源代码已存在" })
      return res.status(400).json({ message: "创建失败" })
    }
    res.json({ message: "创建成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 更新溯源配置
app.put('/api/admin/traceability/configs/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { name, description, is_active } = req.body

  try {
    const { data, error } = await supabase
      .from('traceability_configs')
      .update({ name, description, is_active })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(400).json({ message: "更新失败" })
    res.json({ message: "更新成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 创建溯源节点
app.post('/api/admin/traceability/nodes', adminAuth, async (req, res) => {
  const { config_id, name, node_type, icon, description, sort_order, data_fields } = req.body

  if (!config_id || !name || !node_type) {
    return res.status(400).json({ message: "配置ID、名称和类型必填" })
  }

  try {
    const { data, error } = await supabase
      .from('traceability_nodes')
      .insert([{ config_id, name, node_type, icon, description, sort_order: sort_order || 0, data_fields, is_active: true }])
      .select()
      .single()

    if (error) return res.status(400).json({ message: "创建失败" })
    res.json({ message: "创建成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 更新溯源节点
app.put('/api/admin/traceability/nodes/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { name, node_type, icon, description, sort_order, data_fields, is_active } = req.body

  try {
    const { data, error } = await supabase
      .from('traceability_nodes')
      .update({ name, node_type, icon, description, sort_order, data_fields, is_active })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(400).json({ message: "更新失败" })
    res.json({ message: "更新成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 删除溯源节点
app.delete('/api/admin/traceability/nodes/:id', adminAuth, async (req, res) => {
  const { id } = req.params

  try {
    const { error } = await supabase
      .from('traceability_nodes')
      .delete()
      .eq('id', id)

    if (error) return res.status(400).json({ message: "删除失败" })
    res.json({ message: "删除成功" })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 获取溯源记录
app.get('/api/admin/traceability/records', adminAuth, async (req, res) => {
  const { page = 1, page_size = 50, node_id, adoption_order_id } = req.query

  try {
    let query = supabase
      .from('traceability_records')
      .select('*', { count: 'exact' })

    if (node_id) query = query.eq('node_id', node_id)
    if (adoption_order_id) query = query.eq('adoption_order_id', adoption_order_id)

    const { data, count } = await query
      .range((page - 1) * page_size, page * page_size - 1)
      .order('created_at', { ascending: false })

    res.json({ total: count || 0, page: parseInt(page), page_size: parseInt(page_size), items: data || [] })
  } catch (err) {
    res.status(500).json({ message: "查询失败" })
  }
})

// 创建溯源记录
app.post('/api/admin/traceability/records', adminAuth, async (req, res) => {
  const { node_id, data, adoption_order_id, image_url, operator } = req.body

  if (!node_id || !data) {
    return res.status(400).json({ message: "节点ID和数据必填" })
  }

  try {
    const { data: nodeData } = await supabase
      .from('traceability_nodes')
      .select('name')
      .eq('id', node_id)
      .single()

    const { data: recordData, error } = await supabase
      .from('traceability_records')
      .insert([{
        node_id,
        node_name: nodeData?.name || '',
        data,
        adoption_order_id,
        image_url,
        operator: operator || ''
      }])
      .select()
      .single()

    if (error) return res.status(400).json({ message: "创建失败" })
    res.json({ message: "创建成功", item: recordData })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// ==================== 本来生活订单管理 ====================

// 获取本来生活订单列表
app.get('/api/admin/benlai/orders', adminAuth, async (req, res) => {
  const { page = 1, page_size = 20, status, phone, out_trade_no } = req.query

  try {
    let query = supabase
      .from('benlai_orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('order_status', status)
    }
    if (phone) {
      query = query.eq('receive_phone', phone)
    }
    if (out_trade_no) {
      query = query.like('out_trade_no', `%${out_trade_no}%`)
    }

    const offset = (parseInt(page) - 1) * parseInt(page_size)
    query = query.range(offset, offset + parseInt(page_size) - 1)

    const { data, error, count } = await query

    if (error) return res.status(400).json({ message: "查询失败" })
    res.json({
      items: data || [],
      total: count || 0,
      page: parseInt(page),
      page_size: parseInt(page_size)
    })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 获取单个本来生活订单
app.get('/api/admin/benlai/orders/:id', adminAuth, async (req, res) => {
  const { id } = req.params

  try {
    const { data, error } = await supabase
      .from('benlai_orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return res.status(404).json({ message: "订单不存在" })
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 创建本来生活订单（模拟数据）
app.post('/api/admin/benlai/orders', adminAuth, async (req, res) => {
  const {
    out_trade_no, order_id, receive_contact, receive_phone,
    province, city, county, receive_address, order_price,
    ship_price, order_status, order_status_remark, order_detail
  } = req.body

  if (!out_trade_no) {
    return res.status(400).json({ message: "商户订单号必填" })
  }

  try {
    // 生成验证码（out_trade_no后6位）
    const verification_code = out_trade_no.slice(-6)

    const { data, error } = await supabase
      .from('benlai_orders')
      .insert([{
        out_trade_no,
        order_id,
        receive_contact,
        receive_phone,
        province,
        city,
        county,
        receive_address,
        order_price: order_price || 0,
        ship_price: ship_price || 0,
        order_status: order_status || 'ORDER_STATUS_INITIAL',
        order_status_remark: order_status_remark || '订单初始',
        order_detail: order_detail ? JSON.stringify(order_detail) : null,
        verification_code
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: "订单号已存在" })
      }
      return res.status(400).json({ message: "创建失败" })
    }
    res.json({ message: "创建成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 批量创建本来生活订单（模拟数据）
app.post('/api/admin/benlai/orders/batch', adminAuth, async (req, res) => {
  const { orders } = req.body

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return res.status(400).json({ message: "订单数据必填" })
  }

  try {
    const insertData = orders.map(order => {
      const verification_code = order.out_trade_no.slice(-6)
      return {
        out_trade_no: order.out_trade_no,
        order_id: order.order_id,
        receive_contact: order.receive_contact,
        receive_phone: order.receive_phone,
        province: order.province,
        city: order.city,
        county: order.county,
        receive_address: order.receive_address,
        order_price: order.order_price || 0,
        ship_price: order.ship_price || 0,
        order_status: order.order_status || 'ORDER_STATUS_INITIAL',
        order_status_remark: order.order_status_remark || '订单初始',
        order_detail: order.order_detail ? JSON.stringify(order.order_detail) : null,
        do_list: order.do_list ? JSON.stringify(order.do_list) : null,
        box_list: order.box_list ? JSON.stringify(order.box_list) : null,
        create_date: order.create_date,
        expire_date: order.expire_date,
        verification_code
      }
    })

    const { data, error } = await supabase
      .from('benlai_orders')
      .insert(insertData)
      .select()

    if (error) return res.status(400).json({ message: "批量创建失败", detail: error.message })
    res.json({ message: "创建成功", items: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 更新本来生活订单状态
app.put('/api/admin/benlai/orders/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { order_status, order_status_remark } = req.body

  try {
    const { data, error } = await supabase
      .from('benlai_orders')
      .update({
        order_status,
        order_status_remark,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(400).json({ message: "更新失败" })
    res.json({ message: "更新成功", item: data })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 删除本来生活订单
app.delete('/api/admin/benlai/orders/:id', adminAuth, async (req, res) => {
  const { id } = req.params

  try {
    const { error } = await supabase
      .from('benlai_orders')
      .delete()
      .eq('id', id)

    if (error) return res.status(400).json({ message: "删除失败" })
    res.json({ message: "删除成功" })
  } catch (err) {
    res.status(500).json({ message: "服务器错误" })
  }
})

// 根据out_trade_no查询订单（用于前端验证）
app.get('/api/benlai/order/query', async (req, res) => {
  const { out_trade_no } = req.query

  if (!out_trade_no) {
    return res.status(400).json({ code: -1, msg: "订单号必填" })
  }

  try {
    const { data, error } = await supabase
      .from('benlai_orders')
      .select('*')
      .eq('out_trade_no', out_trade_no)
      .single()

    if (error || !data) {
      return res.json({
        code: -1,
        msg: "失败",
        value: {
          sub_code: "0804_-1",
          sub_msg: "订单不存在"
        }
      })
    }

    // 转换数据格式以匹配本来生活接口
    res.json({
      code: 0,
      msg: "",
      value: {
        out_trade_no: data.out_trade_no,
        order_id: data.order_id,
        receive_contact: data.receive_contact,
        receive_phone: data.receive_phone,
        province: data.province,
        city: data.city,
        county: data.county,
        receive_address: data.receive_address,
        order_price: parseFloat(data.order_price),
        ship_price: parseFloat(data.ship_price),
        order_discount: parseFloat(data.order_discount || 0),
        order_status: data.order_status,
        order_status_remark: data.order_status_remark,
        create_date: data.create_date,
        expire_date: data.expire_date,
        order_detail: data.order_detail ? JSON.parse(data.order_detail) : [],
        do_list: data.do_list ? JSON.parse(data.do_list) : [],
        box_list: data.box_list ? JSON.parse(data.box_list) : [],
        order_invoice: data.order_invoice ? JSON.parse(data.order_invoice) : {}
      }
    })
  } catch (err) {
    res.status(500).json({ code: -1, msg: "服务器错误" })
  }
})

// 启动服务器
app.listen(PORT, '0.0.0.0', async () => {
  await initDatabase()
})