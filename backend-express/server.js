import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载环境变量
config({ path: join(__dirname, '../../../.openclaw/.env') })

const app = express()
const PORT = 8000

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 中间件
app.use(cors())
app.use(express.json())

// ==================== 数据库初始化 ====================

async function initDatabase() {
  console.log('📦 初始化数据库...')
  
  // 创建 users 表
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(20) NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `
  
  // 创建 farms 表
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
  
  try {
    await supabase.rpc('exec_sql', { sql: createUsersTable })
    await supabase.rpc('exec_sql', { sql: createFarmsTable })
    console.log('✅ 数据库表已就绪')
  } catch (error) {
    // 表可能已存在，忽略错误
    console.log('ℹ️ 数据库表检查完成')
  }
}

// ==================== API接口 ====================

// 根路径
app.get('/', (req, res) => {
  res.json({ message: "汤原农文旅云认养平台API", version: "2.0.0", storage: "Supabase" })
})

// 发送验证码
app.post('/api/send-code', (req, res) => {
  const { phone } = req.body
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ message: "手机号格式不正确" })
  }
  // 实际项目中需要对接短信平台
  res.json({ message: "验证码已发送", code: "123456" })
})

// 登录/注册
app.post('/api/login', async (req, res) => {
  const { phone, code } = req.body
  
  if (!phone || !code) {
    return res.status(400).json({ message: "手机号和验证码必填" })
  }
  
  // 模拟验证 - 验证码正确即可登录
  if (code !== "123456" && code.length !== 6) {
    return res.status(401).json({ message: "验证码错误" })
  }
  
  try {
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
        console.error('创建用户失败:', createError)
        return res.status(500).json({ message: "登录失败" })
      }
      user = newUser
    } else if (error) {
      console.error('查询用户失败:', error)
      return res.status(500).json({ message: "登录失败" })
    }
    
    res.json({ 
      token: user.id, 
      user: {
        id: user.id,
        phone: user.phone,
        created_at: user.created_at
      }
    })
  } catch (err) {
    console.error('登录错误:', err)
    res.status(500).json({ message: "登录失败" })
  }
})

// 验证订单
app.post('/api/verify-order', (req, res) => {
  const { order_no } = req.body
  
  if (!order_no || order_no.length !== 6) {
    return res.json({ valid: false, message: "订单编号无效" })
  }
  
  // 模拟验证
  res.json({
    valid: true,
    order: {
      order_no,
      phone: "138****8888",
      rice_qty: 100,
      area: 10,
      address: "黑龙江省汤原县胜利乡",
      year: new Date().getFullYear()
    }
  })
})

// 分配田地
app.post('/api/allocate-land', async (req, res) => {
  const { user_id, order_no } = req.body
  
  if (!user_id) {
    return res.status(401).json({ message: "用户不存在" })
  }
  
  try {
    // 验证用户
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single()
    
    if (userError || !user) {
      return res.status(401).json({ message: "用户不存在" })
    }
    
    const year = new Date().getFullYear()
    const landNo = `TY-${year}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const ddcId = `0x${Math.random().toString(36).substring(2, 14)}`
    
    // 创建田地
    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .insert([{
        user_id,
        land_no: landNo,
        area: 10,
        address: "黑龙江省汤原县胜利乡",
        year,
        ddc_id: ddcId,
        order_no: order_no || null
      }])
      .select()
      .single()
    
    if (farmError) {
      console.error('创建田地失败:', farmError)
      return res.status(500).json({ message: "分配失败" })
    }
    
    res.json({ farm })
  } catch (err) {
    console.error('分配田地错误:', err)
    res.status(500).json({ message: "分配失败" })
  }
})

// 获取用户信息
app.get('/api/user/:userId', async (req, res) => {
  const { userId } = req.params
  
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

// 启动服务器
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 汤原农文旅云认养平台API running on http://0.0.0.0:${PORT}`)
  console.log(`📦 存储后端: Supabase`)
  console.log(`🔗 Supabase URL: ${supabaseUrl}`)
})