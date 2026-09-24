# 系统概要设计

## 1. 引言

### 1.1 编写目的

本说明书旨在明确个人内容管理系统（CMS）的**总体技术架构、系统逻辑结构、多态数据模型、核心业务事务逻辑以及非功能性设计**，为后续的详细设计与前端、后端核心代码实现（API 路由、数据库定义、定时任务）提供权威、闭环的指导依据。

### 1.2 项目背景

本系统为个人定制的全栈 CMS，主要用于高效发布、管理个人网站的博客文章（Post）、更新日志（Changelog）与特殊独立页面（Page）。系统基于 Next.js 现代全栈架构，核心目标是在保证后台灵活、丝滑的高级编辑体验的同时，兼顾前台极致的加载速度、SEO 优化与数据容灾能力。

## 2. 系统架构设计

### 2.1 技术选型

- **应用框架：** Next.js（App Router）全站架构，结合 React 19。
- **状态管理与数据获取：** Tanstack Query（React Query）用于管理后台数据的异步缓存与状态同步；Tanstack From 用于前后端表单统一校验。
- **样式与组件库：** Tailwind CSS + shadcn/ui + Luidce 矢量图标库，支持多主题色（暗黑模式）切换。
- **数据库与ORM：** PostgreSQL 数据库，配合 Prisma 进行数据模型定义与聚合查询。
- **静态资源托管：** 七牛云对象存储（OSS） 托管文章静态资源与媒体文件。

### 2.2 逻辑架构

系统整体采用前后端分离但基于 Next.js 统一同构的架构：

1. 用户展现层（Client/User）：
   - 前台展示站：高 SEO 优化，利用 Next.js 的页面静态化（ISR/SSG）技术，保证极速的首屏加载。
   - 管理后台（Dashboard）：单页应用（SPA）体验，包含完整的文章、多态内容、分类标签及媒体管理面板。。
2. 核心业务逻辑层（API Routes / Backend）：
   - 统一封装 HTTP 请求基类与标准响应格式（`response.json()` 统一 Result 类结构并集成 HTTP 状态码）。
   - 全原子化数据库事务处理、路由自动入库与安全审计。
3. 数据持久层（Data Layer）：
   - Prisma Client 读写结构化数据库，对象存储服务托管媒体资产。

## 3. 功能模块设计

系统核心划分为以下五个核心业务模块：

### 3.1 分类与标签模块

- **全系统共享标签：** 多对多关联设计从文章层级提升至内容基底层，使文章、日志和单页均能共享标签系统。
- **级联安全删除：** 删除分类时触发迁移机制（迁移到默认未分类），防止孤儿内容出现。

### 3.2 文章发布管理模块

   - **展现格式适配：** 支持针对“博客（Blog）”和“长篇文章（Long-form）”做渲染与检索过滤的差异化适配。
   - **分类标签级联：** 采用分类内聚标签设计。后台撰写文章时，必须先选择分类，标签选择器会联动仅捞取该分类下的专属标签，解决同名标签跨领域歧义问题。

### 3.3 媒体库与文件管理模块

- **图片前端预处理：** 上传前在浏览器端强制将图片统一压缩并输出为 Image/WebP 格式，最大宽度等比限制在 1920px。
- **对象存储（OSS）同步：** 采用后端签发 Token、前端直传七牛云的方案，保证密钥安全与大文件传输性能。

### 3.4 独立页面管理模块
- **布局定制与控制：** 支持对“关于我（About Me）”、“版权声明（Copyright）”等单页进行布局定制（标准、全宽、时间线）。后台提供组件控制面板，开关参数以 JSON 结构压缩存储。
- **高频静态化：** 前台通过按需重签（On-Demand Revalidation）技术，确保内容更新时即时刷新静态缓存。

### 3.5 更新日志管理模块

- **语义化版本控制：** 支持基于 vX.Y.Z 规范的语义化版本号录入与严格校验。
- **结构化表单录入：** 后台通过动态表单，将变更按新功能（Features）、修复（Fixes）等维度拆分，入库前自动组装为标准 JSON 对象。
- **标签无缝解耦：** 更新日志（Changelog）在数据层和 UI 层与标签系统彻底解耦，不提供也无法选择任何标签。

## 4. 数据库与数据结构设计

系统采用经典的“基底表 + 扩展表”主从继承设计，辅以“全量内容快照化”的详情表。

