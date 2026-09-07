# 05: coding-subscription 采集验收与 collect 输出契约冻结

**What to build:** 对本批全部 7 项 `coding-subscription` 候选做端到端验收，并冻结 CLI `collect` 输出契约。验收包括：fixture 快照带采集日期入库并提供刷新流程；`fetched_at` 与页面 `last_updated_at` 双向核对（无官方时间戳的来源以采集方时间戳为准并显式标注）；探索 §7.1 的 8 项核心字段缺失时输出"不可进入后续强排名"的门控标记与原因；覆盖缺口如实声明。`recommend`/分析类契约仍按 ADR-0001 等探索 [02](../../token-plan-advisor/issues/02-explore-benchmark-sources-and-comparability.md) 落地后再冻结。

**Blocked by:** 03（Cursor Provider）、04（Trae/Gemini + collect-all）

**Status:** ready-for-agent

- [ ] 7 项候选（z.ai、CodeBuddy 国内/国际、Cursor、Trae 国际/CN、Gemini Code Assist）全部可经 `collect-all` 采集，并对至少 2 项做实时抓取冒烟验证
- [ ] 核心字段（价格、Plan 标识与 Plan Type、计费周期、额度原始表达、模型清单、地区支持、隐私/数据、购买入口）缺失时输出门控标记与具体缺失清单，而非错误排名信号
- [ ] fixture 快照管理流程文档化：采集日期、存放约定、刷新步骤
- [ ] 时间戳双向核对：带 `Last updated` 的来源与采集方时间戳并存；无时间戳来源标注"以采集时间为准"
- [ ] `collect` 机读 JSON 契约带显式版本号冻结；后续变更需显式升版并在变更记录中说明
- [ ] 全部测试通过；README 覆盖核心包安装、CLI 用法、新增 Provider 步骤
