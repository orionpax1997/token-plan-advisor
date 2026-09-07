# 01: 核心包脚手架、Plan Schema v1 与首个 Data Provider 端到端（z.ai GLM Coding Plan）

**What to build:** 按 ADR-0001 建立核心 npm 包与 CLI 入口，落地第一条完整采集路径：Plan Schema v1 → z.ai GLM Coding Plan 的 Data Provider（fixture 与实时双模式）→ CLI `collect` 命令输出已校验的机读 JSON。Schema 需求以 [探索 01 的 Answer](../../token-plan-advisor/issues/01-explore-coding-plan-official-sources.md) §7.5 为准，来源事实以 [research/05](../../token-plan-advisor/research/05-zhipu-glm-coding-plan.md) 为准。选择 z.ai 是因为其失败分类为 `OK_MD`（docs.z.ai 静态 `.md`），且天然覆盖"credits × 模型倍数"额度原语，是风险最低的 tracer bullet。本 ticket 不实现评分、LLM 输出或 Skill 薄壳。

**Blocked by:** None (can start immediately；前置探索 01 已完成)

**Status:** ready-for-agent

- [x] 核心 npm 包可安装、可测试，monorepo 布局符合 ADR-0001；采集与归一化全部在确定性代码内完成
- [x] Plan Schema v1 覆盖：`price_list` 数组、`quota_model` 原语枚举、模型生命周期（`model_code` + 发布/弃用时间 + 档位可用性）、五维 `regional_availability`（注册/支付/网络/服务政策/功能限制）、`data_policy`、`source_url` + `fetched_at` + `last_updated_at` 三时间戳、字段级质量状态（已验证/部分获取/过期/来源冲突/不可获取/不适用）
- [x] 未知、零值与不适用三种状态在 Schema 与输出中可区分，不混为一谈
- [x] z.ai Provider 支持 fixture 与实时两种模式；来源选择遵循探索 §7.3 的来源优先级
- [x] credits × 模型乘数（GLM 系列不同倍率）被标准化为结构化额度原语，原始表达与归一化值均可追溯
- [x] CLI `collect` 输出机读 JSON，含字段状态、Unresolved Fact、采集时间戳与所用来源
- [x] 端到端测试经 CLI seam 验证 fixture 模式的外部行为；领域词汇与 [CONTEXT.md](../../../CONTEXT.md) 一致

## Comments

**2026-09-07 实现**（`packages/core`，`@token-plan-advisor/core@0.1.0`，bin `tpa`）：

- pnpm workspaces monorepo；采集/归一化为纯确定性代码（时钟与 fetcher 可注入）。
- fixture 快照为 **2026-09-07 UTC 直接抓取的官方 `.md`/meta 原文**（11 个来源，`OK_MD`）；fixture 与 live 共用同一条抽取/归一化路径，仅来源加载方式不同。live 模式已对真实 docs.z.ai 冒烟验证（11/11 来源 200）。
- 重要：实时快照与 research/05（同日早前采集）已有事实变化——GLM-4.7 现为 routed→GLM-5.3-Flash（原"支持清单"口径）、个人乘数表新增 GLM-5.3-Flash、GLM-5-Turbo 不再见于 devpack 文档（但订阅页 meta 仍列，已标 `STALE_CONFLICT`）、估算缓存命中率口径更新。这些差异按 Schema 质量状态与 Unresolved Fact 呈现，未静默采用任何一方。
- 已知未获取项（均进 Unresolved Facts）：Pro/Max 与 Team 席位现价（`LOGIN_REQUIRED`）、上下文窗口、数值化并发、中国大陆注册/支付可行性、bigmodel.cn 中国区（独立 Regional Variant，另行采集）。
- 测试 31 项：Schema 校验 9、Provider fixture 12、live 注入 4、CLI seam 5、spawn 端到端 1；`pnpm test` 先构建后跑全套。
