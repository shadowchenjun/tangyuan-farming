// 分配田地
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

const corsOrigin = process.env.ALLOWED_ORIGIN || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': corsOrigin,
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

  const { user_id, order_no } = req.body
  
  if (!user_id) {
    return res.status(401).json({ message: "用户不存在" })
  }

  if (!supabase) {
    return res.status(500).json({ message: "数据库配置错误" })
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
    
    return res.status(200).json({ farm })
  } catch (err) {
    console.error('分配田地错误:', err)
    return res.status(500).json({ message: "分配失败" })
  }
}