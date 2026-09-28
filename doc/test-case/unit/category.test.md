# 分类 · `/api/v1/categories`

约定见 [../README.md](../README.md)。接口单元测试：直接调用下列 Route Handler，断言 HTTP 状态与 `ApiResult`。契约索引见 [分类模块](../../detail-design/category.md)。

## 环境

- 集合 `GET` / `POST /api/v1/categories`；成员 `GET` / `PATCH` / `DELETE /api/v1/categories/:id`
- 种子恰好一行系统分类：`name=未分类`，`slug=uncategorized`，`parentId=null`，`isActive=true`，`isSystem=true`
- 写会残留。创建用未占用的 `name` / `slug`。系统分类不可删；[PATCH-003](#tc-api-categories-patch-003-部分更新系统分类) 会改它的简介
- 不覆盖：鉴权（401/403）、标签 CRUD、文章编辑、前台 301、`listActiveTree` / `getBySlug`（无本文件入口）
- 系统分类缺失或不止一行会 500，不能经这些入口造出，不进分母。并发下的唯一约束同理，不单列

## 覆盖清单

### 1. 入口 × 结果（P0）

| 入口 | 主成功 | Schema 422 | 协议 400 | 业务失败 |
|------|--------|------------|----------|----------|
| `GET /api/v1/categories` | [GET-001](#tc-api-categories-get-001-列表分类森林) | — | — | — |
| `POST /api/v1/categories` | [POST-001](#tc-api-categories-post-001-创建根分类合法入参) | [POST-003](#tc-api-categories-post-003-创建分类形状不符) | [POST-009](#tc-api-categories-post-009-创建分类非法-json) | 409 [POST-004](#tc-api-categories-post-004-创建分类name-冲突)、[POST-005](#tc-api-categories-post-005-创建分类slug-冲突)；404 [POST-006](#tc-api-categories-post-006-创建分类父分类不存在)；400 [POST-007](#tc-api-categories-post-007-创建分类父级为系统分类) |
| `GET /api/v1/categories/:id` | [GETID-001](#tc-api-categories-getid-001-分类详情字段) | [GETID-003](#tc-api-categories-getid-003-分类详情id-非-uuid) | — | 404 [GETID-002](#tc-api-categories-getid-002-分类详情不存在) |
| `PATCH /api/v1/categories/:id` | [PATCH-001](#tc-api-categories-patch-001-部分更新简介与父级) | [PATCH-004](#tc-api-categories-patch-004-部分更新空对象)；[PATCH-008](#tc-api-categories-patch-008-部分更新id-非-uuid) | [PATCH-006](#tc-api-categories-patch-006-部分更新非法-json) | 400 [PATCH-002](#tc-api-categories-patch-002-部分更新挂到子孙)；409 [PATCH-003](#tc-api-categories-patch-003-部分更新系统分类)；404 [PATCH-007](#tc-api-categories-patch-007-部分更新不存在) |
| `DELETE /api/v1/categories/:id` | [DELETE-001](#tc-api-categories-delete-001-删除并迁帖) | [DELETE-005](#tc-api-categories-delete-005-删除id-非-uuid) | — | 409 [DELETE-002](#tc-api-categories-delete-002-删除系统分类)、[DELETE-003](#tc-api-categories-delete-003-删除仍有子分类)；404 [DELETE-004](#tc-api-categories-delete-004-删除不存在) |

列表无 query、无 body。`id` 非 uuid 在三个成员入口各记一条。

### 2. Schema × 等价类

| 契约 | 代表 | TC |
|------|------|-----|
| `name` trim 后合法 | `" 新闻 "` → `新闻` | POST-001 |
| `name` trim 后为空 | `"   "` | POST-003 |
| `name` 恰 64 / 超过 64 | 64 个 `a` / 65 个 `a` | POST-013 / POST-010 |
| `slug` trim、小写、格式合法 | `"Local-News"` → `local-news` | POST-001 |
| `slug` 非法 | `bad_slug` | POST-003 |
| `slug` 先小写再判重 | `NEWS` 撞已有 `news` | POST-005 |
| `description` 缺省 → `null` | 不传 | POST-001 |
| `description` 空串 → `null` | `""` | POST-011 |
| `description` 超过 500 | 501 字符 | POST-012 |
| `parentId` 缺省为根 | 不传 | POST-001 |
| `parentId` 非 uuid | `not-a-uuid` | POST-003 |
| `isActive` 缺省 `true` | 不传 | POST-001 |
| `isActive: false` 可创建 | `false` | POST-008 |
| 更新至少一字段 | `{}` | PATCH-004 |
| 路径 `id` 为 uuid | `not-a-uuid` | GETID-003、PATCH-008、DELETE-005 |

### 3. Service × 状态

| 契约 | TC |
|------|-----|
| 列表为森林；同级 `createdAt`、`name` 升序；含系统分类与停用分类 | GET-001 |
| `name` 唯一 · 创建 | POST-004 |
| `slug` 唯一 · 创建 | POST-005 |
| `name` 唯一 · 更新 | PATCH-009 |
| 父分类不存在 · 创建 | POST-006 |
| 父分类不存在 · 更新 | PATCH-010 |
| 父级是系统分类 · 创建 | POST-007 |
| 父级是系统分类 · 更新 | PATCH-011 |
| 挂到自身或子孙 | PATCH-002 |
| 系统分类：相同 name 视为未改；改 name 拒绝；只改简介允许 | PATCH-003 |
| 停用后管理端列表仍在 | POST-008、GET-001 |
| 停用后文章仍挂在该分类 | PATCH-005 |
| 删除迁帖并去掉该分类标签 | DELETE-001 |
| 系统分类不可删 | DELETE-002 |
| 仍有子分类不可删 | DELETE-003 |
| id 不存在 · 读 / 改 / 删 | GETID-002、PATCH-007、DELETE-004 |

### 4. 场景

| 契约 | TC |
|------|-----|
| 创建 → 列表可见 → 改 → 再查一致 → 删 → 再查 404 | SCENE-001 |

## 执行清单

| 完成 | 结果 | 优先级 | TC | 标题 | 备注 |
|------|------|--------|-----|------|------|
| [ ] | 未测 | P0 | [GET-001](#tc-api-categories-get-001-列表分类森林) | 列表分类·森林 | |
| [ ] | 未测 | P0 | [POST-001](#tc-api-categories-post-001-创建根分类合法入参) | 创建根分类·合法入参 | |
| [ ] | 未测 | P0 | [POST-002](#tc-api-categories-post-002-创建分类挂到现存父级) | 创建分类·挂到现存父级 | |
| [ ] | 未测 | P0 | [POST-003](#tc-api-categories-post-003-创建分类形状不符) | 创建分类·形状不符 | |
| [ ] | 未测 | P0 | [POST-004](#tc-api-categories-post-004-创建分类name-冲突) | 创建分类·name 冲突 | |
| [ ] | 未测 | P0 | [POST-005](#tc-api-categories-post-005-创建分类slug-冲突) | 创建分类·slug 冲突 | |
| [ ] | 未测 | P0 | [POST-006](#tc-api-categories-post-006-创建分类父分类不存在) | 创建分类·父分类不存在 | |
| [ ] | 未测 | P0 | [POST-007](#tc-api-categories-post-007-创建分类父级为系统分类) | 创建分类·父级为系统分类 | |
| [ ] | 未测 | P0 | [POST-008](#tc-api-categories-post-008-创建分类停用) | 创建分类·停用 | |
| [ ] | 未测 | P0 | [POST-009](#tc-api-categories-post-009-创建分类非法-json) | 创建分类·非法 JSON | |
| [ ] | 未测 | P1 | [POST-010](#tc-api-categories-post-010-创建分类name-超过上界) | 创建分类·name 超过上界 | |
| [ ] | 未测 | P1 | [POST-011](#tc-api-categories-post-011-创建分类简介空串) | 创建分类·简介空串 | |
| [ ] | 未测 | P1 | [POST-012](#tc-api-categories-post-012-创建分类简介超过上界) | 创建分类·简介超过上界 | |
| [ ] | 未测 | P1 | [POST-013](#tc-api-categories-post-013-创建分类name-合法上界) | 创建分类·name 合法上界 | |
| [ ] | 未测 | P0 | [GETID-001](#tc-api-categories-getid-001-分类详情字段) | 分类详情·字段 | |
| [ ] | 未测 | P0 | [GETID-002](#tc-api-categories-getid-002-分类详情不存在) | 分类详情·不存在 | |
| [ ] | 未测 | P0 | [GETID-003](#tc-api-categories-getid-003-分类详情id-非-uuid) | 分类详情·id 非 uuid | |
| [ ] | 未测 | P0 | [PATCH-001](#tc-api-categories-patch-001-部分更新简介与父级) | 部分更新·简介与父级 | |
| [ ] | 未测 | P0 | [PATCH-002](#tc-api-categories-patch-002-部分更新挂到子孙) | 部分更新·挂到子孙 | |
| [ ] | 未测 | P0 | [PATCH-003](#tc-api-categories-patch-003-部分更新系统分类) | 部分更新·系统分类 | |
| [ ] | 未测 | P0 | [PATCH-004](#tc-api-categories-patch-004-部分更新空对象) | 部分更新·空对象 | |
| [ ] | 未测 | P0 | [PATCH-005](#tc-api-categories-patch-005-部分更新停用) | 部分更新·停用 | |
| [ ] | 未测 | P0 | [PATCH-006](#tc-api-categories-patch-006-部分更新非法-json) | 部分更新·非法 JSON | |
| [ ] | 未测 | P0 | [PATCH-007](#tc-api-categories-patch-007-部分更新不存在) | 部分更新·不存在 | |
| [ ] | 未测 | P0 | [PATCH-008](#tc-api-categories-patch-008-部分更新id-非-uuid) | 部分更新·id 非 uuid | |
| [ ] | 未测 | P1 | [PATCH-009](#tc-api-categories-patch-009-部分更新name-冲突) | 部分更新·name 冲突 | |
| [ ] | 未测 | P1 | [PATCH-010](#tc-api-categories-patch-010-部分更新父分类不存在) | 部分更新·父分类不存在 | |
| [ ] | 未测 | P1 | [PATCH-011](#tc-api-categories-patch-011-部分更新父级为系统分类) | 部分更新·父级为系统分类 | |
| [ ] | 未测 | P0 | [DELETE-001](#tc-api-categories-delete-001-删除并迁帖) | 删除·迁帖 | |
| [ ] | 未测 | P0 | [DELETE-002](#tc-api-categories-delete-002-删除系统分类) | 删除·系统分类 | |
| [ ] | 未测 | P0 | [DELETE-003](#tc-api-categories-delete-003-删除仍有子分类) | 删除·仍有子分类 | |
| [ ] | 未测 | P0 | [DELETE-004](#tc-api-categories-delete-004-删除不存在) | 删除·不存在 | |
| [ ] | 未测 | P0 | [DELETE-005](#tc-api-categories-delete-005-删除id-非-uuid) | 删除·id 非 uuid | |
| [ ] | 未测 | P1 | [SCENE-001](#tc-api-categories-scene-001-分类-crud-闭环) | 分类·CRUD 闭环 | |

---

## 集合 `/api/v1/categories`

### TC-API-CATEGORIES-GET-001 列表分类·森林

| 项 | 内容 |
|----|------|
| 目标 | 只在根上返回森林；同级按 `createdAt`、`name` 升序；含系统分类与已停用分类 |
| 前置 | 种子「未分类」在；另有一条 `isActive=false` 的根，以及按创建顺序的两个普通根 |
| 层级 | 单元 |
| 方法 | 等价类、状态迁移 |
| 步骤 | 1. `GET /api/v1/categories` |
| 期望 | HTTP 200；`data` 为根数组，子节点只出现在 `children`；含 `slug=uncategorized` 且 `isSystem` 为 `true`；含该停用分类；同级 `createdAt` 升序，再按 `name` 升序 |
| 关联 | `CategoryService.listTree`；`buildCategoryTree` |
| 优先级 | P0 |

### TC-API-CATEGORIES-POST-001 创建根分类·合法入参

| 项 | 内容 |
|----|------|
| 目标 | 合法 body 创建根分类；`name` 去空白，`slug` 变小写 |
| 前置 | 不存在 `name=新闻`、`slug=local-news` |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":" 新闻 ","slug":"Local-News"}` |
| 期望 | HTTP 200；`data.id` 为 uuid；`data.name` 为 `新闻`；`data.slug` 为 `local-news`；`data.parentId` 为 `null`；`data.description` 为 `null`；`data.isActive` 为 `true`；`data.isSystem` 为 `false`；`data` 含 `createdAt`、`updatedAt`、`postCount`、`tagCount`，不含 `children` |
| 关联 | `createCategorySchema`；`CategoryService.create`；详细设计 CAT-POST-001 |
| 优先级 | P0 |

### TC-API-CATEGORIES-POST-002 创建分类·挂到现存父级

| 项 | 内容 |
|----|------|
| 目标 | `parentId` 指向现存非系统分类时，列表里该节点在父级 `children` |
| 前置 | 不存在 `slug=parent-a`、`slug=child-a` |
| 层级 | 单元 |
| 方法 | 状态迁移 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"父甲","slug":"parent-a"}` 记下 `id` 2. `POST /api/v1/categories` Body: `{"name":"子甲","slug":"child-a","parentId":"<父 id>"}` 3. `GET /api/v1/categories` |
| 期望 | 第 1、2 步 HTTP 200；第 2 步 `data.parentId` 为父 id；第 3 步该子节点在父级 `children` 中，不在根数组 |
| 关联 | `CategoryService.create`；详细设计 CAT-POST-002 |
| 优先级 | P0 |

### TC-API-CATEGORIES-POST-003 创建分类·形状不符

| 项 | 内容 |
|----|------|
| 目标 | 空 name、非法 slug、非 uuid 的 `parentId` 校验失败 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 等价类、边界值 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"   ","slug":"ok-name"}` 2. `POST /api/v1/categories` Body: `{"name":"Ok","slug":"bad_slug"}` 3. `POST /api/v1/categories` Body: `{"name":"Ok","slug":"ok-id","parentId":"not-a-uuid"}` |
| 期望 | 三步皆 HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `createCategorySchema`；详细设计 CAT-POST-003 |
| 优先级 | P0 |

### TC-API-CATEGORIES-POST-004 创建分类·name 冲突

| 项 | 内容 |
|----|------|
| 目标 | `name` 与其它行冲突 |
| 前置 | 已有 `name=重名` |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"重名","slug":"other-slug"}` |
| 期望 | HTTP 409；`error.code` 为 `Conflict`；`error.message` 为 `分类名称已存在` |
| 关联 | `CategoryService.create`；详细设计 CAT-POST-004 |
| 优先级 | P0 |

### TC-API-CATEGORIES-POST-005 创建分类·slug 冲突

| 项 | 内容 |
|----|------|
| 目标 | `slug` 先变成小写再判重 |
| 前置 | 已有 `slug=news` |
| 层级 | 单元 |
| 方法 | 等价类、错误猜测 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"另一新闻","slug":"NEWS"}` |
| 期望 | HTTP 409；`error.code` 为 `Conflict`；`error.message` 为 `分类 slug 已存在` |
| 关联 | `createCategorySchema.slug`；详细设计 CAT-POST-005 |
| 优先级 | P0 |

### TC-API-CATEGORIES-POST-006 创建分类·父分类不存在

| 项 | 内容 |
|----|------|
| 目标 | `parentId` 无对应行 |
| 前置 | 不存在 `id=00000000-0000-4000-8000-000000000001` |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"孤儿","slug":"orphan","parentId":"00000000-0000-4000-8000-000000000001"}` |
| 期望 | HTTP 404；`error.code` 为 `Not Found`；`error.message` 为 `父分类不存在` |
| 关联 | `CategoryService.create`；详细设计 CAT-POST-006 |
| 优先级 | P0 |

### TC-API-CATEGORIES-POST-007 创建分类·父级为系统分类

| 项 | 内容 |
|----|------|
| 目标 | 不能在系统分类下建子分类 |
| 前置 | 种子「未分类」在 |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `GET /api/v1/categories` 取 `slug=uncategorized` 的 `id` 2. `POST /api/v1/categories` Body: `{"name":"系统子级","slug":"under-system","parentId":"<系统 id>"}` |
| 期望 | 第 2 步 HTTP 400；`error.code` 为 `Bad Request`；`error.message` 为 `不能在系统分类下创建子分类` |
| 关联 | `CategoryService.create`；详细设计 CAT-POST-007 |
| 优先级 | P0 |

### TC-API-CATEGORIES-POST-008 创建分类·停用

| 项 | 内容 |
|----|------|
| 目标 | `isActive: false` 创建成功，管理端列表仍返回该节点 |
| 前置 | 不存在 `slug=paused` |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"停用","slug":"paused","isActive":false}` 2. `GET /api/v1/categories` |
| 期望 | 第 1 步 HTTP 200；`data.isActive` 为 `false`；`data.isSystem` 为 `false`；第 2 步根或某个 `children` 中含该 `id` |
| 关联 | `createCategorySchema.isActive`；详细设计 CAT-POST-008 |
| 优先级 | P0 |

### TC-API-CATEGORIES-POST-009 创建分类·非法 JSON

| 项 | 内容 |
|----|------|
| 目标 | body 不是 JSON |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{` |
| 期望 | HTTP 400；`error.code` 为 `Bad Request` |
| 关联 | `parseBody` |
| 优先级 | P0 |

### TC-API-CATEGORIES-POST-010 创建分类·name 超过上界

| 项 | 内容 |
|----|------|
| 目标 | `name` 超过 64 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"<65 个 a>","slug":"name-long"}` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `createCategorySchema.name`（`max(64)`） |
| 优先级 | P1 |

### TC-API-CATEGORIES-POST-011 创建分类·简介空串

| 项 | 内容 |
|----|------|
| 目标 | 空串简介入库为 `null` |
| 前置 | 不存在 `slug=blank-desc` |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"空简介","slug":"blank-desc","description":""}` |
| 期望 | HTTP 200；`data.description` 为 `null` |
| 关联 | `createCategorySchema.description` |
| 优先级 | P1 |

### TC-API-CATEGORIES-POST-012 创建分类·简介超过上界

| 项 | 内容 |
|----|------|
| 目标 | `description` 超过 500 |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"长简介","slug":"desc-long","description":"<501 个 a>"}` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `createCategorySchema.description`（`max(500)`） |
| 优先级 | P1 |

### TC-API-CATEGORIES-POST-013 创建分类·name 合法上界

| 项 | 内容 |
|----|------|
| 目标 | `name` 恰 64 可创建 |
| 前置 | 不存在该 64 字符 `name` |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"<64 个 a>","slug":"name-64"}` |
| 期望 | HTTP 200；`data.name` 长度为 64 |
| 关联 | `createCategorySchema.name` |
| 优先级 | P1 |

---

## 成员 `/api/v1/categories/:id`

### TC-API-CATEGORIES-GETID-001 分类详情·字段

| 项 | 内容 |
|----|------|
| 目标 | 详情含时间、启用、系统标记与计数，不含 `children` |
| 前置 | 已有一条普通分类 |
| 层级 | 单元 |
| 方法 | 等价类 |
| 步骤 | 1. `GET /api/v1/categories/{id}` |
| 期望 | HTTP 200；`data` 含 `createdAt`、`updatedAt`、`isActive`、`isSystem`、`postCount`、`tagCount`；不含 `children` |
| 关联 | `toCategoryDetailVO`；详细设计 CAT-GETID-001 |
| 优先级 | P0 |

### TC-API-CATEGORIES-GETID-002 分类详情·不存在

| 项 | 内容 |
|----|------|
| 目标 | 未知 id |
| 前置 | 不存在 `id=00000000-0000-4000-8000-000000000002` |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `GET /api/v1/categories/00000000-0000-4000-8000-000000000002` |
| 期望 | HTTP 404；`error.code` 为 `Not Found`；`error.message` 为 `分类不存在` |
| 关联 | `CategoryService.getById`；详细设计 CAT-GETID-002 |
| 优先级 | P0 |

### TC-API-CATEGORIES-GETID-003 分类详情·id 非 uuid

| 项 | 内容 |
|----|------|
| 目标 | 路径 `id` 不是 uuid |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `GET /api/v1/categories/not-a-uuid` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `categoryIdParamsSchema` |
| 优先级 | P0 |

### TC-API-CATEGORIES-PATCH-001 部分更新·简介与父级

| 项 | 内容 |
|----|------|
| 目标 | 修改简介与父级成功，文章仍挂在本分类 |
| 前置 | 分类 C 下已有文章；另有两个非系统分类可作父级 |
| 层级 | 单元 |
| 方法 | 状态迁移 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"父一","slug":"patch-p1"}` 2. `POST /api/v1/categories` Body: `{"name":"父二","slug":"patch-p2"}` 3. `POST /api/v1/categories` Body: `{"name":"被移动","slug":"patch-c","parentId":"<父一 id>"}` 4. `PATCH /api/v1/categories/{C}` Body: `{"description":"新简介","parentId":"<父二 id>"}` 5. `GET /api/v1/categories/{C}` |
| 期望 | 第 4、5 步 HTTP 200；`description` 为 `新简介`；`parentId` 为父二；C 下文章的 `categoryId` 仍为 C |
| 关联 | `updateCategorySchema`；详细设计 CAT-PATCH-001 |
| 优先级 | P0 |

### TC-API-CATEGORIES-PATCH-002 部分更新·挂到子孙

| 项 | 内容 |
|----|------|
| 目标 | 不能把分类挂到自己的子孙（挂到自身同类） |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"祖","slug":"cyc-a"}` 2. `POST /api/v1/categories` Body: `{"name":"孙","slug":"cyc-b","parentId":"<祖 id>"}` 3. `PATCH /api/v1/categories/{祖}` Body: `{"parentId":"<孙 id>"}` |
| 期望 | 第 3 步 HTTP 400；`error.code` 为 `Bad Request`；`error.message` 为 `不能把分类移到自身或其子分类下` |
| 关联 | `CategoryService.update`；详细设计 CAT-PATCH-002 |
| 优先级 | P0 |

### TC-API-CATEGORIES-PATCH-003 部分更新·系统分类

| 项 | 内容 |
|----|------|
| 目标 | 重复提交当前 name 视为未改；改成别的 name 拒绝；只改简介成功。改 slug、`parentId`、`isActive` 与改 name 同类 |
| 前置 | 种子「未分类」在。本条会改简介 |
| 层级 | 单元 |
| 方法 | 决策表 |
| 步骤 | 1. `GET /api/v1/categories` 取 `slug=uncategorized` 的 `id` 2. `PATCH /api/v1/categories/{id}` Body: `{"name":"未分类"}` 3. `PATCH /api/v1/categories/{id}` Body: `{"name":"已分类"}` 4. `PATCH /api/v1/categories/{id}` Body: `{"description":"系统简介"}` |
| 期望 | 第 2 步 HTTP 200，`name` 仍为 `未分类`；第 3 步 HTTP 409，`error.code` 为 `Conflict`，`error.message` 为 `系统分类不可修改名称、slug、层级或启用状态`；第 4 步 HTTP 200，`description` 为 `系统简介`，`name` 仍为 `未分类`，`isSystem` 为 `true` |
| 关联 | `systemFieldsChanged`；详细设计 CAT-PATCH-003 |
| 优先级 | P0 |

### TC-API-CATEGORIES-PATCH-004 部分更新·空对象

| 项 | 内容 |
|----|------|
| 目标 | 没有任何字段则校验失败 |
| 前置 | 已有一条普通分类 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `PATCH /api/v1/categories/{id}` Body: `{}` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `updateCategorySchema`；详细设计 CAT-PATCH-004 |
| 优先级 | P0 |

### TC-API-CATEGORIES-PATCH-005 部分更新·停用

| 项 | 内容 |
|----|------|
| 目标 | 普通分类改为停用后仍在，其下文章不迁走 |
| 前置 | 普通分类下已有文章 |
| 层级 | 单元 |
| 方法 | 状态迁移 |
| 步骤 | 1. `PATCH /api/v1/categories/{id}` Body: `{"isActive":false}` 2. `GET /api/v1/categories/{id}` |
| 期望 | 两步 HTTP 200；`data.isActive` 为 `false`；这些文章的 `categoryId` 仍为该 id |
| 关联 | `CategoryService.update`；详细设计 CAT-PATCH-005 |
| 优先级 | P0 |

### TC-API-CATEGORIES-PATCH-006 部分更新·非法 JSON

| 项 | 内容 |
|----|------|
| 目标 | body 不是 JSON |
| 前置 | 已有一条普通分类 |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `PATCH /api/v1/categories/{id}` Body: `{` |
| 期望 | HTTP 400；`error.code` 为 `Bad Request` |
| 关联 | `parseBody` |
| 优先级 | P0 |

### TC-API-CATEGORIES-PATCH-007 部分更新·不存在

| 项 | 内容 |
|----|------|
| 目标 | 未知 id |
| 前置 | 不存在 `id=00000000-0000-4000-8000-000000000003` |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `PATCH /api/v1/categories/00000000-0000-4000-8000-000000000003` Body: `{"description":"x"}` |
| 期望 | HTTP 404；`error.code` 为 `Not Found`；`error.message` 为 `分类不存在` |
| 关联 | `CategoryService.update` |
| 优先级 | P0 |

### TC-API-CATEGORIES-PATCH-008 部分更新·id 非 uuid

| 项 | 内容 |
|----|------|
| 目标 | 路径 `id` 不是 uuid |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `PATCH /api/v1/categories/not-a-uuid` Body: `{"description":"x"}` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `categoryIdParamsSchema` |
| 优先级 | P0 |

### TC-API-CATEGORIES-PATCH-009 部分更新·name 冲突

| 项 | 内容 |
|----|------|
| 目标 | 改成其它行已占用的 `name` |
| 前置 | 已有 `name=占用名`；另有一条普通分类 |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `PATCH /api/v1/categories/{id}` Body: `{"name":"占用名"}` |
| 期望 | HTTP 409；`error.code` 为 `Conflict`；`error.message` 为 `分类名称已存在` |
| 关联 | `CategoryService.update` |
| 优先级 | P1 |

### TC-API-CATEGORIES-PATCH-010 部分更新·父分类不存在

| 项 | 内容 |
|----|------|
| 目标 | 新 `parentId` 无对应行 |
| 前置 | 已有一条普通分类；不存在 `id=00000000-0000-4000-8000-000000000004` |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `PATCH /api/v1/categories/{id}` Body: `{"parentId":"00000000-0000-4000-8000-000000000004"}` |
| 期望 | HTTP 404；`error.code` 为 `Not Found`；`error.message` 为 `父分类不存在` |
| 关联 | `CategoryService.update` |
| 优先级 | P1 |

### TC-API-CATEGORIES-PATCH-011 部分更新·父级为系统分类

| 项 | 内容 |
|----|------|
| 目标 | 不能改挂到系统分类下 |
| 前置 | 种子「未分类」在；另有一条普通分类 |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `GET /api/v1/categories` 取 `slug=uncategorized` 的 `id` 2. `PATCH /api/v1/categories/{普通 id}` Body: `{"parentId":"<系统 id>"}` |
| 期望 | 第 2 步 HTTP 400；`error.code` 为 `Bad Request`；`error.message` 为 `不能在系统分类下创建子分类` |
| 关联 | `CategoryService.update` |
| 优先级 | P1 |

### TC-API-CATEGORIES-DELETE-001 删除·迁帖

| 项 | 内容 |
|----|------|
| 目标 | 有文章和标签时，文章改挂系统分类，返回迁走篇数；该分类标签消失 |
| 前置 | 普通叶子分类下有文章与标签；种子「未分类」在。不调用文章、标签接口 |
| 层级 | 单元 |
| 方法 | 状态迁移 |
| 步骤 | 1. `DELETE /api/v1/categories/{id}` 2. `GET /api/v1/categories/{id}` |
| 期望 | 第 1 步 HTTP 200；`data.id` 为该 id；`data.migratedPostCount` 等于其下文章数；第 2 步 HTTP 404，`error.code` 为 `Not Found`。副作用：这些文章的 `categoryId` 变为系统分类且文章行仍在；该分类的标签与 `PostTag` 已删除 |
| 关联 | `CategoryService.delete`；详细设计 CAT-DELETE-001 |
| 优先级 | P0 |

### TC-API-CATEGORIES-DELETE-002 删除·系统分类

| 项 | 内容 |
|----|------|
| 目标 | 系统分类不可删，行仍在 |
| 前置 | 种子「未分类」在 |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `GET /api/v1/categories` 取 `slug=uncategorized` 的 `id` 2. `DELETE /api/v1/categories/{id}` 3. `GET /api/v1/categories/{id}` |
| 期望 | 第 2 步 HTTP 409；`error.code` 为 `Conflict`；`error.message` 为 `系统分类不可删除`；第 3 步 HTTP 200，`isSystem` 为 `true` |
| 关联 | `CategoryService.delete`；详细设计 CAT-DELETE-002 |
| 优先级 | P0 |

### TC-API-CATEGORIES-DELETE-003 删除·仍有子分类

| 项 | 内容 |
|----|------|
| 目标 | 先删叶子；父级仍在，其下文章不迁走 |
| 前置 | 父级下已有文章 |
| 层级 | 单元 |
| 方法 | 状态迁移 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"父留","slug":"keep-parent"}` 2. `POST /api/v1/categories` Body: `{"name":"子留","slug":"keep-child","parentId":"<父 id>"}` 3. `DELETE /api/v1/categories/{父 id}` 4. `GET /api/v1/categories/{父 id}` |
| 期望 | 第 3 步 HTTP 409；`error.code` 为 `Conflict`；`error.message` 为 `请先删除子分类`；第 4 步 HTTP 200；父级下文章的 `categoryId` 不变 |
| 关联 | `CategoryService.delete`；详细设计 CAT-DELETE-003 |
| 优先级 | P0 |

### TC-API-CATEGORIES-DELETE-004 删除·不存在

| 项 | 内容 |
|----|------|
| 目标 | 未知 id |
| 前置 | 不存在 `id=00000000-0000-4000-8000-000000000005` |
| 层级 | 单元 |
| 方法 | 错误猜测 |
| 步骤 | 1. `DELETE /api/v1/categories/00000000-0000-4000-8000-000000000005` |
| 期望 | HTTP 404；`error.code` 为 `Not Found`；`error.message` 为 `分类不存在` |
| 关联 | `CategoryService.delete`；详细设计 CAT-DELETE-004 |
| 优先级 | P0 |

### TC-API-CATEGORIES-DELETE-005 删除·id 非 uuid

| 项 | 内容 |
|----|------|
| 目标 | 路径 `id` 不是 uuid |
| 前置 | 无 |
| 层级 | 单元 |
| 方法 | 边界值 |
| 步骤 | 1. `DELETE /api/v1/categories/not-a-uuid` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `categoryIdParamsSchema` |
| 优先级 | P0 |

---

## 场景

### TC-API-CATEGORIES-SCENE-001 分类·CRUD 闭环

| 项 | 内容 |
|----|------|
| 目标 | 创建 → 列表可见 → 改后读一致 → 删后再读 404 |
| 前置 | 不存在 `slug=loop-cat` |
| 层级 | 单元 |
| 方法 | 场景法、状态迁移 |
| 步骤 | 1. `POST /api/v1/categories` Body: `{"name":"闭环","slug":"loop-cat"}` 记下 `id` 2. `GET /api/v1/categories` 3. `PATCH /api/v1/categories/{id}` Body: `{"description":"改过"}` 4. `GET /api/v1/categories/{id}` 5. `DELETE /api/v1/categories/{id}` 6. `GET /api/v1/categories/{id}` |
| 期望 | 第 1、3、4、5 步 HTTP 200；第 2 步根数组含该 `id`；第 4 步 `name` 为 `闭环`、`description` 为 `改过`；第 5 步 `data.migratedPostCount` 为 `0`；第 6 步 HTTP 404，`error.code` 为 `Not Found` |
| 关联 | `CategoryService` |
| 优先级 | P1 |
