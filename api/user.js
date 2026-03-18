// 获取用户信息
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

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Vercel 动态路由需要用 query 参数
  const { userId } = req.query
  
  if (!userId) {
    return res.status(400).json({ error: "缺少 userId 参数" })
  }

  if (!supabase) {
    return res.status(500).json({ error: "数据库配置错误" })
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
    
    return res.status(200).json(user)
  } catch (err) {
    return res.status(500).json({ error: "查询失败" })
  }
}