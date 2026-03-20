// 验证订单
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

  const { order_no } = req.body
  
  if (!order_no || order_no.length !== 6) {
    return res.status(200).json({ valid: false, message: "订单编号无效" })
  }
  
  // 模拟验证 - 实际项目需要对接订单系统
  return res.status(200).json({
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
}