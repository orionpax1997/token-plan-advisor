# 01: 核心包脚手架、Plan Schema v1 与首个 Data Provider 端到端（z.ai GLM Coding Plan）

**What to build:** 按 ADR-0001 建立核心 npm 包与 CLI 入口，落地第一条完整采集路径：Plan Schema v1 → z.ai GLM Coding Plan 的 Data Provider（fixture 与实时双模式）→ CLI `collect` 命令输出已校验的机读 JSON。Schema 需求以 [探索 01 的 Answer](../../token-plan-advisor/issues/01-explore-coding-plan-official-sources.md) §7.5 为准，来源事实以 [research/05](../../token-plan-advisor/research/05-zhipu-glm-coding-plan.md) 为准。选择 z.ai 是因为其失败分类为 `OK_MD`（docs.z.ai 静态 `.md`），且天然覆盖"credits × 模型倍数"额度原语，是风险最低的 tracer bullet。本 ticket 不实现评分、LLM 输出或 Skill 薄壳。

**Blocked by:** None (can start immediately；前置探索 01 已完成)

**Status:** ready-for-agent

- [ ] 核心 npm 包可安装、可测试，monorepo 布局符合 ADR-0001；采集与归一化全部在确定性代码内完成
- [ ] Plan Schema v1 覆盖：`price_list` 数组、`quota_model` 原语枚举、模型生命周期（`model_code` + 发布/弃用时间 + 档位可用性）、五维 `regional_availability`（注册/支付/网络/服务政策/功能限制）、`data_policy`、`source_url` + `fetched_at` + `last_updated_at` 三时间戳、字段级质量状态（已验证/部分获取/过期/来源冲突/不可获取/不适用）
- [ ] 未知、零值与不适用三种状态在 Schema 与输出中可区分，不混为一谈
- [ ] z.ai Provider 支持 fixture 与实时两种模式；来源选择遵循探索 §7.3 的来源优先级
- [ ] credits × 模型乘数（GLM 系列不同倍率）被标准化为结构化额度原语，原始表达与归一化值均可追溯
- [ ] CLI `collect` 输出机读 JSON，含字段状态、Unresolved Fact、采集时间戳与所用来源
- [ ] 端到端测试经 CLI seam 验证 fixture 模式的外部行为；领域词汇与 [CONTEXT.md](../../../CONTEXT.md) 一致
