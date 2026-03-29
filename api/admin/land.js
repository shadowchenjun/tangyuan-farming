// 土地管理 API
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

export default async function handler(req, res) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }

  // 检查管理员权限
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: '未授权' })
  }

  // 获取土地列表
  if (req.method === 'GET' && req.url === '/api/admin/land/parcels') {
    const { status, type, keyword, page = 1, page_size = 20 } = req.query

    if (!supabase) {
      return res.status(500).json({ error: '数据库配置错误' })
    }

    try {
      let query = supabase.from('land_parcels').select('*', { count: 'exact' })

      if (status) query = query.eq('status', status)
      if (type) query = query.eq('type', type)
      if (keyword) query = query.or(`name.ilike.%${keyword}%,code.ilike.%${keyword}%`)

      const { data, error, count } = await query
        .range((page - 1) * page_size, page * page_size)
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json({
        items: data || [],
        total: count || 0,
        page: Number(page),
        page_size: Number(page_size)
      })
    } catch (err) {
      return res.status(500).json({ error: '获取失败' })
    }
  }

  // 获取单个土地
  if (req.method === 'GET' && req.url.match(/^\/api\/admin\/land\/parcels\/\d+$/)) {
    const id = req.url.split('/').pop()

    if (!supabase) {
      return res.status(500).json({ error: '数据库配置错误' })
    }

    try {
      const { data, error } = await supabase
        .from('land_parcels')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        return res.status(404).json({ error: '土地不存在' })
      }

      return res.status(200).json(data)
    } catch (err) {
      return res.status(500).json({ error: '获取失败' })
    }
  }

  // 创建土地
  if (req.method === 'POST' && req.url === '/api/admin/land/parcels') {
    if (!supabase) {
      return res.status(500).json({ error: '数据库配置错误' })
    }

    const { name, code, area, location, type, description, image_url } = req.body

    try {
      const { data, error } = await supabase
        .from('land_parcels')
        .insert([{ name, code, area, location, type, description, image_url }])
        .select()
        .single()

      if (error) throw error

      return res.status(201).json(data)
    } catch (err) {
      return res.status(500).json({ error: '创建失败' })
    }
  }

  // 更新土地
  if (req.method === 'PUT' && req.url.match(/^\/api\/admin\/land\/parcels\/\d+$/)) {
    const id = req.url.split('/').pop()

    if (!supabase) {
      return res.status(500).json({ error: '数据库配置错误' })
    }

    try {
      const { data, error } = await supabase
        .from('land_parcels')
        .update(req.body)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return res.status(200).json(data)
    } catch (err) {
      return res.status(500).json({ error: '更新失败' })
    }
  }

  // 删除土地
  if (req.method === 'DELETE' && req.url.match(/^\/api\/admin\/land\/parcels\/\d+$/)) {
    const id = req.url.split('/').pop()

    if (!supabase) {
      return res.status(500).json({ error: '数据库配置错误' })
    }

    try {
      const { error } = await supabase.from('land_parcels').delete().eq('id', id)

      if (error) throw error

      return res.status(200).json({ message: '删除成功' })
    } catch (err) {
      return res.status(500).json({ error: '删除失败' })
    }
  }

  // 获取租地订单
  if (req.method === 'GET' && req.url === '/api/admin/land/rental-orders') {
    const { status, page = 1, page_size = 20 } = req.query

    if (!supabase) {
      return res.status(500).json({ error: '数据库配置错误' })
    }

    try {
      let query = supabase.from('rental_orders').select('*', { count: 'exact' })

      if (status) query = query.eq('status', status)

      const { data, error, count } = await query
        .range((page - 1) * page_size, page * page_size)
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json({
        items: data || [],
        total: count || 0,
        page: Number(page),
        page_size: Number(page_size)
      })
    } catch (err) {
      return res.status(500).json({ error: '获取失败' })
    }
  }

  return res.status(404).json({ error: '未找到' })
}
