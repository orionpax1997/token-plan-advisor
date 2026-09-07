# Core Package：coding-subscription 信息采集（第一批）

Status: ready-for-agent

本批次实现 ADR-0001 中的核心包（npm 包 + CLI）与 coding-subscription Plan 的信息采集能力，是 [父规格](../token-plan-advisor/spec.md) 的第一个垂直切片。范围界定以探索结论为准：[探索 01 的 Answer](../token-plan-advisor/issues/01-explore-coding-plan-official-sources.md) 与 [research/](../token-plan-advisor/research/) 下 14 份单 Vendor 研究文件。

## In Scope

- 核心包脚手架、Plan Schema v1、Data Provider 契约、失败分类与来源回退链
- 7 项 `coding-subscription` 候选的 Data Provider：z.ai GLM Coding Plan、CodeBuddy 国内/国际、Cursor、Trae 国际/CN、Gemini Code Assist
- CLI `collect` / `collect-all` 命令与机读 JSON 输出契约（本批冻结 `collect` 契约）

## Out of Scope

- Benchmark 采集与可比性（等探索 [02](../token-plan-advisor/issues/02-explore-benchmark-sources-and-comparability.md) 落地）
- `general-subscription`（Claude/Codex/Google AI 订阅）与 `api-usage` 候选的 Provider
- Recommendation Policy、评分、动态权重、LLM 输出、Skill 薄壳与打包
- `recommend`/分析类 CLI 契约（按 ADR-0001 等探索 02 后再冻结）

## Tickets

| # | Ticket | Blocked by |
|---|--------|-----------|
| 01 | 核心包脚手架 + Plan Schema v1 + z.ai Provider 端到端 | None |
| 02 | 失败分类与来源回退链 + CodeBuddy 双区 Provider | 01 |
| 03 | Cursor Provider：动态渲染回退与美元等值双池 | 02 |
| 04 | Trae 双区与 Gemini Code Assist Provider + collect-all | 02（与 03 并行） |
| 05 | coding-subscription 采集验收与 collect 输出契约冻结 | 03、04 |

依赖图：

```text
01 ── 02 ──┬── 03 ──┐
           └── 04 ──┴── 05
```
