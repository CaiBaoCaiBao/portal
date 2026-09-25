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
| Parse（`parse*` + Zod schema） | 校验 params / query / body，产出类型安全 DTO | 业务判断、拼 Response |
| Adapter（`apiHandler` / `actionHandler`） | catch → Result、记日志、脱敏 | 业务判断 |
| UI | 按 `code` 提示 / 重试 | 解析原始堆栈 |

### 错误模型（`AppError`）

字段已落地（`app-error.ts` + `constant.ts`）：

```ts
class AppError extends Error {
  code: ErrorCode;        // 与 HTTP 对齐的稳定码，如 "Not Found"
  statusCode: number;
  isOperational: boolean; // true = 可预期业务错误
  details?: unknown;
}
```

`ErrorCode` 为短语枚举（`"Bad Request"` / `"Not Found"` / `"Validation Error"` 等），**不是** `POST_NOT_FOUND` 这种资源级码。资源差异放在 `message`（及可选 `details`）。

| 类 | status / code | 典型场景 |
|---|---|---|
| `BadRequestError` | 400 | 非法 JSON、语义错误的入参 |
| `UnauthorizedError` | 401 | 未登录 |
| `ForbiddenError` | 403 | 无权限 |
| `NotFoundError` | 404 | 资源不存在 |
| `ConflictError` | 409 | slug / name / version 冲突 |
| `ValidationError` | 422 | Zod 形状不符 |
| `InternalError` | 500 | 非预期（`isOperational: false`） |

**原则：** Service 里 `throw new NotFoundError("文章不存在")`，不要 `return NextResponse.json(...)`。子类已带好 `code` / `statusCode`。

### 统一响应体 `Result`

与概要设计「统一 Result + HTTP 状态码」对齐：

代码类型名为 `ApiResult<T>`（`api-result.type.ts`）：

```ts
type ApiResult<T> =
  | { success: true; data: T; timestamp: string }
  | {
      success: false;
      error: { code: ErrorCode; message: string; details?: unknown };
      timestamp: string;
    };
```

- 成功：HTTP 2xx + `success: true`
- 失败：HTTP = `AppError.statusCode` + `success: false`
- 生产环境：非 operational 错误对客户端只返回通用文案（如「服务器内部错误」），完整堆栈只进日志 / 监控

### 入口统一捕获

#### Route Handler（`apiHandler`）

入口先校验再进 Service。裸 `return data` 即可，包装器会包成 `ok(data)`。

```ts
export const GET = apiHandler(async (req) => {
  const query = parseSearchParams(req, listQuerySchema);
  return postService.list(query);
});

export const POST = apiHandler(async (req) => {
  const body = await parseBody(req, createBodySchema);
  return postService.create(body);
});
```

`apiHandler` 内部流程：

1. `try/catch`
2. 已是 `Response` → 原样返回
3. 已是 `ApiResult` → 按 `statusFromResult` 输出
4. 其它成功值 → `ok(result)`
5. `AppError` → `fail` + `statusCode`
6. `ZodError` → `ValidationError`（422）
7. Prisma 已知错误 → 映射（如唯一约束 → 409）
8. 其它 → 记日志 + 500
9. `redirect()` / `notFound()` → 原样再抛

#### Server Actions（`actionHandler`）

同样 catch → `ApiResult`，避免未捕获异常冒泡成 `error.tsx`。**不走 HTTP，也不走 `Http`。**

```ts
"use server";
export const createPost = actionHandler(async (input: unknown) => {
  const body = parse(createBodySchema, input);
  return postService.create(body);
});

// 客户端
const post = unwrapApiResult(await createPost(values));
```

#### 入口校验（`parse.ts`）

请求进入 API / Action **必须**与约定 schema 对齐，不能假设客户端诚实。

