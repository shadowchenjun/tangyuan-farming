# Architecture — tangyuan-farming

## Overview

**汤原农文旅云认养平台** — 为用户在消费帮扶平台购买产品后提供云认养服务。H5 前端 + Node.js Express 后端 + Supabase 数据库。

**关键设计决策：**
- 前后端分离，通过 RESTful API 通信
- 使用 Supabase 作为 BaaS（后端即服务）
- 短信验证码认证 + 本来生活订单集成

---

## Directory Structure

```
tangyuan-farming/
├── backend/              # Python FastAPI (备用)
├── backend-express/      # Node.js Express API
│   └── server.js         # 主服务入口
├── frontend/             # Vue 3 H5 前端
│   └── src/
│       ├── views/        # 页面视图
│       ├── components/   # 可复用组件
│       ├── router/       # Vue Router 配置
│       └── api/          # API 调用封装
├── admin/                # Vue 3 管理后台
│   └── src/
│       └── views/       # 管理页面
├── api/                  # Supabase Edge Functions
└── server.js             # Express 主入口
```

---

## Layer Rules

```
frontend/views  →  backend-express/server.js  ← HTTP API 调用（allowed）
frontend/views  →  admin/views               ← FORBIDDEN（禁止直接调用）
admin/views    →  backend-express/server.js   ← HTTP API 调用（allowed）
```

**依赖方向：**
```
用户请求 → Frontend Views → Express API → Supabase → Response
               ↑                                    ↓
               └──────────── 错误处理 ────────────────┘
```

---

## Key Packages

### 后端 API 模块 (backend-express/server.js)

| 模块 | 路由前缀 | 职责 |
|------|----------|------|
| **认证** | `/api/auth/*` | 短信验证码登录、JWT Token |
| **用户** | `/api/user/*` | 用户信息、田地分配 |
| **田地** | `/api/allocate/*` | 田地分配、认养流程 |
| **权益** | `/api/rights/*` | 权益查询、详情 |
| **本来生活** | `/api/benlai/*` | 订单同步、验证 |

### 前端视图模块 (frontend/src/views)

| 视图 | 文件 | 对应 API |
|------|------|----------|
| 登录 | `Login.vue` | `/api/auth/*` |
| 认养活动 | `FarmingActivity.vue` | 静态页面 |
| 身份验证 | `IdentityVerify.vue` | `/api/auth/verify` |
| 分配田地 | `AllocateLand.vue` | `/api/allocate/*` |
| 数字田地凭证 | `Credentials.vue` | `/api/rights/*` |
| 权益中心 | `Rights.vue` | `/api/rights/*` |
| 权益详情 | `RightDetail.vue` | `/api/rights/*` |

---

## Data Flow Example

**认养流程：**

```
用户 → FarmingActivity.vue
       ↓ (点击认养)
    IdentityVerify.vue (验证手机号)
       ↓ (POST /api/auth/send-code)
    server.js → Supabase (发送短信)
       ↓ (POST /api/auth/verify)
    server.js → 验证验证码
       ↓ (分配田地)
    AllocateLand.vue
       ↓ (POST /api/allocate/land)
    server.js → Supabase (田地分配)
       ↓
    Credentials.vue (展示田地凭证)
```

---

## Key Invariants

1. **API 必须验证用户身份** — 所有需要登录的接口必须验证 JWT Token
2. **短信验证码有时效性** — 5分钟有效期，不可重复使用
3. **田地分配不可逆** — 已分配的田地不可重新分配
4. **前端禁止直接访问数据库** — 所有数据必须通过 API 获取
5. **错误必须统一处理** — API 错误返回统一格式 `{ code, message, data }`

---

*最后更新：2026-04-02 | 维护者：龙大师团队*
