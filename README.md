# Portal

![JuntL](https://github-readme-stats.vercel.app/api/top-langs/?username=CaiBaoCaiBao)

## 简述

Portal 是 JuntL 的门户站点，用于内容、个人主页的展示以及对站点资源进行维护。

该项目采用 Next.js 的全栈技术方案，因为它不需要支持APP与小程序，也没有其他平台需要使用它的服务。

![pnpm](https://img.shields.io/badge/pnpm-yellow?style=for-the-badge&logo=pnpm&logoColor=white) ![TS](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Next](https://img.shields.io/badge/next%20js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white) ![PG](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## 功能模块列表

以下是该项目正在/计划实施的模块和功能：

- 数字资产模块
- 内容管理模块
- 页面管理模块

## 如何使用

> 在使用过程中遇见问题，欢迎联系 [📧JuntL](mailto:13503089560@163.com) 并详细说明

安装依赖

```
pnpm install
```

配置环境变量

[客户端环境配置](./src/config/client-env.config.ts)
[服务端环境配置](./src/config/server-env.config.ts)

数据库配置

1. 安装 PostgreSQL 并创建数据库
2. 检查数据约定 `pnpm contract:emit`
3. 初始化数据库 `pnpm exec prisma db init`
4. 构建数据库表 `pnpm exec prisma db update`

项目运行
```
pnpm dev
```

## ⚖️License

![MIT](https://img.shields.io/badge/MIT-green?style=for-the-badge)