# 深度拷贝测试

被测函数：`deepClone`（`app/src/lib/utils/object/deep-clone.ts`）。
[测试文件](../../../../app/__test__/utils/object/deep-clone.test.ts)

## 概述

- 目的：确认 `deepClone` 返回与入参值相等、引用独立的深拷贝。覆盖普通对象、数组、`Map` / `Set`、`Date`、循环引用与共享引用。`null` 与原始值应原样返回；`Symbol` 属性不被拷贝；不可克隆类型（如函数）应抛出异常。
- 方法：黑盒单元测试（Vitest，`app/__test__/utils/object/deep-clone.test.ts`）。
  - 等价类划分：按入参类型分成普通对象、数组、`Map` / `Set`、`Date`、原始值，每类至少一条用例。
  - 边界值分析：覆盖 `null`、循环引用，以及同一嵌套对象被多处引用。
  - 错误推测：补充 `Symbol` 属性不被拷贝，以及函数等不可结构化克隆的类型。
  - 判定方式：返回值与入参深度相等但引用不等；修改拷贝不影响原对象；循环引用可克隆且结构保持；不可克隆类型抛出异常。

## 测试清单

- [x] [嵌套对象深拷贝](#tc-u-obj-dc-001-嵌套对象深拷贝)-P0
- [x] [数组深拷贝](#tc-u-obj-dc-002-数组深拷贝)-P0
- [x] [Symbol 属性不被拷贝](#tc-u-obj-dc-003-symbol-属性)-P1
- [x] [拷贝 Map 与 Set 中的对象](#tc-u-obj-dc-004-map-与-set)-P0
- [x] [循环引用可深拷贝](#tc-u-obj-dc-005-循环引用)-P0
- [x] [原始值与 null 原样返回](#tc-u-obj-dc-006-原始值与-null)-P0
- [x] [函数不可克隆](#tc-u-obj-dc-007-函数不可克隆)-P1
- [x] [共享嵌套引用在拷贝中保持](#tc-u-obj-dc-008-共享嵌套引用)-P1
- [x] [Date 深拷贝](#tc-u-obj-dc-009-date-深拷贝)-P1

## TC-U-OBJ-DC-001 嵌套对象深拷贝

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DC-001 |
| 用例名称 | 嵌套对象深拷贝 |
| 优先级 | P0 |
| 前置条件 | 存在对象 `{ a: 1, b: { c: 2 } }` |
| 测试步骤 | 1. 调用 `deepClone(obj)`<br>2. 修改 `clone.b.c = 3` |
| 预期结果 | 1. `clone` 与 `obj` 深度相等但不是同一引用，`clone.b` 与 `obj.b` 也不是同一引用<br>2. `obj.b.c` 仍为 `2` |

## TC-U-OBJ-DC-002 数组深拷贝

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DC-002 |
| 用例名称 | 数组深拷贝 |
| 优先级 | P0 |
| 前置条件 | 存在数组 `[{ n: 1 }]` |
| 测试步骤 | 1. 调用 `deepClone(arr)`<br>2. 执行 `clone.push({ n: 2 })`<br>3. 执行 `clone[0].n = 3` |
| 预期结果 | 1. `clone` 与 `arr` 不是同一引用，元素对象也不是同一引用<br>2. `arr` 长度仍为 `1`，`arr[0].n` 仍为 `1` |

## TC-U-OBJ-DC-003 Symbol 属性

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DC-003 |
| 用例名称 | Symbol 属性不被拷贝 |
| 优先级 | P1 |
| 前置条件 | 存在以可枚举 `Symbol("nested")` 为键、值为 `{ n: 1 }` 的对象，同时含有字符串键 `name: "demo"` |
| 测试步骤 | 调用 `deepClone(obj)` |
| 预期结果 | 1. 字符串键属性被正常拷贝<br>2. Symbol 键属性不被保留（`structuredClone` 不拷贝 Symbol 属性） |

## TC-U-OBJ-DC-004 Map 与 Set

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DC-004 |
| 用例名称 | 拷贝 Map 与 Set 中的对象 |
| 优先级 | P0 |
| 前置条件 | `map` 的值为对象 `{ n: 1 }`；`set` 中存有对象 `{ n: 2 }` |
| 测试步骤 | 1. 分别调用 `deepClone(map)`、`deepClone(set)`<br>2. 修改拷贝中对象的属性 |
| 预期结果 | 1. 拷贝与原容器不是同一引用，仍为 `Map` / `Set`<br>2. 容器内对象也被深拷贝；修改拷贝不影响原对象 |

## TC-U-OBJ-DC-005 循环引用

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DC-005 |
| 用例名称 | 循环引用可深拷贝 |
| 优先级 | P0 |
| 前置条件 | 对象 `obj.self` 指向 `obj` 自身 |
| 测试步骤 | 调用 `deepClone(obj)` |
| 预期结果 | 1. 调用不抛出异常<br>2. `clone` 与 `obj` 不是同一引用<br>3. `clone.self` 指向 `clone` 自身 |

## TC-U-OBJ-DC-006 原始值与 null

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DC-006 |
| 用例名称 | 原始值与 null 原样返回 |
| 优先级 | P0 |
| 前置条件 | 入参分别为 `null`、`1`、`"ok"`、`undefined`、`true` |
| 测试步骤 | 分别调用 `deepClone` |
| 预期结果 | 返回值与入参严格相等，不抛出异常 |

## TC-U-OBJ-DC-007 函数不可克隆

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DC-007 |
| 用例名称 | 函数不可克隆 |
| 优先级 | P1 |
| 前置条件 | 入参为函数，或对象上含有函数属性 |
| 测试步骤 | 1. 调用 `deepClone(() => "ok")`<br>2. 调用 `deepClone({ fn: () => "ok" })` |
| 预期结果 | 两次调用均抛出异常（`structuredClone` 不支持函数） |

## TC-U-OBJ-DC-008 共享嵌套引用

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DC-008 |
| 用例名称 | 共享嵌套引用在拷贝中保持 |
| 优先级 | P1 |
| 前置条件 | `inner = { n: 1 }`，且 `obj.a` 与 `obj.b` 都指向 `inner` |
| 测试步骤 | 1. 调用 `deepClone(obj)`<br>2. 修改 `clone.a.n = 2` |
| 预期结果 | 1. `clone.a` 与 `clone.b` 仍是同一引用<br>2. `clone.a` 与 `obj.a` 不是同一引用<br>3. `obj.a.n` 仍为 `1`，且因共享引用 `clone.b.n` 也为 `2` |

## TC-U-OBJ-DC-009 Date 深拷贝

| 项目 | 内容 |
| ---- | ---- |
| 用例ID | TC-U-OBJ-DC-009 |
| 用例名称 | Date 深拷贝 |
| 优先级 | P1 |
| 前置条件 | 存在对象 `{ createdAt: new Date("2020-01-01T00:00:00.000Z") }` |
| 测试步骤 | 1. 调用 `deepClone(obj)`<br>2. 调用 `clone.createdAt.setFullYear(2021)` |
| 预期结果 | 1. `clone.createdAt` 仍是 `Date` 实例，且与原 `Date` 不是同一引用<br>2. 修改拷贝后，原 `obj.createdAt` 的时间不变 |
