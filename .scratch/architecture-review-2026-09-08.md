# 架构评审 2026-09-08 · 结论记录

本文件是 `/tmp/architecture-review-20260908-210025.html`（会丢失）的永久结论。评审范围：近期提交热点（providers/、adapters/、cli.ts，10 个采集类 ticket）；方法：codegraph 子代理走查 + 删除测试判定 + grilling 决策树。

## 总评

接口层已是 deep module——`DataProvider.collect({mode, now, fetcher})` 与 `BenchmarkAdapter.collect({now})` 两字段方法背后是完整采集实现，fixture/live seam 与回退链各有单一实现。复杂度堆积在实现侧复制；且仓库存在「消重做到一半留下分叉」的复发模式（readToolVersion ×7、双 loadFixtureManifest 写法漂移），评审动作以收敛为主。

## 候选终态

| 候选 | 终态 | 落点 / 条件 |
|---|---|---|
| 1 · 折叠 Provider 模板层（Strong） | ✅ 完成 | `.scratch/refactor-provider-factory/issues/01`（commit 3a1ece5，输出 diff 为空，342 测试） |
| 2 · 提升 normalize 工具带（Strong） | ✅ 完成 | `.scratch/refactor-normalize-utils/issues/01`（共享层 22 测试，全量 364，双轴 code review 通过） |
| 3 · CLI 编排解耦 / 注册表注入（Worth exploring） | ⏸ 挂起 | **触发条件：CLI 下次实质变化**（如 ADR-0001 方向的 recommend 命令落地）——届时 registry.ts 外移 + `runCli` factories 注入一起做。挂起理由：CLI 不随 vendor 增长（注册表加一行），无增长性摩擦；价格断言打穿 CLI 测试是「多改一处」而非漏洞（provider 测试先红） |
| 4 · fixture 装载合一（Worth exploring） | ▶ 开小票 | `.scratch/unify-fixture-loading/`——17 行装载核心 ×2 逐字同（含错误文案，共同演化压力真实）、3 行 manifest 装载 ×2 写法已漂移（async/await vs `.then()`）；类型已共享、实现未合一 |
| 5 · benchmark 字段工厂（Speculative） | ✖ 关闭 | **判定不可单独立项**：6 份 benchmark normalize 共 3227 行，逐字重复仅 ~84 行（2.6%）、可省上限 ~150–180 行，60% 是 earning its keep 的领域决策（SIGNAL_SPECS/SCORE_SPECS/COMPONENT_SPECS 映射表、prohibited_inferences 文案、Evidence Level/Comparability Class 选级）。**搭车条件：第 7 个 benchmark adapter 落地时**顺手做——三件套复用（benchmark 字段形状与 PlanField 零差异，`unobtainable`/`notApplicable` 零改动可用、`verified` 需补 note 参）+ sources.map 参数化 |

## 防重提判定（未来评审勿再提出）

1. **Unresolved Fact 组装不可收敛**：60 处内联差异纯文案（文案即领域知识）、骨架仅 `push({...})`、schema 形状仅 4 键。详见 `.scratch/refactor-normalize-utils/spec.md`。
2. **benchmark normalize 主体不可收敛**：见上表候选 5 判定。
3. **`extractStatedDate` 不做参数化工厂**：正则/归一化路径是 vendor 逻辑（已随候选 2 只共享月份表归一化器）；zai labels 循环签名与 codebuddy/intl `(empty)` 特判为真实分叉。
4. **`notApplicable` 不引入 zai/codebuddy×2**：缺席是语义选择（有意用 `unobtainable`+note 表达），非代码缺失。

## 评审过程中的事实修正（相对 HTML 报告初版）

- `unobtainable` 签名分叉是 **A 族（zai+cursor×2 双参）/ B 族（trae×2+codebuddy×2+gemini 单参）**，非「zai 特殊」；统一双参无 schema 障碍（gate.ts 对 failure_code 零约束）。
- `bodyOf`/`pickBodyByChain` 住在 extract.ts 而非 normalize.ts；`pickBodyByChain` 仅 ×5（cursor 系用 `attribute()` 归因抽取，是替代品非缺失）。
- `fakeLiveFetcher` 实为 3 文件 3 份（非 4）；zai 无 shared.ts，ticket 01 实删 9 文件。
- 三时间戳块 zai 无条件写 `failure_code` 与其余条件展开输出等价（序列化省略 undefined 键）。

## 后续评审入口

- 下轮评审热点预测：CLI（候选 3 触发后）、benchmark adapter 第 7 家落地时的装配路径、`schema/` 与 gate（本次两轮均未触碰，且是冻结契约所在，动它需走契约变更流程）。