- User（用户表）： 管理后台管理员信息，包含加密后的凭证（bcryptjs 盐值）。
- ContentDetial （历史版本/快照留痕表）： id,body_html,body_json,version（用于查看和回滚历史版本）,content_id,title,slug,changelog_version?
- Content（内容基底表）: id,title,slug,kind（post/changelog）,status,current_detail_id
- Post（文章表）：id,format （blog/lomg_form）,category_id,content_id,cover?,excerpt 
- Category（分类表）：id,name,slug,description
- Tag（标签表）：id,name,slug
- PostTag（文章标签关联表）：多对多中间表
- Media（媒体文件表）：id,url,key,size,mime
- AuditLog（审计日志表）：记录管理员的操作记录与系统路由访问历史。
- Changelog（更新日志表）：id,content_id,version,is_prerelease

``` prisma
// 数据持久层 Prisma 模型定义

enum ContentKind {
  POST
  CHANGELOG
  PAGE
}

enum ContentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum PageLayout {
  STANDARD
  CUSTOM
  TIMELINE
}

// ==========================================
// 1. 内容基底表（存放当前最新、线上生效的信息）
// ==========================================
model Content {
  id              String          @id @default(cuid())
  kind            ContentKind     @default(POST)
  status          ContentStatus   @default(DRAFT)
  
  // 当前线上生效的最新的基础信息（单表查询极快）
  title           String          
  slug            String          @unique 
  
  // 指向当前生效的历史版本快照 ID
  currentDetailId String?         @map("current_detail_id")

  // 1:N 历史版本快照
  details         ContentDetail[] 
  
  // 1:1 核心业务多态扩展
  postExt         Post?  
  changelogExt    ChangelogExt?   
  pageExt         Page?  

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([kind, status])
}

// ==========================================
// 2. 内容详情与版本快照表（全量版本化、纯历史留痕）
// ==========================================
model ContentDetail {
  id               String   @id @default(cuid())
  contentId        String   @map("content_id")
  content          Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  version          Int      // 修订版本号，如 1, 2, 3 (每次保存递增)
  
  // 产生该特定历史版本时的元数据快照
  title            String   
  slug             String   
  changelogVersion String?  @map("changelog_version") 
  
  bodyHtml         String   @map("body_html") @db.Text
  bodyJson         Json     @map("body_json")

  createdAt        DateTime @default(now())

  @@unique([contentId, version])
}

// ==========================================
// 3. 业务功能多态扩展表（1:1 挂载）
// ==========================================
model Post {
  id         String        @id @default(cuid())
  contentId  String        @unique @map("content_id")
  content    Content       @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  format     String        @default("BLOG") // BLOG, LONG_FORM
  
  // 文章强制关联分类
  categoryId String        @map("category_id")
  category   Category      @relation(fields: [categoryId], references: [id])
  
  // ⭐️ 标签多对多关联只下沉到文章表，Changelog 无法选择标签
  tags       PostTag[]     
  
  cover      String?     
  excerpt    String?       @db.Text 

  @@map("posts")
}

model ChangelogExt {
  id           String   @id @default(cuid())
  contentId    String   @unique @map("content_id")
  content      Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  version      String   @unique // 当前最新生效的软件语义化版本，如 v1.2.0
  isPrerelease Boolean  @default(false) @map("is_prerelease")

  @@map("changelogs")
}

model Page {
  id               String     @id @default(cuid())
  contentId        String     @unique @map("content_id")
  content          Content    @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  layout           PageLayout @default(STANDARD)
  componentsConfig Json       @map("components_config") // 存储UI组件控制参数

  @@map("pages")
}

// ==========================================
// 4. 辅助实体：分类、标签与多对多关联
// ==========================================
model Category {
  id          String          @id @default(cuid())
  name        String          @unique // 比如 "水果", "科技品牌"
  slug        String          @unique
  description String?
  
  posts       Post[]
  tags        Tag[]           // ⭐️ 分类内聚标签：一个分类拥有多个专属标签
}

model Tag {
  id         String    @id @default(cuid())
  name       String    // ⭐️ 跨分类允许同名标签（如 "苹果" 既属于水果也属于科技品牌）
  slug       String    // 格式可为 "categorySlug-tagSlug"
  
  categoryId String    @map("category_id")
  category   Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  posts      PostTag[]
  tagAlias   TagAlias[]

  @@unique([categoryId, name]) // 联合唯一约束：同一分类下标签名唯一
}

model TagAlias {
  id         String    @id @default(cuid())
  name       String

  tagId      String @map("tag_id")
  tag        Tag  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
}

model PostTag {
  postId String        @map("post_id")
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tagId  String        @map("tag_id")
  tag    Tag           @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
}

model Media {
  id        String   @id @default(cuid())
  url       String   
  key       String   @unique 
  size      Int      
  mimeType  String   
  createdAt DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(cuid())
  operator  String   
  action    String   
  ip        String   
  createdAt DateTime @default(now())
}
```

