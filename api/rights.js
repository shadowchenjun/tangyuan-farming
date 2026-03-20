// 获取权益列表
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

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const rights = [
    { id: "1", title: "优质大米", description: "每年可获得认养面积对应的新鲜大米", icon: "🌾", supplier: "本来生活" },
    { id: "2", title: "实时监控", description: "通过物联网设备实时查看田地生长情况", icon: "📷", supplier: "汤原县政府" },
    { id: "3", title: "溯源查询", description: "全程追溯农产品生长、加工、运输过程", icon: "🔍", supplier: "区块链溯源平台" },
    { id: "4", title: "线下活动", description: "优先参与汤原县线下农旅活动", icon: "🎁", supplier: "文旅创新中心" },
    { id: "5", title: "民宿优惠", description: "合作民宿享受专属折扣", icon: "🏨", supplier: "本来生活" },
    { id: "6", title: "景区门票", description: "汤原县景区免费或优惠门票", icon: "🎫", supplier: "文旅创新中心" },
  ]
  
  return res.status(200).json({ rights })
}