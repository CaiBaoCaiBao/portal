# 深度冻结测试

被测函数：`deepFreeze`（`app/src/lib/utils/object/deep-freeze.ts`）。
[测试文件](../../../../app/__test__/utils/object/deep-freeze.test.ts)

## 概述

- 目的：确认 `deepFreeze` 原地递归冻结入参并返回同一引用。覆盖普通对象、数组、`Symbol` 属性、函数属性、`Map` / `Set`、循环引用、共享引用，以及外层已浅冻结的对象。`null` 与原始值应原样返回。
- 方法：黑盒单元测试（Vitest，`app/__test__/utils/object.test.ts`）。
  - 等价类划分：按入参类型分成普通对象、数组、函数、`Map` / `Set`、原始值，每类至少一条用例。
  - 边界值分析：覆盖 `null`、`undefined`、循环引用，以及外层已冻结、内层未冻结。
  - 错误推测：补充 `Symbol` 属性、同一嵌套对象被多处引用，以及 `Map.set` / `Set.add` 在冻结后仍可执行。
  - 判定方式：返回值与入参引用相等，各层 `Object.isFrozen` 为 `true`；严格模式下属性赋值或 `push` 抛出 `TypeError`。

## 测试清单

- [x] [嵌套对象原地冻结](#tc-u-obj-df-001-嵌套对象原地冻结)-P0
- [x] [数组原地冻结](#tc-u-obj-df-002-数组原地冻结)-P0
- [x] [冻结 Symbol 属性上的对象](#tc-u-obj-df-003-symbol-属性)-P1
- [x] [冻结 Map 与 Set 中的对象](#tc-u-obj-df-004-map-与-set)-P0
- [x] [循环引用不栈溢出](#tc-u-obj-df-005-循环引用)-P0
- [x] [原始值与 null 原样返回](#tc-u-obj-df-006-原始值与-null)-P0
- [x] [冻结函数及其属性](#tc-u-obj-df-007-函数属性)-P1
- [x] [同一嵌套对象只冻结一次](#tc-u-obj-df-008-共享嵌套引用)-P1
- [x] [补齐浅冻结对象的内层](#tc-u-obj-df-009-外层已冻结内层未冻结)-P1

## TC-U-OBJ-DF-001 嵌套对象原地冻结

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DF-001 |
| 用例名称 | 嵌套对象原地冻结 |
| 优先级 | P0 |
| 前置条件 | 存在对象 `{ a: 1, b: { c: 2 } }` |
| 测试步骤 | 1. 调用 `deepFreeze(obj)`<br>2. 在严格模式下执行 `obj.a = 2` |
| 预期结果 | 1. 返回值与入参为同一引用<br>2. `obj` 与 `obj.b` 的 `Object.isFrozen` 均为 `true`<br>3. 赋值抛出 `TypeError` |

## TC-U-OBJ-DF-002 数组原地冻结

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DF-002 |
| 用例名称 | 数组原地冻结 |
| 优先级 | P0 |
| 前置条件 | 存在数组 `[{ n: 1 }]` |
| 测试步骤 | 1. 调用 `deepFreeze(arr)`<br>2. 执行 `arr.push({ n: 2 })`<br>3. 执行 `arr[0].n = 2` |
| 预期结果 | 1. 返回值与入参数组为同一引用，不生成新数组<br>2. 数组本身与元素对象均已冻结<br>3. `push` 与元素属性赋值均抛出 `TypeError` |

## TC-U-OBJ-DF-003 Symbol 属性

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DF-003 |
| 用例名称 | 冻结 Symbol 属性上的对象 |
| 优先级 | P1 |
| 前置条件 | 存在以 `Symbol("nested")` 为键、值为 `{ n: 1 }` 的对象 |
| 测试步骤 | 调用 `deepFreeze(obj)` |
| 预期结果 | Symbol 键对应的嵌套对象 `Object.isFrozen` 为 `true` |

## TC-U-OBJ-DF-004 Map 与 Set

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DF-004 |
| 用例名称 | 冻结 Map 与 Set 中的对象 |
| 优先级 | P0 |
| 前置条件 | `map` 的值为对象 `{ n: 1 }`；`set` 中存有对象 `{ n: 2 }` |
| 测试步骤 | 1. 分别调用 `deepFreeze(map)`、`deepFreeze(set)`<br>2. 检查容器与其中对象的冻结状态 |
| 预期结果 | 1. `Map`、`Set` 自身 `Object.isFrozen` 为 `true`<br>2. 存入的对象均已冻结，属性赋值抛出 `TypeError`<br>3. `Map.set` / `Set.add` 仍可执行：二者修改的是内部槽，`Object.freeze` 不能阻止增删条目 |

## TC-U-OBJ-DF-005 循环引用

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DF-005 |
| 用例名称 | 循环引用不栈溢出 |
| 优先级 | P0 |
| 前置条件 | 对象 `obj.self` 指向 `obj` 自身 |
| 测试步骤 | 调用 `deepFreeze(obj)` |
| 预期结果 | 1. 调用不抛出异常<br>2. `obj` 与 `obj.self` 均为已冻结的同一对象 |

## TC-U-OBJ-DF-006 原始值与 null

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DF-006 |
| 用例名称 | 原始值与 null 原样返回 |
| 优先级 | P0 |
| 前置条件 | 入参分别为 `null`、`1`、`"ok"`、`undefined`、`true` |
| 测试步骤 | 分别调用 `deepFreeze` |
| 预期结果 | 返回值与入参严格相等，不抛出异常 |

## TC-U-OBJ-DF-007 函数属性

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DF-007 |
| 用例名称 | 冻结函数及其属性 |
| 优先级 | P1 |
| 前置条件 | 函数 `fn` 上挂有属性 `fn.meta = { x: 1 }` |
| 测试步骤 | 1. 调用 `deepFreeze(fn)`<br>2. 调用 `fn()`<br>3. 执行 `fn.meta.x = 2` |
| 预期结果 | 1. `fn` 与 `fn.meta` 均已冻结<br>2. 函数仍可正常调用<br>3. 修改 `fn.meta.x` 抛出 `TypeError` |

## TC-U-OBJ-DF-008 共享嵌套引用

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DF-008 |
| 用例名称 | 同一嵌套对象只冻结一次 |
| 优先级 | P1 |
| 前置条件 | `inner = { n: 1 }`，且 `obj.a` 与 `obj.b` 都指向 `inner` |
| 测试步骤 | 调用 `deepFreeze(obj)` |
| 预期结果 | 1. `obj.a` 与 `obj.b` 仍是同一引用<br>2. `inner` 已冻结，修改 `inner.n` 抛出 `TypeError` |

## TC-U-OBJ-DF-009 外层已冻结、内层未冻结

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DF-009 |
| 用例名称 | 补齐浅冻结对象的内层 |
| 优先级 | P1 |
| 前置条件 | `inner = { n: 1 }` 未冻结，`outer = Object.freeze({ inner })` 仅外层冻结 |
| 测试步骤 | 调用 `deepFreeze(outer)` |
| 预期结果 | 1. 返回值仍是 `outer`<br>2. `inner` 变为已冻结，修改 `inner.n` 抛出 `TypeError` |