## 5. 核心业务处理流程

### 5.1 内容并发保存与原子递增事务设计

为防止并发点击造成 `version` 错乱，使用 **Prisma 交互式事务**。

``` ts
// 保存内容 API 核心流伪代码
export async function saveContentTx(contentId: string, payload: any) {
  return await prisma.\$transaction(async (tx) => {
    // 1. 悲观行级锁防并发
    await tx.\$queryRaw`SELECT id FROM "Content" WHERE id = ${contentId} FOR UPDATE`;

    // 2. 计算下一个修订版本号
    const lastDetail = await tx.contentDetail.findFirst({
      where: { contentId },
      orderBy: { version: 'desc' },
      select: { version: true }
    });
    const nextVersion = lastDetail ? lastDetail.version + 1 : 1;

    // 3. 产生本次写入的历史信息快照
    const newDetail = await tx.contentDetail.create({
      data: {
        contentId,
        version: nextVersion,
        title: payload.title,
        slug: payload.slug,
        changelogVersion: payload.changelogVersion,
        bodyHtml: payload.bodyHtml,
        bodyJson: payload.bodyJson
      }
    });

    // 4. 更新基底主表当前线上最新信息
    const content = await tx.content.update({
      where: { id: contentId },
      data: {
        title: payload.title,
        slug: payload.slug,
        currentDetailId: newDetail.id
      }
    });

    return content;
  });
}
```

### 5.2 历史回滚时的路由防护（Slug 变更动态 301 重定向）

当前端因回滚或改名导致历史 `slug` 失效时，前台利用 `ContentDetail` 历史留痕资产进行动态拦截，拒绝 404 死链，无损传递 SEO 权重。

``` ts
// app/posts/[slug]/page.tsx 前台拦截片段
export default async function PostDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // 1. 尝试匹配当前线上最新数据
  const active = await prisma.content.findUnique({
    where: { slug, status: 'PUBLISHED' }
  });
  if (active) return <RenderComponent data={active} />;

  // 2. 降级盘查：搜寻是否属于某个历史快照中曾用过的 slug
  const history = await prisma.contentDetail.findFirst({
    where: { slug, content: { status: 'PUBLISHED' } },
    select: { content: { select: { slug: true } } }
  });

  // 3. 历史命中，执行永久 301 重定向
  if (history?.content?.slug) {
    redirect(`/posts/${history.content.slug}`, RedirectType.permanent);
  }

  notFound();
}
```
### 5.3 媒体库孤儿文件自动清理机制

针对内容快照化带来的冗余图片，设计 Cron 定时扫描垃圾回收（GC） 流程，闭环删除：

1. 捞出 `Media` 表注册的所有文件 `url` 与 `key。`
2. 捞出 `ContentDetail` 全量历史快照库的 `bodyHtml` 源码，利用正则 `/<img[^>]+src="([^">]+)"/g` 提取出所有被实际使用的图片地址集合 `activeUrls。`
3. 比对筛选差集 `orphanMedia = allMedia - activeUrls`
4. 调用七牛云 SDK 批量从云端删除 `key`，成功后同步清除本地 `Media` 记录。

## 6.非功能性设计

### 安全设计

- **身份认证：** 采用 `next-auth` 托管管理后台会话，全站 API 路由前置 Token 鉴权拦截。
- **输入洗涤：** 后台正文入库前进行 XSS 过滤，防范注入攻击。

### 性能与静态化

- **前台极致提速：** 对于 `PAGE` 与 `POST` 类型，前台开启 **ISR（增量静态再生）**。前台路由路径设计为更严密的语义化多级路径（如 `/categories/[category_slug]/tags/[tag_slug]`）。
- **按需重签：** 后台保存事务成功后，按需触发 revalidatePath，秒级擦除 CDN 与服务端 HTML 静态缓存，达到“静态化速度 + 动态化生效”的完美平衡。