// 登录/注册
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
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
  
  // 验证码验证
  if (code !== "123456" && code.length !== 6) {
    return res.status(401).json({ message: "验证码错误" })
  }

  if (!supabase) {
    return res.status(500).json({ message: "数据库配置错误" })
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
    
    return res.status(200).json({ 
      token: user.id, 
      user: {
        id: user.id,
        phone: user.phone,
        created_at: user.created_at
      }
    })
  } catch (err) {
    console.error('登录错误:', err)
    return res.status(500).json({ message: "登录失败" })
  }
}