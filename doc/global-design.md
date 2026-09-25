# 全局设计

## 统一错误异常处理

### 设计目标

1. **业务层只抛领域错误**，不直接拼 `Response` / Toast。
2. **入口层统一捕获、映射、响应**（API / Server Action / RSC）。
3. **可预期错误 vs 系统错误** 分流（`isOperational`）。
4. **前后端错误码一致**，前端 TanStack Query / 表单可稳定消费。

### 分层职责

```
业务 Service / DAO
    ↓ throw AppError / 子类
API 包装器 / Server Action 包装器
    ↓ 映射 → Result + statusCode + 日志
前端 Query / error.tsx
    ↓ 展示用户可读信息
```

| 层 | 做什么 | 不做什么 |
|---|---|---|
| Domain（`AppError`） | 表达业务意图 + HTTP 语义 | 写日志、拼 JSON |
| Adapter（`apiHandler` / `withAction`） | catch → Result、记日志、脱敏 | 业务判断 |
| UI | 按 `code` 提示 / 重试 | 解析原始堆栈 |

### 错误模型（`AppError`）

建议统一字段：

```ts
class AppError extends Error {
  code: string;           // 稳定业务码，如 CONTENT_NOT_FOUND
  statusCode: number;     // HTTP 状态
  isOperational: boolean; // true = 可预期业务错误
  details?: unknown;      // 校验字段级错误等（可选）
}
```

常用子类（与 HTTP 对齐）：

| 类 | status | 典型场景 |
|---|---|---|
| `BadRequestError` | 400 | 参数非法 |
| `UnauthorizedError` | 401 | 未登录 |
| `ForbiddenError` | 403 | 无权限 |
| `NotFoundError` | 404 | 资源不存在 |
| `ConflictError` | 409 | slug / version 冲突 |
| `ValidationError` | 422 | Zod / TanStack Form 校验失败 |
| `InternalError` | 500 | 非预期（`isOperational: false`） |

**原则：** Service 里 `throw new NotFoundError('文章不存在', { code: 'POST_NOT_FOUND' })`，不要 `return NextResponse.json(...)`。

### 统一响应体 `Result`

与概要设计「统一 Result + HTTP 状态码」对齐：

```ts
type Result<T> =
  | { success: true; data: T; timestamp: string; }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
      timestamp: string;
    };
```

- 成功：HTTP 2xx + `success: true`
- 失败：HTTP = `AppError.statusCode` + `success: false`
- 生产环境：非 operational 错误对客户端只返回通用文案（如「服务器内部错误」），完整堆栈只进日志 / 监控

### 入口统一捕获

#### Route Handler（`apiHandler`）

```ts
export const GET = apiHandler(async (req) => {
  const post = await postService.getById(id); // 可能 throw
  return ok(post); // → Result 成功
});
```

`apiHandler` 内部流程：

1. `try/catch`
2. `AppError` → 按 `statusCode` + `code` 返回
3. `ZodError` → `ValidationError`（422）
4. `Prisma.PrismaClientKnownRequestError` → 映射（如 P2002 → 409 Conflict）
5. 其它 → 记日志 + 500

#### Server Actions（`withAction`）

同样包一层，返回 `Result`，避免未捕获异常直接冒泡成 Next 默认错误页（除非故意走 `error.tsx`）。

#### RSC / Page

- 业务「找不到」：`notFound()`（走 `not-found.tsx`）
- 鉴权失败：`redirect('/login')` 或抛 `UnauthorizedError` 由边界处理
- 真正异常：靠 `error.tsx` / `global-error.tsx`

> Next 的 `error.tsx` 适合**渲染失败**，不适合替代 API 的 Result 协议。

### Prisma / 第三方错误映射

集中在一处（如 `mapKnownError(err)`），避免每个 Service 写一遍：

| 来源 | 映射 |
|---|---|
| Prisma `isUniqueConstraintViolation`（SQLSTATE `23505`） | `ConflictError` |
| Prisma `SqlQueryError` `23503` / `23502` | `BadRequestError` |
| Prisma `RUNTIME.NO_ROWS` / `ORM.MUTATION_ROW_MISSING` / `ORM.RELATION_ROW_MISSING` | `NotFoundError` |
| Prisma `ORM.RELATION_LINK_DUPLICATE` | `ConflictError` |
| next-auth 未登录 | `UnauthorizedError` |
| Zod | `ValidationError` + `details: fieldErrors` |

未识别的保持 `isOperational: false` → 500。

### 前端消费约定

- 管理端请求封装：只认 `Result`；`success: false` 时按 `error.code` / `message` 提示
- TanStack Query：统一判断业务错误对象（如 `isAppError`），避免每个 mutation 各写一套
- 全局 Toast：只展示 `isOperational` 的 message；500 用固定文案

### 与监控的衔接

| 类型 | 日志级别 | 是否告警 |
|---|---|---|
| `isOperational: true` | warn / info | 一般否 |
| `isOperational: false` | error + stack | 是 |
| 鉴权失败量异常 | warn + 计数 | 可阈值告警 |

错误对象建议带：`requestId`、`path`、`userId`（勿记密码 / Token）。

### 建议目录结构

```
app/src/lib/utils/errors/
  app-error.ts          # 基类 + 子类
  constant.ts           # 稳定错误码 + HTTP 状态映射
  result.ts             # ok() / fail()
  map-zod-error.ts
  map-prisma-error.ts
  map-known-error.ts
  api-handler.ts        # Route Handler 包装
  action-handler.ts     # Server Action 包装
  client.ts             # 前端消费 Result
app/src/types/api-result.type.ts
```

### 实施顺序

1. 定死 `Result` + `AppError` 字段
2. 完善 `apiHandler`，先覆盖第一个 admin API
3. 补 Prisma / Zod 映射
4. 再补 `withAction` + 前端请求封装
5. 最后接监控

## 请求处理

## 监控体系
