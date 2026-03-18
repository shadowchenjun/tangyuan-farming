// Vercel Serverless Function - 主入口
import { createClient } from '@supabase/supabase-js'

// Supabase 配置 - 从环境变量读取
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置环境变量')
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }

  // 设置 CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  // API 信息
  return res.status(200).json({ 
    message: "汤原农文旅云认养平台API", 
    version: "2.0.0", 
    storage: "Supabase",
    endpoints: [
      "POST /api/send-code",
      "POST /api/login",
      "POST /api/verify-order",
      "POST /api/allocate-land",
      "GET /api/user/:userId",
      "GET /api/farms/:userId",
      "GET /api/rights"
    ]
  })
}