// 用户信息 API
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

const corsOrigin = process.env.ALLOWED_ORIGIN || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': corsOrigin,
  'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

export default async function handler(req, res) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }

  const { userId } = req.query

  // PUT - 更新用户信息
  if (req.method === 'PUT') {
    if (!userId) {
      return res.status(400).json({ error: "缺少 userId 参数" })
    }

    if (!supabase) {
      return res.status(500).json({ error: "数据库配置错误" })
    }

    const { nickname } = req.body || {}

    try {
      const updates = {}
      if (nickname !== undefined) updates.nickname = nickname

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return res.status(400).json({ error: error.message })
      }

      return res.status(200).json(data)
    } catch (err) {
      return res.status(500).json({ error: "更新失败" })
    }
  }

  // GET - 获取用户信息
  if (req.method === 'GET') {
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

  return res.status(405).json({ message: 'Method not allowed' })
}
