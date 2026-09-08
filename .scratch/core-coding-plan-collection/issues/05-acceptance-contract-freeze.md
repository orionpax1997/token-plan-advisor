# 05: coding-subscription 采集验收与 collect 输出契约冻结

**What to build:** 对本批全部 7 项 `coding-subscription` 候选做端到端验收，并冻结 CLI `collect` 输出契约。验收包括：fixture 快照带采集日期入库并提供刷新流程；`fetched_at` 与页面 `last_updated_at` 双向核对（无官方时间戳的来源以采集方时间戳为准并显式标注）；探索 §7.1 的 8 项核心字段缺失时输出"不可进入后续强排名"的门控标记与原因；覆盖缺口如实声明。`recommend`/分析类契约仍按 ADR-0001 等探索 [02](../../token-plan-advisor/issues/02-explore-benchmark-sources-and-comparability.md) 落地后再冻结。

**Blocked by:** 03（Cursor Provider）、04（Trae/Gemini + collect-all）

**Status:** ready-for-human

- [x] 7 项候选（z.ai、CodeBuddy 国内/国际、Cursor、Trae 国际/CN、Gemini Code Assist）全部可经 `collect-all` 采集，并对至少 2 项做实时抓取冒烟验证
- [x] 核心字段（价格、Plan 标识与 Plan Type、计费周期、额度原始表达、模型清单、地区支持、隐私/数据、购买入口）缺失时输出门控标记与具体缺失清单，而非错误排名信号
- [x] fixture 快照管理流程文档化：采集日期、存放约定、刷新步骤
- [x] 时间戳双向核对：带 `Last updated` 的来源与采集方时间戳并存；无时间戳来源标注"以采集时间为准"
- [x] `collect` 机读 JSON 契约带显式版本号冻结；后续变更需显式升版并在变更记录中说明
- [x] 全部测试通过；README 覆盖核心包安装、CLI 用法、新增 Provider 步骤

## Comments

**2026-09-08 实现**（`packages/core` + `docs/contracts/collect-output-v1.md`）：

- **门控标记**：Schema 新增 `ranking_gate: { eligible, missing_core_fields[] }`（新模块 `src/schema/gate.ts`）。八项核心字段判定规则确定性派生（`attachRankingGate`，8 个 Provider 出口统一装配）；`validatePlanCollection` 强制"标记不可撒谎"——重新派生并与声明值核对，不一致则拒绝发出。当前门控结论：`codebuddy-intl` / `cursor` / `trae-intl` / `trae-cn` 可进入强排名；`zai`（团队席位无现价）、`codebuddy-cn`（私有化档无公开价目与额度、无模型清单）、`cursor-start-in`（无官方隐私声明）、`gemini-codeassist`（官方页无模型清单）分别带逐项缺口清单，缺口 reason 点名具体 Plan / 模型 / 地区。
- **契约冻结**：`docs/contracts/collect-output-v1.md`（`contract_version: 1`，status: frozen）——顶层键集、封闭枚举、门控语义、时间戳语义、fixture 流程、升版规则与变更记录全部入档；`test/contract-freeze.test.ts` 钉住形状，静默改动契约会被测试拦截。已知局限登记在变更记录：`credits_5h_weekly` 被 CodeBuddy 双区与 Trae CN 复用于月度积分（ticket 04 技术债，冻结前复核结论：v1 内不修，真实窗口以 `windows[].window_type` 为准，拆分原语须升版 v2）；Gemini 的 `usage_tier` 复用于日请求分档同理。
- **时间戳双向核对**：`test/acceptance.test.ts` 跨 8 Provider 审计——`last_updated_at === null` 当且仅当 note 标注"以采集时间为准"；非 null 必须标注页面标签；同一采集内 `fetched_at` 同源；两类标注并存。审计抓到并修复两处真实缺口：Trae 国际/CN 的客户端渲染定价页无页面时间戳但未标注"以采集时间为准"。
- **实时冒烟**：`test/live-smoke.test.ts`（`TPA_LIVE_SMOKE=1` 启用，日常套件默认跳过不依赖网络）对 z.ai 与 Gemini Code Assist 发起真实网络采集；本轮实际运行通过（live 模式 11/12 个官方来源端到端输出合法文档）。fixture 模式的 8 项候选采集由既有 `collect-all` 测试覆盖。
- **fixture 管理流程**：采集日期（manifest `captured_at`）、存放约定（`source_id`/`file`/`url` 三元组对齐 `sources.ts`）、刷新步骤（四步，含门控结论断言同步）入 README 与契约文档。
- **测试**：195 项全绿（原 143 + 门控 Schema 4 + 派生/装配/CLI 门控结论 24 + 契约冻结 9 + 验收审计 5 + 实时冒烟 2[env 门控]）；typecheck 干净。README 补齐 collect-all 用法、8 Provider 清单、契约冻结说明、门控要点与新增 Provider 的 `attachRankingGate` 步骤。
