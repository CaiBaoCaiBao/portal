# Portal

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[![Zod](https://img.shields.io/badge/Zod-4-3E67B1?logo=zod&logoColor=white)](https://zod.dev/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/) [![Prisma](https://img.shields.io/badge/Prisma-8-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/) [![pnpm](https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

个人内容管理系统（CMS），用于发布和管理博客文章、更新日志与独立页面。

## 功能

- **分类与标签：** 标签挂在分类下，文章按分类联动选标签
- **文章：** 博客与长文，正文随版本快照保存
- **媒体库：** 浏览器端压缩为 WebP，直传对象存储
- **独立页面：** 标准、全宽、时间线布局
- **更新日志：** 语义化版本，与标签解耦

## 本地运行

在 `app/` 下：

```bash
pnpm install
```

创建 `app/.env.local`：

```bash
APP_NAME=portal
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/portal
```

数据库为 PostgreSQL 15 或更高版本。

```bash
pnpm dev             # 开发
pnpm build           # 构建
pnpm start           # 生产启动
pnpm lint            # ESLint
pnpm test            # Vitest
pnpm contract:emit   # 从 Prisma contract 生成类型
pnpm db:update       # 按 contract 更新数据库
```

## 文档

| 文档 | 内容 |
|------|------|
| [系统概要设计](doc/system-preliminary-design.md) | 架构、模块、数据模型、核心流程 |
| [全局设计](doc/global-design.md) | 错误处理与请求封装 |
| [测试用例](doc/test-case/README.md) | 用例约定与清单 |
| [Git 提交规范](doc/git-command.md) | 约定式提交 |

## 许可证

[MIT](LICENSE)