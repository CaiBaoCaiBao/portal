# 核心数据流

本文描述个人内容管理系统的关键数据流。模块划分见 [系统概要设计](./system-primary-design.md)。

## 1. 内容保存与版本快照事务

更新日志、文章、作品集共用这条流。保存时递增 `version`，正文与版本快照在同一数据库事务中写入；事务提交成功后再记操作审计。事务失败则正文与快照都不落库，也不记成功审计。

```mermaid
sequenceDiagram
  participant Admin as 后台
  participant Content as 内容管理
  participant DB as PostgreSQL
  participant Audit as 操作审计

  Admin->>Content: 保存正文
  Content->>DB: 开启事务
  Content->>DB: version 加一，写正文
  Content->>DB: 写版本快照
  DB-->>Content: 提交成功
  Content->>Audit: 记录本次写操作
  Content-->>Admin: 返回新版本
```

## 2. 登录与登录审计

后台入口先走 Next-Auth。无论成功或失败，都写入登录审计，记录账号、时间、是否成功。只有成功会话才能进入后续后台写操作。

```mermaid
sequenceDiagram
  participant User as 管理员
  participant Auth as Next-Auth
  participant Audit as 登录审计

  User->>Auth: 提交登录
  alt 校验通过
    Auth-->>User: 建立会话
    Auth->>Audit: 记录登录成功
  else 校验失败
    Auth-->>User: 拒绝登录
    Auth->>Audit: 记录登录失败
  end
```

## 3. 后台菜单解析与权限校验

已登录用户读取 `scope=admin` 的系统路由树。按 `isActive` 与 `permissionIds` 过滤后，得到后台菜单。公开站点只读 `scope=site`，不走这套权限过滤。

```mermaid
sequenceDiagram
  participant Admin as 后台
  participant Auth as 会话
  participant Route as 系统路由
  participant DB as PostgreSQL

  Admin->>Auth: 携带会话
  Auth-->>Admin: 当前用户与权限
  Admin->>Route: 请求菜单
  Route->>DB: 读取路由树
  Route->>Route: 过滤未启用节点与无权限节点
  Route-->>Admin: 返回后台菜单
```

## 4. 公开路径解析与 SSR 渲染

公开站点只在 `scope=site` 树上按请求路径匹配启用的 `page`（含 `path=""` 的索引页），再取已发布内容及其分类、标签、媒体引用，由服务端渲染 HTML。后台 URL 不走这条匹配，由 App Router 文件渲染。

```mermaid
sequenceDiagram
  participant Visitor as 访客
  participant Site as 公开站点 SSR
  participant Route as 系统路由
  participant Content as 内容管理
  participant Media as 媒体库

  Visitor->>Site: 请求 path
  Site->>Route: 按 path 匹配页面节点
  Route-->>Site: 命中节点
  Site->>Content: 读取已发布内容及分类、标签
  Site->>Media: 读取被引用的媒体
  Site-->>Visitor: 返回渲染后的 HTML
```

## 5. 写操作与操作审计

内容、路由、分类标签、媒体的关键写操作成功后，统一记一条操作审计：操作者、时间、对象、结果。业务事务回滚时不记成功审计。

```mermaid
flowchart LR
  write["后台写操作"] --> tx{"事务是否提交"}
  tx -->|是| audit["写入操作审计"]
  tx -->|否| rollback["回滚，不记成功审计"]
```

## 6. 媒体上传与内容引用

上传只写入媒体库记录和文件存储。内容保存时通过关联引用媒体，不把文件本体写入正文表。

```mermaid
sequenceDiagram
  participant Admin as 后台
  participant Media as 媒体库
  participant Store as 文件存储
  participant Content as 内容管理

  Admin->>Media: 上传文件
  Media->>Store: 保存文件
  Media-->>Admin: 返回媒体记录
  Admin->>Content: 保存内容并挂上媒体关联
  Content-->>Admin: 正文只保留引用
```
