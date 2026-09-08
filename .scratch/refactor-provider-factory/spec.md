# refactor-provider-factory

折叠 Provider 模板层：把 8 份逐字相同的 provider.ts、8 份纯再导出文件收敛为一个注册表工厂。源于 2026-09-08 架构评审（候选 1，强度 Strong）。

## 背景结论（评审走查）

- `DataProvider` 接口已是 deep module（`collect({mode, now, fetcher})` 背后 ~1700 行实现），本工作**不动任何接口与契约**。
- 复杂度堆积在实现侧：8 个 provider.ts 约 95% 逐字相同；4 个 load.ts + 4 个 shared.ts 为纯再导出；`readToolVersion` 本地复制 7 份（仅 zai 用 `_shared.ts` 共享版，消重半程已现分叉）；`attachRankingGate(normalizeFromSnapshots(...))` 接线重复 8 份。
- zai 形态分叉：2 参 `loadSnapshots` 包装、无回退链声明、`source_chains: []` 硬编码。
- 已核实：契约冻结测试为断言式，对 `source_chains` 内容零断言；再导出文件仅家族内部引用、测试零引用；`index.ts` 公共面在仓库内无外部代码消费方。

## 决策记录（grilling 2026-09-08）

| 决策 | 结论 |
|---|---|
| 收敛形状 | **温和收敛**：模板全灭，每家族保留一行薄壳 `createXxxProvider`，路径不变，测试 import 与 README 不动 |
| zai 分叉 | **纯结构收敛**：`chains: []` 为合法规格值，zai 输出行为不变；数据拉齐另立工作 |
| 纯再导出文件 | **删除**（load.ts ×4 + shared.ts ×4），家族内部 import 改指 `../_shared.ts` |
| 范围 | 候选 1 + `fakeLiveFetcher` 提升到 `test/helpers/`；normalize 字段工厂（候选 2）**不并入** |
| 落地形式 | 一个 ticket，8 家一次全收 |
| 工厂形状 | `createSnapshotProvider(spec)`，spec = `{ providerId, fixtureDir, sources, chains, normalizeFromSnapshots }`（8 份 diff 后的完整差异点清单）；`readToolVersion`/`attachRankingGate`/时钟/包定位为工厂内部管道步骤 |
| 工厂落点 | 新文件 `packages/core/src/providers/factory.ts`（装配语义；`_shared.ts` 保持装载/链派生语义） |
| 词汇 | 「回退链（Source Chain）」已补入 CONTEXT.md |

## 非目标

- normalize 字段工厂与排序器收敛（评审候选 2，ticket 02/03 已记录为待提取债务）
- zai 回退链数据调研与接线（需 z.ai 官方来源工作）
- `capture()` 测试基建提升、CLI 注册表解耦（候选 3）、fixture 装载合一（候选 4）