| 函数 | 输入 | 失败 |
|------|------|------|
| `parse(schema, data)` | 任意值（含 Action 入参） | Zod → 422 |
| `parseBody(req, schema)` | JSON body | 非法 JSON → 400；形状不符 → 422 |
| `parseSearchParams(req, schema)` | query | Zod → 422 |
| `parseParams(params, schema)` | 动态路由（可 `Promise`） | Zod → 422 |

约定：

- Schema 放 `lib/schema/*.schema.ts`，与 Route / Action 共用。
- Query 全是字符串：数字字段用 `z.coerce.number()`。JSON body 保持真实类型（`age` 用 `z.number()`）。
- 校验通过后再调 Service；Service 只处理领域规则（不存在、冲突等）。
- 从 `@/lib/utils/server` 引用（`server-only`），勿打进客户端 bundle。

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

- 调 Route：`Http.get/post/...` 内部已 `unwrapApiResult`，成功得 `T`，失败抛 `ApiError`
- 调 Action：函数返回 `ApiResult<T>`，调用方 `unwrapApiResult` 或自己判断 `success`
- Toast / Query：`getErrorMessage` / `isApiErrorResult`；不要每个 mutation 各解析一套
- 全局 Toast：只展示 operational 的 message；500 用固定文案

### 与监控的衔接

| 类型 | 日志级别 | 是否告警 |
|---|---|---|
| `isOperational: true` | warn / info | 一般否 |
| `isOperational: false` | error + stack | 是 |
| 鉴权失败量异常 | warn + 计数 | 可阈值告警 |

错误对象建议带：`requestId`、`path`、`userId`（勿记密码 / Token）。

### 建议目录结构

```
app/src/lib/utils/errors/     # AppError、映射、apiHandler、actionHandler、client
app/src/lib/utils/parse.ts    # parse / parseBody / parseSearchParams / parseParams
app/src/lib/utils/server.ts   # 服务端再导出（server-only）
app/src/lib/utils/http/       # 前端 Http（内部已落地；*Out / upload 待做）
app/src/lib/schema/           # Zod 约定（与入口共用）
app/src/lib/service/          # 领域逻辑，只抛 AppError
app/src/app/api/v1/           # Route：集合 route.ts + [id]/route.ts
app/src/types/api-result.type.ts
```

### 实施状态

| 项 | 状态 |
|----|------|
| `ApiResult` + `AppError` + `ErrorCode` | 已落地 |
| `apiHandler` / `actionHandler` / Prisma·Zod 映射 | 已落地 |
| 入口 `parse*` | 已落地 |
| 内部 `Http.get/post/put/patch/delete` | 已落地 |
| 探活用 `/api/v1` 测试资源（内存） | 已落地 |
| `Http.*Out` / `upload*` | 未做 |
| 鉴权、监控 | 未做 |

## 请求处理

与上一节衔接：后端入口产出统一 `Result`，前端请求封装只负责发请求、解析协议、把失败变成可消费错误。Toast / 缓存 / 重试交给 TanStack Query 与 UI。

### 设计目标

1. **内部 API 只认 `Result`**：`success: true` 返回 `data`；`success: false` 抛出与 `ApiError` 同形的对象，供 `getErrorMessage` / `isApiErrorResult` 使用。
2. **外部 API 不套 `Result`**：七牛直传、第三方 webhook 等各自有协议，单独走 `*Out` 方法，按 HTTP 状态与原始 body 处理。
3. **上传进度可选**：原生 `fetch` 无法稳定报告上传进度，需要进度的请求走 XHR；普通 JSON CRUD 仍用 `fetch`。
4. **调用方拿业务数据，不拿信封**：内部方法返回 `T`，不返回 `ApiResult<T>`。

### 两类客户端

```
管理端 UI / TanStack Query
        │
        ├─ Http.get / post / put / patch / delete
        │     同源 /api/* ，credentials: include
        │     解析 Result → unwrap → T
        │
        ├─ Http.upload（内部，带进度）
        │     FormData 等到本站 /api/*
        │     XHR + onUploadProgress
        │     响应仍按 Result unwrap
        │
        └─ Http.getOut / postOut / uploadOut
              任意绝对 URL
              不带本站 cookie（除非显式打开）
              不解析 Result；2xx 按约定解析 body，非 2xx 抛错
```

