# HTTP · `/api/v1`

约定见 [../README.md](../README.md)。

## 环境

- Base：已启动应用（如 `http://localhost:3000`）
- 集合 `/api/v1`；成员 `/api/v1/:id`
- 存储：进程内 `Map`；种子 `{ id: "demo", name: "Alice", age: 20 }`
- 写会残留。创建用未占用 `name`；依赖种子的 409 勿先改 `Alice`
- 未落地：鉴权、401/403

## 覆盖清单

### 1. 入口 × 结果（P0）

| 入口 | 主成功 | Schema 422 | 协议 400 | 业务失败 |
|------|--------|------------|----------|----------|
| `GET /api/v1` | [GET-001](#tc-api-v1-get-001-列表测试项默认查询) | [GET-004](#tc-api-v1-get-004-列表测试项name-为空串) | — | — |
| `POST /api/v1` | [POST-001](#tc-api-v1-post-001-创建测试项合法入参) | [POST-002](#tc-api-v1-post-002-创建测试项age-低于下界) | [POST-011](#tc-api-v1-post-011-创建测试项非法-json) | 409 [POST-010](#tc-api-v1-post-010-创建测试项name-冲突) |
| `GET /api/v1/:id` | [GETID-001](#tc-api-v1-getid-001-按-id-查询存在) | [GETID-003](#tc-api-v1-getid-003-按-id-查询id-超长) | — | 404 [GETID-002](#tc-api-v1-getid-002-按-id-查询不存在) |
| `PUT /api/v1/:id` | [PUT-001](#tc-api-v1-put-001-全量替换合法入参) | [PUT-003](#tc-api-v1-put-003-全量替换body-形状不符) | [PUT-004](#tc-api-v1-put-004-全量替换非法-json) | 404 [PUT-002](#tc-api-v1-put-002-全量替换资源不存在)；409 [PUT-005](#tc-api-v1-put-005-全量替换name-冲突) |
| `PATCH /api/v1/:id` | [PATCH-001](#tc-api-v1-patch-001-部分更新单字段) | [PATCH-002](#tc-api-v1-patch-002-部分更新空对象) | [PATCH-004](#tc-api-v1-patch-004-部分更新非法-json) | 404 [PATCH-003](#tc-api-v1-patch-003-部分更新资源不存在)；409 [PATCH-005](#tc-api-v1-patch-005-部分更新name-冲突) |
| `DELETE /api/v1/:id` | [DELETE-001](#tc-api-v1-delete-001-删除存在的项) | [DELETE-003](#tc-api-v1-delete-003-删除id-超长) | — | 404 [DELETE-002](#tc-api-v1-delete-002-删除不存在) |

`id.min(1)`：`/api/v1/` 走集合，空 id 不可达，记 `—`。

### 2. Schema × 等价类

| 契约 | 代表 | TC |
|------|------|-----|
| 列表默认 `page=1`、`pageSize=10` | 无 query | GET-001 |
| `name` 过滤命中（忽略大小写、包含） | `name=ali` | GET-002 |
| `name` 过滤无命中 | `name=zzz` | GET-003 |
| `name` 可选但非空 | `name=` | GET-004 |
| `minAge` 合法下界 0 | `minAge=0` | GET-005 |
| `minAge` 低于 0 | `minAge=-1` | GET-006 |
| `minAge` coerce 失败 | `minAge=abc` | GET-007 |
| `minAge` 过滤掉种子 | `minAge=21` | GET-008 |
| `name` × `minAge` | 同时给 | GET-009 |
| `pageSize` 上界内 / 外 | 50 / 51 | GET-010 / GET-011 |
| `page` / `pageSize` 非正 | `page=0`、`pageSize=0` | GET-012 |
| 分页切片 | `pageSize=1&page=1` | GET-013 |
| 创建 `age` 18 / 17 / 150 / 151 | 边界及两侧 | POST-001 / 002 / 003 / 004 |
| 创建缺字段 | 缺 `name` 或 `age` | POST-005 |
| `name` trim 后为空 / 超 50 / 恰 50 | 空格、51、50 | POST-006 / 007 / 008 |
| `name` trim | `" Bob "` → `Bob` | POST-009 |
| 替换 body = 创建 schema | 代表一条 422 | PUT-003 |
| PATCH 至少一字段 | `{}` | PATCH-002 |
| PATCH 单字段合法 | 只改 `age` | PATCH-001 |
| `id` max 64 | 65 字符 | GETID-003、DELETE-003 |

### 3. Service × 状态

| 契约 | TC |
|------|-----|
| `name` 唯一 · 创建 | POST-010 |
| `name` 唯一 · 替换（撞其他项） | PUT-005 |
| `name` 唯一 · 替换（保留自身） | PUT-006 |
| `name` 唯一 · 部分更新 | PATCH-005 |
| id 不存在 · 读/改/删 | GETID-002、PUT-002、PATCH-003、DELETE-002 |
| 删除后再读 404 | SCENE-001 |

### 4. 场景

| 契约 | TC |
|------|-----|
| 创建 → 列表可见 → 改 → 再查一致 → 删 → 再查 404 | SCENE-001 |

## 执行清单

进度：0 / 42

| 完成 | 结果 | 优先级 | TC | 标题 | 备注 |
|------|------|--------|-----|------|------|
| [ ] | 未测 | P0 | [GET-001](#tc-api-v1-get-001-列表测试项默认查询) | 列表测试项·默认查询 | |
| [ ] | 未测 | P1 | [GET-002](#tc-api-v1-get-002-列表测试项name-子串命中) | 列表测试项·name 子串命中 | |
| [ ] | 未测 | P1 | [GET-003](#tc-api-v1-get-003-列表测试项name-无命中) | 列表测试项·name 无命中 | |
| [ ] | 未测 | P0 | [GET-004](#tc-api-v1-get-004-列表测试项name-为空串) | 列表测试项·name 为空串 | |
| [ ] | 未测 | P1 | [GET-005](#tc-api-v1-get-005-列表测试项minage-合法下界) | 列表测试项·minAge 合法下界 | |
| [ ] | 未测 | P1 | [GET-006](#tc-api-v1-get-006-列表测试项minage-低于下界) | 列表测试项·minAge 低于下界 | |
| [ ] | 未测 | P2 | [GET-007](#tc-api-v1-get-007-列表测试项minage-无法-coerce) | 列表测试项·minAge 无法 coerce | |
| [ ] | 未测 | P1 | [GET-008](#tc-api-v1-get-008-列表测试项minage-滤掉种子) | 列表测试项·minAge 滤掉种子 | |
| [ ] | 未测 | P1 | [GET-009](#tc-api-v1-get-009-列表测试项name-与-minage-同时生效) | 列表测试项·name 与 minAge 同时生效 | |
| [ ] | 未测 | P1 | [GET-010](#tc-api-v1-get-010-列表测试项pagesize-合法上界) | 列表测试项·pageSize 合法上界 | |
| [ ] | 未测 | P1 | [GET-011](#tc-api-v1-get-011-列表测试项pagesize-超过上界) | 列表测试项·pageSize 超过上界 | |
| [ ] | 未测 | P1 | [GET-012](#tc-api-v1-get-012-列表测试项page-或-pagesize-非正) | 列表测试项·page 或 pageSize 非正 | |
| [ ] | 未测 | P1 | [GET-013](#tc-api-v1-get-013-列表测试项分页切片) | 列表测试项·分页切片 | |
| [ ] | 未测 | P0 | [POST-001](#tc-api-v1-post-001-创建测试项合法入参) | 创建测试项·合法入参 | |
| [ ] | 未测 | P0 | [POST-002](#tc-api-v1-post-002-创建测试项age-低于下界) | 创建测试项·age 低于下界 | |
| [ ] | 未测 | P1 | [POST-003](#tc-api-v1-post-003-创建测试项age-合法上界) | 创建测试项·age 合法上界 | |
| [ ] | 未测 | P1 | [POST-004](#tc-api-v1-post-004-创建测试项age-超过上界) | 创建测试项·age 超过上界 | |
| [ ] | 未测 | P1 | [POST-005](#tc-api-v1-post-005-创建测试项缺字段) | 创建测试项·缺字段 | |
| [ ] | 未测 | P1 | [POST-006](#tc-api-v1-post-006-创建测试项name-经-trim-为空) | 创建测试项·name 经 trim 为空 | |
| [ ] | 未测 | P1 | [POST-007](#tc-api-v1-post-007-创建测试项name-超过上界) | 创建测试项·name 超过上界 | |
| [ ] | 未测 | P1 | [POST-008](#tc-api-v1-post-008-创建测试项name-合法上界) | 创建测试项·name 合法上界 | |
| [ ] | 未测 | P1 | [POST-009](#tc-api-v1-post-009-创建测试项name-去空白) | 创建测试项·name 去空白 | |
| [ ] | 未测 | P0 | [POST-010](#tc-api-v1-post-010-创建测试项name-冲突) | 创建测试项·name 冲突 | |
| [ ] | 未测 | P0 | [POST-011](#tc-api-v1-post-011-创建测试项非法-json) | 创建测试项·非法 JSON | |
| [ ] | 未测 | P0 | [GETID-001](#tc-api-v1-getid-001-按-id-查询存在) | 按 id 查询·存在 | |
| [ ] | 未测 | P0 | [GETID-002](#tc-api-v1-getid-002-按-id-查询不存在) | 按 id 查询·不存在 | |
| [ ] | 未测 | P0 | [GETID-003](#tc-api-v1-getid-003-按-id-查询id-超长) | 按 id 查询·id 超长 | |
| [ ] | 未测 | P0 | [PUT-001](#tc-api-v1-put-001-全量替换合法入参) | 全量替换·合法入参 | |
| [ ] | 未测 | P0 | [PUT-002](#tc-api-v1-put-002-全量替换资源不存在) | 全量替换·资源不存在 | |
| [ ] | 未测 | P0 | [PUT-003](#tc-api-v1-put-003-全量替换body-形状不符) | 全量替换·body 形状不符 | |
| [ ] | 未测 | P0 | [PUT-004](#tc-api-v1-put-004-全量替换非法-json) | 全量替换·非法 JSON | |
| [ ] | 未测 | P0 | [PUT-005](#tc-api-v1-put-005-全量替换name-冲突) | 全量替换·name 冲突 | |
| [ ] | 未测 | P1 | [PUT-006](#tc-api-v1-put-006-全量替换保留自身-name) | 全量替换·保留自身 name | |
| [ ] | 未测 | P0 | [PATCH-001](#tc-api-v1-patch-001-部分更新单字段) | 部分更新·单字段 | |
| [ ] | 未测 | P0 | [PATCH-002](#tc-api-v1-patch-002-部分更新空对象) | 部分更新·空对象 | |
| [ ] | 未测 | P0 | [PATCH-003](#tc-api-v1-patch-003-部分更新资源不存在) | 部分更新·资源不存在 | |
| [ ] | 未测 | P0 | [PATCH-004](#tc-api-v1-patch-004-部分更新非法-json) | 部分更新·非法 JSON | |
| [ ] | 未测 | P0 | [PATCH-005](#tc-api-v1-patch-005-部分更新name-冲突) | 部分更新·name 冲突 | |
| [ ] | 未测 | P0 | [DELETE-001](#tc-api-v1-delete-001-删除存在的项) | 删除·存在的项 | |
| [ ] | 未测 | P0 | [DELETE-002](#tc-api-v1-delete-002-删除不存在) | 删除·不存在 | |
| [ ] | 未测 | P0 | [DELETE-003](#tc-api-v1-delete-003-删除id-超长) | 删除·id 超长 | |
| [ ] | 未测 | P1 | [SCENE-001](#tc-api-v1-scene-001-测试项crud-闭环) | 测试项·CRUD 闭环 | |

---

## 集合 `/api/v1`

### TC-API-V1-GET-001 列表测试项·默认查询

| 项 | 内容 |
|----|------|
| 目标 | 无 query 时默认分页 |
| 前置 | 种子 `demo` 在 |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `GET /api/v1` |
| 期望 | HTTP 200；`data.items` 含 `demo` / `Alice` / `20`；`page` 为 `1`；`pageSize` 为 `10`；`total` ≥ 1 |
| 关联 | `testListQuerySchema` 默认值；`listTestItems` |
| 优先级 | P0 |

### TC-API-V1-GET-002 列表测试项·name 子串命中

| 项 | 内容 |
|----|------|
| 目标 | `name` 忽略大小写包含匹配 |
| 前置 | 种子 `Alice` 在 |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `GET /api/v1?name=ali` |
| 期望 | HTTP 200；`items` 每项 `name` 含 `ali`（忽略大小写）；含 `Alice` |
| 关联 | `listTestItems` |
| 优先级 | P1 |

### TC-API-V1-GET-003 列表测试项·name 无命中

| 项 | 内容 |
|----|------|
| 目标 | 无匹配时空列表 |
| 前置 | 无 `name` 含 `zzz` |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `GET /api/v1?name=zzz` |
| 期望 | HTTP 200；`items` 为 `[]`；`total` 为 `0` |
| 关联 | `listTestItems` |
| 优先级 | P1 |

### TC-API-V1-GET-004 列表测试项·name 为空串

| 项 | 内容 |
|----|------|
| 目标 | 出现的 `name` 至少 1 字符 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `GET /api/v1?name=` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `testListQuerySchema.name`（`min(1)`） |
| 优先级 | P0 |

### TC-API-V1-GET-005 列表测试项·minAge 合法下界

| 项 | 内容 |
|----|------|
| 目标 | `minAge=0` 合法，种子不被滤 |
| 前置 | 种子 `age=20` |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `GET /api/v1?minAge=0` |
| 期望 | HTTP 200；`items` 含 `demo` |
| 关联 | `testListQuerySchema.minAge`（`min(0)`） |
| 优先级 | P1 |

### TC-API-V1-GET-006 列表测试项·minAge 低于下界

| 项 | 内容 |
|----|------|
| 目标 | `minAge < 0` 校验失败 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `GET /api/v1?minAge=-1` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `testListQuerySchema.minAge` |
| 优先级 | P1 |

### TC-API-V1-GET-007 列表测试项·minAge 无法 coerce

| 项 | 内容 |
|----|------|
| 目标 | 非数字 `minAge` 校验失败 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `GET /api/v1?minAge=abc` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `testListQuerySchema.minAge`；`parseSearchParams` |
| 优先级 | P2 |

### TC-API-V1-GET-008 列表测试项·minAge 滤掉种子

| 项 | 内容 |
|----|------|
| 目标 | 只留 `age >= minAge` |
| 前置 | 种子 `age=20` |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `GET /api/v1?minAge=21` |
| 期望 | HTTP 200；`items` 不含 `demo` |
| 关联 | `listTestItems` |
| 优先级 | P1 |

### TC-API-V1-GET-009 列表测试项·name 与 minAge 同时生效

| 项 | 内容 |
|----|------|
| 目标 | 两过滤取交集 |
| 前置 | 种子 `Alice/20` |
| 层级 | 单元 |
| 方法 | 决策表 |
| 步骤 | 1. `GET /api/v1?name=Alice&minAge=20` 2. `GET /api/v1?name=Alice&minAge=21` |
| 期望 | 两步 HTTP 200；第一步含 `demo`；第二步不含 |
| 关联 | `listTestItems` |
| 优先级 | P1 |

### TC-API-V1-GET-010 列表测试项·pageSize 合法上界

| 项 | 内容 |
|----|------|
| 目标 | `pageSize=50` 合法 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `GET /api/v1?pageSize=50` |
| 期望 | HTTP 200；`data.pageSize` 为 `50` |
| 关联 | `testListQuerySchema.pageSize`（`max(50)`） |
| 优先级 | P1 |

### TC-API-V1-GET-011 列表测试项·pageSize 超过上界

| 项 | 内容 |
|----|------|
| 目标 | `pageSize=51` 校验失败 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `GET /api/v1?pageSize=51` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `testListQuerySchema.pageSize` |
| 优先级 | P1 |

### TC-API-V1-GET-012 列表测试项·page 或 pageSize 非正

| 项 | 内容 |
|----|------|
| 目标 | `page` 为正、`pageSize` ≥ 1 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `GET /api/v1?page=0` 2. `GET /api/v1?pageSize=0` |
| 期望 | 两步 HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `page.positive()`；`pageSize.min(1)` |
| 优先级 | P1 |

### TC-API-V1-GET-013 列表测试项·分页切片

| 项 | 内容 |
|----|------|
| 目标 | 按 `page` / `pageSize` 切片 |
| 前置 | 至少 1 条 |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `GET /api/v1?page=1&pageSize=1` |
| 期望 | HTTP 200；`items.length` ≤ 1；`page` 为 `1`；`pageSize` 为 `1`；`total` ≥ `items.length` |
| 关联 | `listTestItems` |
| 优先级 | P1 |

### TC-API-V1-POST-001 创建测试项·合法入参

| 项 | 内容 |
|----|------|
| 目标 | 合法 body 创建成功 |
| 前置 | 不存在 `name=Bob` |
| 层级 | 单元 |
| 方法 | 等价类、边界值 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":"Bob","age":18}` |
| 期望 | HTTP 200；`data.id` 非空；`name` 为 `Bob`；`age` 为 `18` |
| 关联 | `testCreateBodySchema`；`createTestItem` |
| 优先级 | P0 |

### TC-API-V1-POST-002 创建测试项·age 低于下界

| 项 | 内容 |
|----|------|
| 目标 | `age < 18` 校验失败 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":"Bob","age":17}` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `testCreateBodySchema.age`（`min(18)`） |
| 优先级 | P0 |

### TC-API-V1-POST-003 创建测试项·age 合法上界

| 项 | 内容 |
|----|------|
| 目标 | `age=150` 可创建 |
| 前置 | 不存在所用 `name` |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":"MaxAge","age":150}` |
| 期望 | HTTP 200；`data.age` 为 `150` |
| 关联 | `testCreateBodySchema.age`（`max(150)`） |
| 优先级 | P1 |

### TC-API-V1-POST-004 创建测试项·age 超过上界

| 项 | 内容 |
|----|------|
| 目标 | `age=151` 校验失败 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":"TooOld","age":151}` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `testCreateBodySchema.age` |
| 优先级 | P1 |

### TC-API-V1-POST-005 创建测试项·缺字段

| 项 | 内容 |
|----|------|
| 目标 | `name`、`age` 必填 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `POST /api/v1` Body: `{"age":18}` 2. `POST /api/v1` Body: `{"name":"NoAge"}` |
| 期望 | 两步 HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `testCreateBodySchema` |
| 优先级 | P1 |

### TC-API-V1-POST-006 创建测试项·name 经 trim 为空

| 项 | 内容 |
|----|------|
| 目标 | trim 后空 `name` 非法 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":" ","age":18}` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `name.trim().min(1)` |
| 优先级 | P1 |

### TC-API-V1-POST-007 创建测试项·name 超过上界

| 项 | 内容 |
|----|------|
| 目标 | `name` 长度 51 非法 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":"<51 个字符 a>","age":18}` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `name.max(50)` |
| 优先级 | P1 |

### TC-API-V1-POST-008 创建测试项·name 合法上界

| 项 | 内容 |
|----|------|
| 目标 | `name` 长度 50 可创建 |
| 前置 | 该 50 字 `name` 未占用 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":"<50 个字符 a>","age":18}` |
| 期望 | HTTP 200；`data.name` 长度 50 |
| 关联 | `name.max(50)` |
| 优先级 | P1 |

### TC-API-V1-POST-009 创建测试项·name 去空白

| 项 | 内容 |
|----|------|
| 目标 | 两端空白 trim 后入库 |
| 前置 | 不存在 `name=TrimMe` |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":" TrimMe ","age":18}` |
| 期望 | HTTP 200；`data.name` 为 `TrimMe` |
| 关联 | `name.trim()` |
| 优先级 | P1 |

### TC-API-V1-POST-010 创建测试项·name 冲突

| 项 | 内容 |
|----|------|
| 目标 | 同名冲突 |
| 前置 | 种子 `Alice` 在 |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":"Alice","age":18}` |
| 期望 | HTTP 409；`error.code` 为 `Conflict` |
| 关联 | `createTestItem` |
| 优先级 | P0 |

### TC-API-V1-POST-011 创建测试项·非法 JSON

| 项 | 内容 |
|----|------|
| 目标 | 非法 JSON 为 400 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `POST /api/v1` `Content-Type: application/json` Body: `{name:` |
| 期望 | HTTP 400；`error.code` 为 `Bad Request` |
| 关联 | `parseBody` |
| 优先级 | P0 |

---

## 成员 `/api/v1/:id`

### TC-API-V1-GETID-001 按 id 查询·存在

| 项 | 内容 |
|----|------|
| 目标 | 存在的 id 返回该资源 |
| 前置 | 种子 `demo` 未被改 |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `GET /api/v1/demo` |
| 期望 | HTTP 200；`data` 为 `{ id: "demo", name: "Alice", age: 20 }` |
| 关联 | `getTestItem` |
| 优先级 | P0 |

### TC-API-V1-GETID-002 按 id 查询·不存在

| 项 | 内容 |
|----|------|
| 目标 | 未知 id 为 404 |
| 前置 | 不存在 `id=missing` |
| 层级 | 单元 |
| 方法 | 状态迁移 |
| 步骤 | 1. `GET /api/v1/missing` |
| 期望 | HTTP 404；`error.code` 为 `Not Found` |
| 关联 | `getTestItem` |
| 优先级 | P0 |

### TC-API-V1-GETID-003 按 id 查询·id 超长

| 项 | 内容 |
|----|------|
| 目标 | `id` 长度 > 64 校验失败 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `GET /api/v1/<65 个字符 a>` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `testIdParamsSchema.id.max(64)` |
| 优先级 | P0 |

### TC-API-V1-PUT-001 全量替换·合法入参

| 项 | 内容 |
|----|------|
| 目标 | 完整替换，id 不变 |
| 前置 | `demo` 在；本条会改种子 `age`，依赖 `Alice/20` 的列表用例须先跑或先重启 |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `PUT /api/v1/demo` Body: `{"name":"Alice","age":21}` |
| 期望 | HTTP 200；`id` 为 `demo`；`name` 为 `Alice`；`age` 为 `21` |
| 关联 | `testReplaceBodySchema`；`replaceTestItem` |
| 优先级 | P0 |

### TC-API-V1-PUT-002 全量替换·资源不存在

| 项 | 内容 |
|----|------|
| 目标 | 不存在 id 替换失败 |
| 前置 | 不存在 `id=missing` |
| 层级 | 单元 |
| 方法 | 状态迁移 |
| 步骤 | 1. `PUT /api/v1/missing` Body: `{"name":"Ghost","age":18}` |
| 期望 | HTTP 404；`error.code` 为 `Not Found` |
| 关联 | `replaceTestItem` |
| 优先级 | P0 |

### TC-API-V1-PUT-003 全量替换·body 形状不符

| 项 | 内容 |
|----|------|
| 目标 | 替换 body 与创建相同，越界 422 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `PUT /api/v1/demo` Body: `{"name":"Alice","age":17}` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `testReplaceBodySchema` |
| 优先级 | P0 |

### TC-API-V1-PUT-004 全量替换·非法 JSON

| 项 | 内容 |
|----|------|
| 目标 | 非法 JSON 为 400 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `PUT /api/v1/demo` Body: `{` |
| 期望 | HTTP 400；`error.code` 为 `Bad Request` |
| 关联 | `parseBody` |
| 优先级 | P0 |

### TC-API-V1-PUT-005 全量替换·name 冲突

| 项 | 内容 |
|----|------|
| 目标 | 改成其他项已占用 `name` 则冲突 |
| 前置 | `demo/Alice`；另有 `Bob`（可先 POST） |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `PUT /api/v1/demo` Body: `{"name":"Bob","age":20}` |
| 期望 | HTTP 409；`error.code` 为 `Conflict` |
| 关联 | `replaceTestItem` |
| 优先级 | P0 |

### TC-API-V1-PUT-006 全量替换·保留自身 name

| 项 | 内容 |
|----|------|
| 目标 | 提交自身已有 `name` 不冲突 |
| 前置 | `demo/Alice` |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `PUT /api/v1/demo` Body: `{"name":"Alice","age":22}` |
| 期望 | HTTP 200；`name` 为 `Alice`；`age` 为 `22` |
| 关联 | `replaceTestItem` |
| 优先级 | P1 |

### TC-API-V1-PATCH-001 部分更新·单字段

| 项 | 内容 |
|----|------|
| 目标 | 只改一字段，其余不变 |
| 前置 | 先 POST `PatchMe/18`，勿改种子 |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":"PatchMe","age":18}` 记下 `id` 2. `PATCH /api/v1/{id}` Body: `{"age":30}` |
| 期望 | 两步 HTTP 200；`name` 仍为 `PatchMe`；`age` 为 `30` |
| 关联 | `testPatchBodySchema`；`patchTestItem` |
| 优先级 | P0 |

### TC-API-V1-PATCH-002 部分更新·空对象

| 项 | 内容 |
|----|------|
| 目标 | `{}` 校验失败 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `PATCH /api/v1/demo` Body: `{}` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `testPatchBodySchema` |
| 优先级 | P0 |

### TC-API-V1-PATCH-003 部分更新·资源不存在

| 项 | 内容 |
|----|------|
| 目标 | 合法 body、未知 id 为 404 |
| 前置 | 不存在 `id=missing` |
| 层级 | 单元 |
| 方法 | 状态迁移 |
| 步骤 | 1. `PATCH /api/v1/missing` Body: `{"age":30}` |
| 期望 | HTTP 404；`error.code` 为 `Not Found` |
| 关联 | `patchTestItem` |
| 优先级 | P0 |

### TC-API-V1-PATCH-004 部分更新·非法 JSON

| 项 | 内容 |
|----|------|
| 目标 | 非法 JSON 为 400 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `PATCH /api/v1/demo` Body: `{` |
| 期望 | HTTP 400；`error.code` 为 `Bad Request` |
| 关联 | `parseBody` |
| 优先级 | P0 |

### TC-API-V1-PATCH-005 部分更新·name 冲突

| 项 | 内容 |
|----|------|
| 目标 | `name` 改成其他项已占用值则冲突 |
| 前置 | `demo/Alice`；另有 `Bob` |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `PATCH /api/v1/demo` Body: `{"name":"Bob"}` |
| 期望 | HTTP 409；`error.code` 为 `Conflict` |
| 关联 | `patchTestItem` |
| 优先级 | P0 |

### TC-API-V1-DELETE-001 删除·存在的项

| 项 | 内容 |
|----|------|
| 目标 | 删除已有项并返回被删资源 |
| 前置 | 先 POST `DelMe/18`，勿删种子 |
| 层级 | 单元 |
| 方法 | 状态迁移 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":"DelMe","age":18}` 记下 `id` 2. `DELETE /api/v1/{id}` |
| 期望 | HTTP 200；`data.id` 与创建一致；`name` 为 `DelMe` |
| 关联 | `deleteTestItem` |
| 优先级 | P0 |

### TC-API-V1-DELETE-002 删除·不存在

| 项 | 内容 |
|----|------|
| 目标 | 未知 id 删除失败 |
| 前置 | 不存在 `id=missing` |
| 层级 | 单元 |
| 方法 | 状态迁移 |
| 步骤 | 1. `DELETE /api/v1/missing` |
| 期望 | HTTP 404；`error.code` 为 `Not Found` |
| 关联 | `deleteTestItem` |
| 优先级 | P0 |

### TC-API-V1-DELETE-003 删除·id 超长

| 项 | 内容 |
|----|------|
| 目标 | `id` 超长 422 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `DELETE /api/v1/<65 个字符 a>` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `testIdParamsSchema` |
| 优先级 | P0 |

---

## 场景

### TC-API-V1-SCENE-001 测试项·CRUD 闭环

| 项 | 内容 |
|----|------|
| 目标 | 创建 → 列表可见 → 改后读一致 → 删后再读 404 |
| 前置 | 不存在 `name=Loop` |
| 层级 | 单元 |
| 方法 | 场景法、状态迁移 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":"Loop","age":18}` 记下 `id` 2. `GET /api/v1?name=Loop` 3. `PATCH /api/v1/{id}` Body: `{"age":19}` 4. `GET /api/v1/{id}` 5. `DELETE /api/v1/{id}` 6. `GET /api/v1/{id}` |
| 期望 | 1–5 HTTP 200；第 2 步 `items` 含该 `id`；第 4 步 `name=Loop`、`age=19`；第 6 步 HTTP 404、`error.code` 为 `Not Found` |
| 关联 | `createTestItem`；`listTestItems`；`patchTestItem`；`getTestItem`；`deleteTestItem` |
| 优先级 | P1 |
