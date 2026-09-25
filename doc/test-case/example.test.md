# 模板

约定见 [README.md](./README.md)。完整集见 `api/api.http.test.md`。

## 空白

### TC-{域}-{资源}-{动作}-{序号} {动作}·{条件}

| 项 | 内容 |
|----|------|
| 目标 | |
| 前置 | 无 |
| 层级 | Parse / Service / HTTP / UI |
| 方法 | 等价类 / 边界值 / 场景法 / 错误猜测 / 状态迁移 / 决策表 |
| 步骤 | 1. |
| 期望 | |
| 关联 | |
| 优先级 | P0 |

## 示例

### TC-API-V1-POST-001 创建测试项·合法入参

| 项 | 内容 |
|----|------|
| 目标 | 合法 body 创建成功 |
| 前置 | 不存在 `name=Bob` |
| 层级 | HTTP |
| 方法 | 等价类、边界值 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":"Bob","age":18}` |
| 期望 | HTTP 200；`data.id` 非空；`data.name` 为 `Bob`；`data.age` 为 `18` |
| 关联 | `testCreateBodySchema`；`createTestItem` |
| 优先级 | P0 |

### TC-API-V1-POST-002 创建测试项·age 低于下界

| 项 | 内容 |
|----|------|
| 目标 | `age < 18` 校验失败 |
| 前置 | 无 |
| 层级 | Parse |
| 方法 | 边界值 |
| 步骤 | 1. `POST /api/v1` Body: `{"name":"Bob","age":17}` |
| 期望 | HTTP 422；`error.code` 为 `Validation Error` |
| 关联 | `testCreateBodySchema.age`（`min(18)`） |
| 优先级 | P0 |