| 方法族 | 典型对象 | Cookie | 响应协议 | 传输 |
|--------|----------|--------|----------|------|
| `get/post/put/patch/delete` | 本站 Route Handler | `include` | `ApiResult<T>` | `fetch` |
| `upload` | 本站上传接口 | `include` | `ApiResult<T>` | XHR |
| `getOut/postOut/putOut/...` | 第三方 JSON API | 默认关闭 | 原始 JSON / 文本 | `fetch` |
| `uploadOut` | 七牛直传等 | 默认关闭 | 第三方格式 | XHR |

**原则：** 本站业务接口不要用 `*Out`；外部地址不要用内部方法去「猜」`Result`。

### 内部请求（`Http`）

#### 约定

- `path`：站内相对路径，现用版本前缀 **`/api/v1/...`**（例如 `/api/v1`、`/api/v1/${id}`）。一个 `route.ts` 只对应一个 URL；集合与 `[id]` 拆目录。后续业务资源同此约定，如 `/api/v1/posts`。
- `params`：拼 query，`undefined` 的键丢弃。
- `body`：普通对象自动 `JSON.stringify`，并设 `Content-Type: application/json`。
- `body` 为 `FormData` / `Blob` 时：不设 JSON Content-Type，交给浏览器带 boundary。
- 透传 `signal`（Query 取消）、自定义 `headers`。
- **不**在封装层默认重试写操作；重试策略给 Query。
- **不**在封装层弹 Toast。

#### 解析流程

1. `fetch` / XHR 发出。
2. 读 body：优先 JSON；解析失败视为协议错误（合成 `ApiError`）。
3. 用已有 `isApiResult` 校验；不是 `Result` 视为协议错误（不要把 HTML 错误页当业务失败码乱猜）。
4. `unwrapApiResult`：成功返回 `T`，失败 `throw` 整个 `ApiError`。
5. HTTP 状态码**不单独**决定业务成败（以 `success` 为准）。`401` 可在封装层或 Query 全局缓存里额外 `redirect('/login')`，与 `Result.code` 双保险。

```ts
const item = await Http.get<TestItem>(`/api/v1/${id}`);
await Http.post<TestItem>("/api/v1", { name: "Bob", age: 22 });
```

与 Query：

```ts
useQuery({
  queryKey: ["test-items", id],
  queryFn: ({ signal }) => Http.get<TestItem>(`/api/v1/${id}`, { signal }),
});

useMutation({
  mutationFn: (input) => Http.post<TestItem>("/api/v1", input),
  onError: (err) => toast.error(getErrorMessage(err)),
});
```

网络断开、abort、非 JSON 等非 `Result` 失败，也要收成可被 `getErrorMessage` 吃掉的形状（或 `Error`），避免 Query 收到裸字符串。

### 外部请求（`*Out`）

用于：七牛上传/回调以外的 HTTP、开放 API、webhook 调试等。

#### 约定

- 第一个参数是**完整 URL**（或可配置的 `baseURL + path`），不做本站 `/api` 假设。
- 默认 `credentials: "omit"`，避免把本站会话 Cookie 打到第三方。
- 不跑 `isApiResult` / `unwrapApiResult`。
- 成功：HTTP 2xx；JSON 则 `res.json()`，否则按 `responseType` 返回 text / 原 `Response`。
- 失败：抛出独立错误（建议 `ExternalHttpError`：`status`、`url`、`body`），**不要**伪装成本站 `ErrorCode`。
- 鉴权头（`Authorization`、七牛 token 表单字段等）由调用方传入，封装层不读本站 session。

```ts
await Http.postOut<QiniuCallback>("https://up.qiniup.com", formData, {
  // 无 cookie；Content-Type 由 FormData 决定
});
```

