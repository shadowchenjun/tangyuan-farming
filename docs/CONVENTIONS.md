# Conventions — tangyuan-farming

## 命名规范

### 后端（Node.js + Express）

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| 模块文件 | `snake_case` | `send-code.js`, `allocate-land.js` |
| 函数/方法 | `camelCase` | `sendSmsCode()`, `verifyCode()` |
| 变量 | `camelCase` | `currentUser`, `orderId` |
| 常量 | `UPPER_SNAKE_CASE` | `MAX_CODE_age`, `JWT_SECRET` |

### 前端（TypeScript + Vue）

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| 组件文件 | `PascalCase.vue` | `Credentials.vue` |
| 视图文件 | `PascalCase` + `View.vue` | `LoginView.vue` |
| 变量/函数 | `camelCase` | `currentUser`, `handleLogin()` |
| 类型/接口 | `PascalCase` | `User`, `Land`, `Rights` |
| 常量 | `UPPER_SNAKE_CASE` | `API_BASE_URL` |

---

## 代码风格

### Node.js（后端）

```javascript
// ✅ 正确 - 错误处理 + JSDoc
/**
 * 发送短信验证码
 * @param {string} phone - 手机号
 * @returns {Promise<{code: number, message: string}>}
 */
async function sendSmsCode(phone) {
  // 实现
}
```

**规范：**
- ✅ 所有公共函数必须有 JSDoc 注释
- ✅ 使用 `async/await` 而非 Promise 链
- ✅ 使用 `const` 而非 `let`

### TypeScript（前端）

```typescript
// ✅ 正确 - 类型注解 + 错误处理
interface User {
  id: number
  phone: string
  landId?: number
}

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/user/me')
    if (!response.ok) throw new Error('Fetch failed')
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return null
  }
}
```

**规范：**
- ✅ 所有函数必须有返回类型注解
- ✅ 所有 API 调用必须有错误处理
- ✅ 使用 `async/await` 而非 Promise 链
- ✅ 使用 `const` 而非 `let`

### Vue 组件

**规范：**
- ✅ 使用 `<script setup lang="ts">` 语法糖
- ✅ 使用 Composition API 而非 Options API
- ✅ 使用 `scoped` 样式

---

## 文件组织

### 后端

```
backend-express/
├── server.js          # Express 主入口
├── api/               # API 路由（按业务模块划分）
├── middleware/        # 中间件（认证、日志）
└── utils/             # 工具函数
```

### 前端

```
frontend/src/
├── views/        # 页面视图
├── components/   # 可复用组件
├── router/       # 路由配置
├── api/          # API 调用封装
└── types/        # 类型定义
```

---

## Git Commit 规范

```
<type>(<scope>): <subject>

# type: feat | fix | docs | style | refactor | test | chore
# scope: 模块名（可选）
# subject: 简短描述（50 字符内）
```

**示例：**
```bash
# ✅ 正确
feat(allocate): 添加田地分配功能
fix(auth): 修复验证码过期问题
docs: 更新 API 文档

# ❌ 错误
update code
fix bug
```

---

## API 响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": { "id": 1, "name": "用户 A" }
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "验证码错误",
  "data": null
}
```

---

## 移动端 H5 注意事项

- 使用相对单位（rem/em）而非固定像素
- 添加 viewport meta 标签
- 支持手势操作（滑动、缩放）
- 图片使用 WebP 格式优化
- 减少 HTTP 请求

---

*最后更新：2026-04-02 | 维护者：龙大师团队*
