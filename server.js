// Local API server for testing
const http = require('http');
const url = require('url');
const querystring = require('querystring');

// Simple in-memory "database" for testing
const users = {
  'test-user-1': { id: 'test-user-1', phone: '18612249972', nickname: '' }
};

// Admin users for management panel
const adminUsers = {
  'admin': {
    id: 1,
    username: 'admin',
    email: 'admin@tangyuan.com',
    full_name: '系统管理员',
    phone: '13800138000',
    role_id: 1,
    is_active: true
  }
};

// Mock admin token
const adminToken = 'admin-mock-token-123456';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Login endpoint
  if (pathname === '/api/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const { phone, code } = body;

    if (!phone || !code) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: '手机号和验证码必填' }));
      return;
    }

    // 开发模式：123456永远有效
    if (code !== '123456') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: '验证码错误或已过期' }));
      return;
    }

    // 查找或创建用户
    let user = Object.values(users).find(u => u.phone === phone);
    if (!user) {
      user = {
        id: 'user-' + Date.now(),
        phone: phone,
        nickname: ''
      };
      users[user.id] = user;
    }

    const token = 'mock-jwt-token-' + user.id;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ token, user }));
    return;
  }

  // Update user endpoint
  if (pathname.match(/^\/api\/user\/(.+)$/) && req.method === 'PUT') {
    const userId = pathname.match(/^\/api\/user\/(.+)$/)[1];
    const body = await parseBody(req);
    const { nickname } = body;

    if (!users[userId]) {
      // 创建临时用户用于测试
      users[userId] = { id: userId, phone: 'test', nickname: '' };
    }

    if (nickname !== undefined) {
      users[userId].nickname = nickname;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users[userId]));
    return;
  }

  // Get user endpoint
  if (pathname.match(/^\/api\/user\/(.+)$/) && req.method === 'GET') {
    const userId = pathname.match(/^\/api\/user\/(.+)$/)[1];
    const user = users[userId];

    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '用户不存在' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(user));
    return;
  }

  // Farms endpoint (mock)
  if (pathname.match(/^\/api\/farms\/(.+)$/) && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ farms: [] }));
    return;
  }

  // Send code endpoint (mock)
  if (pathname === '/api/send-code' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: '验证码已发送' }));
    return;
  }

  // Verify order endpoint (mock)
  if (pathname === '/api/verify-order' && req.method === 'POST') {
    const body = await parseBody(req);
    const { order_no } = body;

    if (!order_no || order_no.length !== 6) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ valid: false, message: '订单编号无效' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      valid: true,
      order: {
        order_no,
        phone: '138****8888',
        rice_qty: 100,
        area: 10,
        address: '黑龙江省汤原县胜利乡',
        year: new Date().getFullYear()
      }
    }));
    return;
  }

  // Allocate land endpoint (mock)
  if (pathname === '/api/allocate-land' && req.method === 'POST') {
    const body = await parseBody(req);
    const { user_id, order_no } = body;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      farm_id: 'farm-' + Date.now(),
      ddc_id: '0x' + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
    }));
    return;
  }

  // Rights endpoint (mock)
  if (pathname === '/api/rights' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { id: 1, title: '数字田地凭证', icon: '📜' },
      { id: 2, title: '实时监控', icon: '📷' },
      { id: 3, title: '溯源查询', icon: '🔍' },
      { id: 4, title: '专属权益', icon: '🎁' }
    ]));
    return;
  }

  // ============ Admin Auth ============
  // Admin login
  if (pathname === '/api/admin/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const { username, password } = body;

    if (username === 'admin' && password === 'admin123456') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        access_token: adminToken,
        token_type: 'bearer',
        admin: adminUsers['admin']
      }));
      return;
    }

    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '用户名或密码错误' }));
    return;
  }

  // Admin profile
  if (pathname === '/api/admin/auth/profile' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${adminToken}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '未授权' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(adminUsers['admin']));
    return;
  }

  // Admin dashboard stats
  if (pathname === '/api/admin/dashboard/stats' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      total_users: 128,
      total_orders: 456,
      total_land: 1000,
      active_devices: 42
    }));
    return;
  }

  // Admin dashboard charts
  if (pathname === '/api/admin/dashboard/charts' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      values: [120, 200, 150, 80, 70, 110, 130]
    }));
    return;
  }

  // Admin dashboard recent orders
  if (pathname === '/api/admin/dashboard/recent-orders' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { id: 1, order_no: 'AD20260322001', user: '张三', config: '标准认养', amount: 2999, status: 'active', created_at: '2026-03-22 10:00:00' },
      { id: 2, order_no: 'AD20260322002', user: '李四', config: '尊享认养', amount: 8999, status: 'pending', created_at: '2026-03-22 11:30:00' },
      { id: 3, order_no: 'AD20260322003', user: '王五', config: '体验认养', amount: 999, status: 'active', created_at: '2026-03-22 14:20:00' }
    ]));
    return;
  }

  // ============ Admin Land ============
  // Get land parcels
  if (pathname === '/api/admin/land/parcels' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      items: [
        { id: 1, name: '一号田', code: 'L001', area: 100, location: '汤原县胜利乡', status: 'available', type: 'farm' },
        { id: 2, name: '二号田', code: 'L002', area: 200, location: '汤原县胜利乡', status: 'rented', type: 'farm' },
        { id: 3, name: '三号田', code: 'L003', area: 150, location: '汤原县胜利乡', status: 'available', type: 'greenhouse' }
      ],
      total: 3,
      page: 1,
      page_size: 20
    }));
    return;
  }

  // Get rental orders
  if (pathname === '/api/admin/land/rental-orders' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      items: [
        { id: 1, order_no: 'RT20260322001', area: 50, unit_price: 10, total_amount: 500, status: 'active', start_date: '2026-01-01', end_date: '2026-12-31' },
        { id: 2, order_no: 'RT20260322002', area: 30, unit_price: 10, total_amount: 300, status: 'pending', start_date: '2026-03-01', end_date: '2027-02-28' }
      ],
      total: 2,
      page: 1,
      page_size: 20
    }));
    return;
  }

  // Create land parcel
  if (pathname === '/api/admin/land/parcels' && req.method === 'POST') {
    const body = await parseBody(req);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: Date.now(), ...body }));
    return;
  }

  // Update land parcel
  if (pathname.match(/^\/api\/admin\/land\/parcels\/\d+$/) && req.method === 'PUT') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Delete land parcel
  if (pathname.match(/^\/api\/admin\/land\/parcels\/\d+$/) && req.method === 'DELETE') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // ============ Admin Devices ============
  // Device types
  if (pathname === '/api/admin/device/types' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { id: 1, name: '摄像头', code: 'camera', icon: 'VideoCamera' },
      { id: 2, name: '传感器', code: 'sensor', icon: 'Odometer' },
      { id: 3, name: '灌溉设备', code: 'irrigation', icon: 'Connection' }
    ]));
    return;
  }

  // Devices
  if (pathname === '/api/admin/device/devices' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      items: [
        { id: 1, name: '监控摄像头-01', code: 'D001', device_type_id: 1, device_type_name: '摄像头', status: 'online', location: '一号田', land_name: '一号田' },
        { id: 2, name: '温湿度传感器-01', code: 'D002', device_type_id: 2, device_type_name: '传感器', status: 'online', location: '一号田', land_name: '一号田' },
        { id: 3, name: '灌溉控制器-01', code: 'D003', device_type_id: 3, device_type_name: '灌溉设备', status: 'online', location: '二号田', land_name: '二号田' }
      ],
      total: 3,
      page: 1,
      page_size: 20
    }));
    return;
  }

  // Adoption categories
  if (pathname === '/api/admin/adoption/categories' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { id: 1, name: '水稻认养', code: 'rice', icon: 'Coin' },
      { id: 2, name: '蔬菜认养', code: 'vegetable', icon: 'Vegetable' }
    ]));
    return;
  }

  // Adoption configs
  if (pathname === '/api/admin/adoption/configs' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      items: [
        { id: 1, category_id: 1, name: '体验版', price: 999, unit: '年', duration_days: 365, stock: 100, is_active: true },
        { id: 2, category_id: 1, name: '标准版', price: 2999, unit: '年', duration_days: 365, stock: 50, is_active: true },
        { id: 3, category_id: 1, name: '尊享版', price: 8999, unit: '年', duration_days: 365, stock: 20, is_active: true }
      ],
      total: 3,
      page: 1,
      page_size: 20
    }));
    return;
  }

  // ============ Admin Adoption ============
  if (pathname === '/api/admin/adoption/orders' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      items: [
        { id: 1, order_no: 'AD20260322001', user_id: 1, user_name: '张三', config_name: '标准认养', total_amount: 2999, status: 'active', created_at: '2026-03-22 10:00:00' },
        { id: 2, order_no: 'AD20260322002', user_id: 2, user_name: '李四', config_name: '尊享认养', total_amount: 8999, status: 'pending', created_at: '2026-03-22 11:30:00' },
        { id: 3, order_no: 'AD20260322003', user_id: 1, user_name: '张三', config_name: '体验认养', total_amount: 999, status: 'completed', created_at: '2026-03-21 09:00:00' }
      ],
      total: 3,
      page: 1,
      page_size: 20
    }));
    return;
  }

  // ============ Admin Traceability ============
  if (pathname === '/api/admin/traceability/configs' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { id: 1, name: '水稻溯源链', code: 'rice_trace', is_active: true, node_count: 5 },
      { id: 2, name: '蔬菜溯源链', code: 'vegetable_trace', is_active: true, node_count: 4 }
    ]));
    return;
  }

  if (pathname === '/api/admin/traceability/records' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      items: [
        { id: 1, order_no: 'AD20260322001', node_name: '插秧', operator: '农户老王', timestamp: '2026-03-20 08:00:00' },
        { id: 2, order_no: 'AD20260322001', node_name: '施肥', operator: '农户老王', timestamp: '2026-03-21 09:00:00' }
      ],
      total: 2,
      page: 1,
      page_size: 20
    }));
    return;
  }

  // ============ Admin Marketing ============
  if (pathname === '/api/admin/marketing/coupons' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      items: [
        { id: 1, name: '新人优惠券', code: 'NEWBIE', type: 'discount', discount_value: 100, total_count: 1000, used_count: 156, is_active: true },
        { id: 2, name: '满减券', code: 'MAN300', type: 'cash', discount_value: 30, min_amount: 300, total_count: 500, used_count: 89, is_active: true }
      ],
      total: 2,
      page: 1,
      page_size: 20
    }));
    return;
  }

  if (pathname === '/api/admin/marketing/activities' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      items: [
        { id: 1, name: '春季认养节', type: 'flash_sale', status: 'active', start_time: '2026-03-01', end_time: '2026-03-31' },
        { id: 2, name: '邀请好友', type: 'invite', status: 'active', start_time: '2026-01-01', end_time: '2026-12-31' }
      ],
      total: 2,
      page: 1,
      page_size: 20
    }));
    return;
  }

  // ============ Admin System ============
  if (pathname === '/api/admin/system/configs' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { id: 1, key: 'site_name', value: '汤原农文旅云', group_name: 'general', description: '网站名称' },
      { id: 2, key: 'contact_phone', value: '400-888-8888', group_name: 'general', description: '联系电话' }
    ]));
    return;
  }

  if (pathname === '/api/admin/system/logs' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      items: [
        { id: 1, admin_username: 'admin', action: '登录', resource: '系统', detail: '登录成功', created_at: '2026-03-22 10:00:00' },
        { id: 2, admin_username: 'admin', action: '创建', resource: '土地', detail: '创建土地：一号田', created_at: '2026-03-22 11:30:00' }
      ],
      total: 2,
      page: 1,
      page_size: 20
    }));
    return;
  }

  // ============ Admin User ============
  if (pathname === '/api/admin/user/groups' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { id: 1, name: '普通用户', code: 'normal', member_count: 100 },
      { id: 2, name: 'VIP用户', code: 'vip', member_count: 28 }
    ]));
    return;
  }

  // ============ Admin Admin ============
  if (pathname === '/api/admin/admin-user/admins' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      items: [
        { id: 1, username: 'admin', full_name: '系统管理员', email: 'admin@tangyuan.com', role_name: '超级管理员', is_active: true, last_login: '2026-03-22 10:00:00' }
      ],
      total: 1,
      page: 1,
      page_size: 20
    }));
    return;
  }

  if (pathname === '/api/admin/admin-user/roles' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { id: 1, name: '超级管理员', code: 'super_admin', description: '拥有所有权限' },
      { id: 2, name: '运营管理员', code: 'operator', description: '日常运营管理' }
    ]));
    return;
  }

  // ============ Admin Users ============
  if (pathname === '/api/admin/user/users' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      items: [
        { id: 1, username: 'johnnychenjun', phone: '18612249972', is_admin: true, is_active: true },
        { id: 2, username: 'testuser', phone: '13800138000', is_admin: false, is_active: true }
      ],
      total: 2,
      page: 1,
      page_size: 20
    }));
    return;
  }

  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = http.createServer(handleRequest);

server.listen(8002, '0.0.0.0', () => {
  console.log('Local API server running on http://localhost:8002');
});