Service / 服务端同样可以复用 `*Out` 调外部 API，但密钥只放 server env，不要进客户端 bundle。

### 上传进度

#### 为什么单独开通道

`fetch` 的 Request body 在主流浏览器里**没有**与 XHR `upload.onprogress` 对等的上传进度事件。需要百分比进度条时，必须用 `XMLHttpRequest`（或后续若统一上带进度的上传 SDK，也在这一层适配，调用方仍只认 `onUploadProgress`）。

下载进度一般不作为 CMS 管理端需求；本节只保证**上传**。

#### 回调形状

```ts
type UploadProgress = {
  loaded: number;
  total?: number;          // 未知时（chunked）可缺省
  percent?: number;        // total 有值时为 0–100
};

type UploadOptions = HttpOptions & {
  onUploadProgress?: (p: UploadProgress) => void;
};
```

- `Http.upload(path, body, options)`：本站接口，响应按 `Result` unwrap。
- `Http.uploadOut(url, body, options)`：外部直传，响应按外部协议。

`body` 一般为 `FormData`（文件 + token + key）。进度来自 `xhr.upload.onprogress`；`lengthComputable === false` 时只报 `loaded`，UI 可走不确定进度条。

#### 与媒体库（七牛直传）的关系

概要设计：后端签发 token，前端直传 OSS。推荐链路：

```
浏览器
  → Http.post('/api/v1/media/token', meta)        // 内部 Result，拿 uploadToken + key
  → Http.uploadOut(qiniuHost, formData, {
        onUploadProgress: setPercent,
      })                                          // 外部，跟进度
  → Http.post('/api/v1/media', { key, ... })      // 内部 Result，落 Media 记录
```

进度只绑在第二步。不要为了进度把文件先 POST 进 Next Route（大文件占 Node 内存，且丢失直传收益）。

若某次上传走本站代理（小文件、导入），用 `Http.upload` 而不是 `post`。

#### 实现约束

- 仅客户端组件 / 浏览器环境使用 XHR 上传；RSC / Server Action 里不要调 `upload*`。
- 支持 `signal`：`abort` 时 `xhr.abort()`，对 Query 表现为取消而非业务错误。
- 与 JSON `post` 共用 URL / 超时 / 错误映射入口，避免两套 headers 逻辑分叉。

### 错误如何回到 UI

| 来源 | 抛出物 | UI |
|------|--------|-----|
| 内部 `success: false` | `ApiError`（`unwrapApiResult`） | `getErrorMessage` → Toast / 表单 |
| 内部非 JSON / 非 Result | 合成 `ApiError`（如 `Internal Server Error`） | 固定或通用文案 |
| 外部非 2xx / 网络失败 | `ExternalHttpError` | 调用方或专用 mapper，不进本站错误码表 |
| `401`（内部） | 仍是 `ApiError`，可额外跳转登录 | 与错误处理文档一致 |

全局 Toast：只展示 operational 文案；内部 500 用固定「服务器内部错误」。外部错误默认不当成「本站 500」。

### 建议目录

```
app/src/lib/utils/http/
  type.ts           # HttpOptions（UploadOptions / ExternalHttpError 待补）
  index.ts          # 内部 get/post/put/patch/delete（已落地）
  build-url.ts      # query 拼接
  xhr-upload.ts     # 待做：带进度 XHR
```

`errors/client.ts` 继续只消费 `Result`；`http` 依赖它，不反向把 Toast 拉进来。

### 实施顺序

1. ~~内部 `get/post/...` + `Result` unwrap~~（已落地，探活 `/api/v1`）。
2. 再补 `*Out`（先 JSON，再 FormData）。
3. 抽 `xhr-upload`，接 `upload` / `uploadOut` + `onUploadProgress`。
4. 媒体库：token → 直传进度 → 落库。
5. Query 全局 `onError` / `401` 跳转（可选）。

## 监控体系

