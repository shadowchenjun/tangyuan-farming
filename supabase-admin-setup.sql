-- 汤原农文旅后台管理系统 - Supabase 数据库初始化

-- 土地管理表
CREATE TABLE IF NOT EXISTS land_parcels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  area DECIMAL(10, 2) NOT NULL,
  location VARCHAR(200),
  status VARCHAR(20) DEFAULT 'available',
  type VARCHAR(20) DEFAULT 'farm',
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 认养分类表
CREATE TABLE IF NOT EXISTS adoption_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  icon VARCHAR(50),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 认养配置表
CREATE TABLE IF NOT EXISTS adoption_configs (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES adoption_categories(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'year',
  duration_days INTEGER NOT NULL,
  benefits TEXT,
  images TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 认养订单表
CREATE TABLE IF NOT EXISTS adoption_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  config_id INTEGER REFERENCES adoption_configs(id),
  land_parcel_id INTEGER REFERENCES land_parcels(id),
  quantity INTEGER DEFAULT 1,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  harvest_info TEXT,
  remark TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 租地订单表
CREATE TABLE IF NOT EXISTS rental_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  land_parcel_id INTEGER REFERENCES land_parcels(id),
  area DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  crop_plan TEXT,
  remark TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 设备类型表
CREATE TABLE IF NOT EXISTS device_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  icon VARCHAR(50),
  description TEXT,
  specifications TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 设备表
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  device_type_id INTEGER REFERENCES device_types(id),
  land_parcel_id INTEGER REFERENCES land_parcels(id),
  location VARCHAR(200),
  status VARCHAR(20) DEFAULT 'online',
  last_active TIMESTAMP,
  config TEXT,
  firmware_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 监测点表
CREATE TABLE IF NOT EXISTS monitoring_points (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id),
  name VARCHAR(100) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  unit VARCHAR(20),
  threshold_min DECIMAL(10, 2),
  threshold_max DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 监测记录表
CREATE TABLE IF NOT EXISTS monitoring_records (
  id SERIAL PRIMARY KEY,
  monitoring_point_id INTEGER REFERENCES monitoring_points(id),
  value DECIMAL(10, 2) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- 设备日志表
CREATE TABLE IF NOT EXISTS device_logs (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id),
  log_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 溯源配置表
CREATE TABLE IF NOT EXISTS traceability_configs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  land_parcel_id INTEGER REFERENCES land_parcels(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 溯源节点表
CREATE TABLE IF NOT EXISTS traceability_nodes (
  id SERIAL PRIMARY KEY,
  config_id INTEGER REFERENCES traceability_configs(id),
  name VARCHAR(100) NOT NULL,
  node_type VARCHAR(50) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  data_fields TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 溯源记录表
CREATE TABLE IF NOT EXISTS traceability_record_entries (
  id SERIAL PRIMARY KEY,
  node_id INTEGER REFERENCES traceability_nodes(id),
  adoption_order_id INTEGER REFERENCES adoption_orders(id),
  data TEXT NOT NULL,
  image_url VARCHAR(500),
  operator VARCHAR(100),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 用户分组表
CREATE TABLE IF NOT EXISTS user_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  criteria TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 优惠券表
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) DEFAULT 'discount',
  discount_value DECIMAL(10, 2) NOT NULL,
  min_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2),
  total_count INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  applicable_products TEXT,
  applicable_categories TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 活动表
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  rules TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  banner_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  type VARCHAR(20) DEFAULT 'string',
  group_name VARCHAR(50) DEFAULT 'general',
  description VARCHAR(200),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_operation_logs (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  resource_id INTEGER,
  detail TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  hashed_password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  avatar VARCHAR(500),
  role_id INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 管理员角色表
CREATE TABLE IF NOT EXISTS admin_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 本来生活订单表
CREATE TABLE IF NOT EXISTS benlai_orders (
  id SERIAL PRIMARY KEY,
  out_trade_no VARCHAR(32) UNIQUE NOT NULL COMMENT '商户订单号',
  order_id VARCHAR(32) COMMENT '接单方订单id',
  receive_contact VARCHAR(20) COMMENT '收货人姓名',
  receive_phone VARCHAR(11) COMMENT '收货人手机号',
  province VARCHAR(20) COMMENT '省',
  city VARCHAR(20) COMMENT '市',
  county VARCHAR(20) COMMENT '县（区）',
  receive_address VARCHAR(200) COMMENT '收货地址',
  order_price DECIMAL(13,2) DEFAULT 0 COMMENT '订单价格',
  ship_price DECIMAL(13,2) DEFAULT 0 COMMENT '运费',
  order_discount DECIMAL(13,2) DEFAULT 0 COMMENT '订单优惠',
  order_status VARCHAR(20) DEFAULT 'ORDER_STATUS_INITIAL' COMMENT '订单状态',
  order_status_remark VARCHAR(50) COMMENT '订单状态描述',
  create_date VARCHAR(20) COMMENT '订单创建日期',
  expire_date VARCHAR(20) COMMENT '订单过期日期',
  order_detail TEXT COMMENT '订单详情JSON',
  do_list TEXT COMMENT '出库单号列表JSON',
  box_list TEXT COMMENT '包裹单号列表JSON',
  order_invoice TEXT COMMENT '发票信息JSON',
  verification_code VARCHAR(10) COMMENT '用于验证的后6位',
  verified BOOLEAN DEFAULT FALSE COMMENT '是否已验证',
  verified_at TIMESTAMP COMMENT '验证时间',
  user_id VARCHAR(50) COMMENT '验证用户ID',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_benlai_orders_out_trade_no ON benlai_orders(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_benlai_orders_phone ON benlai_orders(receive_phone);
CREATE INDEX IF NOT EXISTS idx_benlai_orders_verification_code ON benlai_orders(verification_code);

-- 插入默认管理员账号 (密码: admin123)
INSERT INTO admin_users (username, email, hashed_password, full_name, is_active)
VALUES ('admin', 'admin@tangyuan.com', '$2b$10$abcdefghijklmnopqrstuvwxyz', '系统管理员', TRUE)
ON CONFLICT (username) DO NOTHING;
