# 01: 折叠 Provider 模板层为注册表工厂

**What to build:** 新增 `packages/core/src/providers/factory.ts`：`createSnapshotProvider(spec)` 吸收 8 份 provider.ts 的全部模板——`readToolVersion`、`attachRankingGate(normalizeFromSnapshots(...))` 接线、时钟注入、`resolvePackageRoot`/fixture 装载——成为管道固定步骤；spec 恰好承载 8 份 diff 后的差异点 `{ providerId, fixtureDir, sources, chains, normalizeFromSnapshots }`，`chains: []` 合法（zai 即此形态）。8 个 provider.ts 缩为一行薄壳，路径不变；删除 8 个纯再导出文件（`*/load.ts` ×4、`*/shared.ts` ×4），家族内部 import 改指 `../_shared.ts`；zai 的 2 参 `loadSnapshots` 包装并入统一 3 参形态（输出行为不变，`source_chains` 仍为空数组）。`fakeLiveFetcher`（3 文件 4 份）提升到 `test/helpers/`。决策背景见 [spec.md](../spec.md)。

**Status:** ready-for-human

- [x] `providers/factory.ts` 落地：`createSnapshotProvider` + 规格类型；工厂内部完成包定位、toolVersion 读取、时钟、快照装载、ranking gate 接线，调用方不可见
- [x] 8 个 provider.ts 均缩为一行薄壳（同路径导出同名工厂），`src/index.ts` 公共导出面与 README 零改动
- [x] `providers/*/load.ts` 与 `providers/*/shared.ts` 全部删除（8 个文件），无残留 import
- [x] zai 切换到统一 3 参装载形态 + 空链规格；`collect zai` 输出与重构前逐字段一致（`source_chains: []` 不变）
- [x] `fakeLiveFetcher` 收敛为 `test/helpers/` 单一实现，3 个测试文件改引用
- [x] 现有测试全绿：契约冻结（collect/collect-all/benchmark）、ranking gate、8 家 provider 测试、全部回退测试
- [x] `collect` / `collect-all` 输出与重构前 diff 为空（fixture 模式逐 provider 核对）

## Comments

**2026-09-08 grilling 结论**：温和收敛（Q1）、zai 纯结构（Q2）、删再导出（Q3）、捎带 fakeLiveFetcher（Q4）、一次全收（Q5）、新文件 factory.ts（Q6）。「回退链」术语已入 CONTEXT.md。候选 2（normalize 字段工厂，签名在家族间不一致）按既有记录留待独立工作。

**2026-09-08 实现记录（agent）**

- TDD：先写 `test/providers-factory.test.ts`（Red：模块不存在）→ 实现 `factory.ts`（Green 6/6）→ 逐家缩壳 → 改 23 处家族内 import → 删 9 文件 → helper 收敛 → 全量验证。
- **实际探测与 spec 记录的两处出入**：① `fakeLiveFetcher` 实为 3 文件 3 份（非 4 份，live-smoke 不含）；② zai 无 `shared.ts`，故删除文件为 8 纯再导出 + zai/load.ts（2 参包装）共 9 个。「一行薄壳」落地为单表达式箭头常量（9–15 行含保留的家族文档注释）。
- **装配期校验（超出字面 spec 的决策，code review Spec 轴标注为 creep，经权衡保留）**：工厂构造时校验 `chains` 引用的 `source_id` ⊆ `sources`（fail-fast 抛错）。理由：给 spec.chains 以真实消费语义，属装配语义；已探测 8 家数据全部满足，不影响任何 collect 输出。快照级缺失仍由 `deriveSourceChains` 容错。`spec.chains` 与 normalize 层消费的 CHAINS 常量同源（同一 sources.ts 导出），结构性无漂移。
- **输出一致性核对方式**：临时脚本以固定时钟（`2026-01-01T00:00:00.000Z`）对 8 家 fixture 模式 `collect`，重构前/后各捕获一份 JSON，`diff` 为空（逐 provider 逐字段一致，含 `source_chains: []`）。`collect-all` 由 `contract-freeze.test.ts` 与 `collect-all.test.ts` 钉形状。
- 新增 `test/helpers/fake-live-fetcher.ts`（3 个回退/live 测试改引用）；新增工厂测试 6 例。全量 342 passed | 2 skipped（基线 336 + 工厂 6），typecheck 通过，`src/index.ts`/README 零改动。
