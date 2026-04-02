# AGENTS.md — tangyuan-farming Agent Harness

[汤原农文旅云认养平台 V1.0] — H5 前端 + Express 后端 + Supabase

> **Context depth guide (progressive disclosure):**
> - **L1 (here):** orientation, commands, invariants — read this first
> - **L2 (`docs/`):** architecture, quality standards, conventions — read before coding
> - **L3 (source):** implementation details — pull on demand via grep/read tools

---

## Repo Map

```
  backend/           # Python FastAPI (备用)
  backend-express/   # Node.js Express API (主后端)
  frontend/          # Vue 3 H5 前端
  admin/             # Vue 3 管理后台
  api/               # Supabase Edge Functions
```

---

## Docs (start here before touching code)

| File | What it covers |
|------|---------------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Layer rules, dependency graph, key invariants |
| [`docs/QUALITY.md`](docs/QUALITY.md) | Coverage targets, security rules, **Sprint 评估标准** |
| [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) | Naming conventions, code style |
| [`docs/RESILIENCE.md`](docs/RESILIENCE.md) | Agent recovery protocols, 7-point checklist, VBR standards |
| [`docs/EXECUTION_PLAN_TEMPLATE.md`](docs/EXECUTION_PLAN_TEMPLATE.md) | **Sprint 制**执行计划模板 |
| [`docs/HANDOFF_TEMPLATE.md`](docs/HANDOFF_TEMPLATE.md) | Context Reset handoff artifact |

---

## How to Build & Test

```bash
# 启动后端服务
cd backend-express && node server.js

# 启动前端开发服务器
cd frontend && npm run dev

# 启动管理后台
cd admin && npm run dev

# 构建前端
cd frontend && npm run build

# 构建管理后台
cd admin && npx vite build

# 运行 Agent Lint
bash scripts/agent-lint.sh
```

---

## Agent Invariants (non-negotiable)

1. **Always verify build before opening a PR.** Never break existing builds.
2. **Check docs/ARCHITECTURE.md before adding cross-package dependencies.**
3. **All new public APIs must have documentation.**
4. **Run `bash scripts/agent-lint.sh` locally.** Failures include fix instructions.
5. **For complex tasks** (multiple packages, new APIs, migrations), create an execution
   plan using `docs/EXECUTION_PLAN_TEMPLATE.md` before writing code.
6. **Work in Sprints.** One feature at a time, evaluate after each sprint.
7. **Fill HANDOFF_TEMPLATE.md** before context reset or task handoff.

---

## Sprint Workflow（Anthropic 启发式）

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Generator  │ →   │   自评估     │ →   │  Evaluator  │
│  (实现功能)  │     │ (填评分表)   │     │  (龙主测试)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┘
                    │
           ┌────────▼────────┐
           │  通过？          │
           │  ✅ 继续下一 Sprint │
           │  ❌ 打回重做      │
           └─────────────────┘
```

**每个 Sprint 必须：**
1. 实现一个完整功能
2. 填写自评估表（4 维度评分）
3. 通过 Evaluator 评估（任何维度低于及格线 → 打回）
4. 填写 HANDOFF_TEMPLATE.md（如需 context reset）

---

## CI Gates

Every PR runs agent-lint + builds. All must pass.

---

*This file must stay under 150 lines. See `scripts/agent-lint.sh`.*
