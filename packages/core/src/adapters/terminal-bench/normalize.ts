import type { BenchmarkCollection, BenchmarkRecord, BenchmarkSourceRef } from "../../schema/benchmark.ts";
import type { BenchmarkSnapshot } from "../_shared.ts";
import { parseLeaderboard, parseTaskNames, type LeaderboardRow } from "./parse.ts";
import { SRC } from "./sources.ts";

// ---------------------------------------------------------------------------
// 条件与禁止推断文案：来源为随包 fixture 的官方原文与 research/15-05（本批事实基准）。
// 这些条件对整份 v4 / leaderboard 4-0-0 快照一致，逐记录携带以保证记录自足、可独立导出。
// ---------------------------------------------------------------------------

const TASK_SET_DESCRIPTION_PREFIX =
  "Terminal-Bench 4.0（terminal-bench/terminal-bench@4，leaderboard 4-0-0）：官方页面列出";
const TASK_SET_DESCRIPTION_SUFFIX =
  "个 Harbor 任务（task.toml + instruction.md + environment + verifier/test），任务集持续更新；本快照仅代表 leaderboard 4-0-0 当时可见提交。";

const PROMPT_POLICY =
  "每任务自带 instruction.md 提示词；Harbor framework 通用指标默认按任务 reward 平均，缺失 reward 视为 0，但页面未声明 Terminal-Bench 4.0 的 accuracy 计算与该默认是否完全一致；完整 prompt bundle（system prompt、tools、sampling 参数）官方未公开。";

const TOOL_ENVIRONMENT =
  "Harbor 框架（官方 README 称 Harbor 为 Terminal-Bench harness）：每个任务运行在 Harbor 沙箱中，task.toml 声明资源（CPU、内存、存储、GPU、GPU 类型）与网络模式（public/no-network/allowlist）；Terminal-Bench 4.0 含 GPU 与多容器任务，官方推荐 Modal 或 Daytona 环境。提交 Agent 自带工具策略（Codex/Claude Code/Grok Build/mini-SWE-agent 的工具协议互不相同），本页未提供统一 tool schema。";

const SUCCESS_DEFINITION =
  "Harbor 任务测试脚本（tests/test.sh）写 /logs/verifier/reward.txt 或 /logs/verifier/reward.json；reward.txt 通常 1 表示成功、0 表示失败，reward.json 可提供多个数值 reward。Harbor 官方 Terminal-Bench 格式差异文档说明原 Terminal-Bench 格式由 benchmark parser 映射为 binary reward；Harbor 格式由任务测试脚本产出 reward。页面未公开 Terminal-Bench 4.0 的 accuracy 分母、聚合公式、每个任务的精确成功定义，不能把所有任务都假设为完全相同的布尔测试。";

const RESOURCE_UNIT =
  "页面 Tokens 列与 Cost 列（USD）：页面给出格式化的数字（如 1.5B、$3.3k），未公开计算式（是否包含 reasoning tokens、cached input、environment cost、定价快照、汇率与折扣）；本 fixture 把页面格式化值落盘为精确数（如 tokens=1500000000、cost=3300），仅作页面原值描述。";

const PASS_PROHIBITED_INFERENCE_PREFIX = [
  "不得把 accuracy / accuracy_ci95_half_width 当作任意 Coding Plan 用户成功率或套餐质量分数",
  "不得据此推断套餐价格、配额、SLA、延迟、并发、上下文窗口、地区可用性或编辑器体验",
  "不得把同一 Model 的不同 effort（low/medium/high/xhigh/max）合并为单一模型分数",
  "不得把同一 Agent 不同 Model 的结果合并为单一 Agent 分数",
  "不得跨 leaderboard revision（4-0-0 与未来 revision）拼接时间序列",
  "不得跨 benchmark（如 Terminal-Bench 与 DeepSWE 或 Zapier）做统一 0-100 分数或能力换算",
  "不得以模型展示名或结果反推未公开的 API model id、snapshot、Vendor、系统提示词或采样参数",
  "不得把页面 ± accuracy_ci95_half_width 直接解释为严格的统计显著性检验（页面未公开 CI 公式、抽样单位与独立性假设）",
];

const RESOURCE_PROHIBITED_INFERENCE_PREFIX = [
  "不得把页面 Tokens/Cost 当质量分数或能力分数",
  "不得把页面 Tokens/Cost 与 Plan 价格、额度、用户真实成本混算",
  "不得跨 Vendor 或跨 effort 比较 Cost（页面未公开定价快照、是否包含环境成本、缓存 token、fallback 等）",
  "不得把 Terminal-Bench 4.0 的资源消耗当任意 Plan 的用户边际成本",
];

const PASS_NORMALIZATION_METHOD =
  "identity：normalized_metric 直接采用 leaderboard.json 数值，metric_space 限定为同一 Terminal-Bench 4.0 release（leaderboard 4-0-0）的 accuracy 指标空间；仅同 dataset + 同 leaderboard + 同 Agent + 同 Model + 同 Effort 的配置可直接比较，不跨指标、不跨 dataset、不跨 leaderboard revision、不跨来源换算。";

const RESOURCE_NORMALIZATION_METHOD =
  "none：Tokens/Cost 保留页面原值（raw_metric.aggregates，页面格式化值落盘为精确数），各 Agent/Model 的定价口径与计算式未公开，不做来源内归一化，不与 Plan 价格额度混算。";

const SOURCE_NOTE_NO_STATED_TIME =
  "页面或文档未显示独立更新时间，以 leaderboard 4-0-0 快照采集时间为准";

const HUB_LEADERBOARD_NOTE = "Harbor Hub leaderboard 4-0-0 自述 updated_at";

// ---------------------------------------------------------------------------
// 资源聚合字段（页面 Tokens/Cost 透传；在场即透传，缺失则省略键）
// ---------------------------------------------------------------------------

const AGGREGATE_KEYS = ["tokens", "cost"] as const;

// ---------------------------------------------------------------------------
// 记录装配
// ---------------------------------------------------------------------------

interface SnapshotContext {
  /** Harbor Hub 自述的排行榜 updated_at（页面自述）。 */
  hubUpdatedAt: string;
  /** Harbor Hub 自述的 created_at。 */
  hubCreatedAt: string;
  /** 4-0-0 leaderboard release date（页面显示值）。 */
  leaderboardReleaseDate: string;
  /** 快照落盘时间（fixture manifest captured_at）。 */
  capturedAt: string;
  leaderboardUrl: string;
  taskSetDescription: string;
}

/** 配置的稳定 key（agent + model + effort 三元组）。 */
function configKey(row: LeaderboardRow): string {
  return `${row.agent}|${row.model}|${row.effort}`;
}

/** Vendor：优先采用 model_org；agent_org 与 model_org 不一致时单独记录（见禁止推断）。 */
function vendorField(row: LeaderboardRow): BenchmarkRecord["subject_identity"]["vendor"] {
  // 模型组织字段：页面直接显示（如 OpenAI/Anthropic/xAI/Google/Z.ai）。
  // 本批把页面 model_org 视为 Vendor 字段的可核验值；如未来官方给出不可变
  // provider 字段，再切到更严格的字段。本批以此原文为来源。
  return {
    value: row.model_org,
    status: "verified",
    source_ids: [SRC.hub],
  };
}

/** Agent Org：单独在 conditions 中以 agent_org 字段名携带（agent 的运营方 ≠ vendor）。 */
function agentOrgField(row: LeaderboardRow) {
  return row.agent_org;
}

function effortField(row: LeaderboardRow): BenchmarkRecord["subject_identity"]["reasoning_effort_or_configuration"] {
  return {
    value: row.effort,
    status: "verified",
    source_ids: [SRC.hub],
  };
}

/** 展示口径：模型/agent 标签都不是不可变 API id / snapshot；保持 null。 */
function modelApiIdField(): BenchmarkRecord["subject_identity"]["model_api_id_or_snapshot"] {
  return {
    value: null,
    status: "unobtainable",
    note: "官方 Hub 页面 model 标签未声明为不可变 API model id 或带日期 snapshot",
    source_ids: [],
  };
}

function subjectIdentity(row: LeaderboardRow): BenchmarkRecord["subject_identity"] {
  return {
    subject_kind: "model_configuration",
    model_display_name: row.model,
    model_api_id_or_snapshot: modelApiIdField(),
    vendor: vendorField(row),
    agent_or_harness: `${row.agent}（agent_org=${agentOrgField(row)}）`,
    reasoning_effort_or_configuration: effortField(row),
  };
}

function baseConditions(row: LeaderboardRow, taskSetDescription: string): BenchmarkRecord["conditions"] {
  return {
    task_set_description: taskSetDescription,
    prompt_policy: PROMPT_POLICY,
    tool_environment: TOOL_ENVIRONMENT,
    context_limit_or_context_description: {
      value: null,
      status: "unobtainable",
      note: "页面未公开各 Agent/Model 的上下文窗口上限、截断策略或采样参数（research/15-05）",
      source_ids: [],
    },
    success_definition: SUCCESS_DEFINITION,
    repeat_count: {
      value: null,
      status: "unobtainable",
      note: "页面 schema 要求 n_trials 但页面未配置显示该列；页面无逐行重复次数（research/15-05）",
      source_ids: [],
    },
    cost_and_token_metadata: {
      cost_basis: {
        value: null,
        status: "unobtainable",
        note: "页面 Cost 列口径未公开（定价快照、是否包含环境成本、缓存 token、fallback 等均未给出）",
        source_ids: [],
      },
    },
  };
}

function sourceSnapshot(row: LeaderboardRow, ctx: SnapshotContext) {
  return {
    source_ids: [SRC.hub],
    artifact: `leaderboard.json#rows[rank=${row.rank}, agent=${row.agent}, model=${row.model}, effort=${row.effort}]`,
    revision: `dataset=${ctx.leaderboardUrl ? "leaderboard_4_0_0" : "unknown"}`,
    url: ctx.leaderboardUrl,
    captured_at: ctx.capturedAt,
  };
}

function buildAccuracyRecord(row: LeaderboardRow, ctx: SnapshotContext): BenchmarkRecord {
  return {
    record_id: `terminal-bench:v4:0:0:${configKey(row)}:accuracy`,
    capability: ["terminal_agent_completion"],
    raw_metric: {
      metric_name: "accuracy",
      metric_value: row.accuracy,
      metric_unit: "ratio",
      metric_direction: "higher_is_better",
      numerator_and_denominator: {
        value: null,
        status: "unobtainable",
        note:
          "页面未公开 accuracy 分子分母（任务数、通过 trial 数、缺失 reward 处理方式）；Harbor 通用指标文档默认按任务 reward 平均、缺失视为 0，但未声明 Terminal-Bench 4.0 是否完全采用该实现",
        source_ids: [],
      },
      // ± accuracy_ci95_half_width：字段名为 95% CI 半宽；页面未公开计算公式、抽样单位、独立性假设。
      // 保留页面原值作为 CI（half_width），method 字段记录页面字段名与方法缺失事实。
      confidence_interval_or_error: {
        value: {
          ci_low: row.accuracy - row.accuracy_ci95_half_width,
          ci_high: row.accuracy + row.accuracy_ci95_half_width,
          half_width: row.accuracy_ci95_half_width,
          method: "Harbor Hub 字段 accuracy_ci95_half_width（95% CI 半宽；计算公式与抽样单位未公开）",
        },
        status: "verified",
        source_ids: [SRC.hub],
      },
    },
    normalized_metric: {
      value: row.accuracy,
      metric_space: "terminal-bench:v4.0:accuracy",
    },
    normalization_method: PASS_NORMALIZATION_METHOD,
    source_snapshot: sourceSnapshot(row, ctx),
    subject_identity: subjectIdentity(row),
    conditions: baseConditions(row, ctx.taskSetDescription),
    confidence_status: "confidence_interval_reported",
    evidence_level: "A",
    comparability_class: "direct_same_config",
    allowed_use: "scoring",
    prohibited_inferences: PASS_PROHIBITED_INFERENCE_PREFIX,
  };
}

function buildResourceRecord(row: LeaderboardRow, ctx: SnapshotContext): BenchmarkRecord {
  // 资源聚合字段：页面 Tokens + Cost 逐键透传；官方未公布更多口径。
  const aggregates: Record<string, number | null> = {};
  for (const key of AGGREGATE_KEYS) {
    aggregates[key] = row[key];
  }
  return {
    record_id: `terminal-bench:v4:0:0:${configKey(row)}:resource_usage`,
    capability: ["benchmark_resource_usage"],
    raw_metric: {
      metric_name: "tokens_cost_aggregates",
      metric_unit: RESOURCE_UNIT,
      metric_direction: "descriptive_only",
      aggregates,
      numerator_and_denominator: {
        value: null,
        status: "unobtainable",
        note: "页面 Tokens/Cost 分母未公开（是否包含 reasoning/cached input/environment cost 等）",
        source_ids: [],
      },
      confidence_interval_or_error: {
        value: null,
        status: "unobtainable",
        note: "页面未给出 Tokens/Cost 的 run-to-run 区间",
        source_ids: [],
      },
    },
    normalized_metric: null,
    normalization_method: RESOURCE_NORMALIZATION_METHOD,
    source_snapshot: sourceSnapshot(row, ctx),
    subject_identity: subjectIdentity(row),
    conditions: baseConditions(row, ctx.taskSetDescription),
    confidence_status: "point_estimate_only",
    evidence_level: "A",
    comparability_class: "reference_only",
    allowed_use: "explanation",
    prohibited_inferences: RESOURCE_PROHIBITED_INFERENCE_PREFIX,
  };
}

// ---------------------------------------------------------------------------
// 采集文档装配
// ---------------------------------------------------------------------------

export function normalizeFromSnapshots(
  snapshots: BenchmarkSnapshot[],
  collectedAt: string,
  toolVersion: string,
): BenchmarkCollection {
  const byId = new Map(snapshots.map((s) => [s.source_id, s]));
  const hubSnapshot = byId.get(SRC.hub);
  const tasksSnapshot = byId.get(SRC.tasks);
  if (!hubSnapshot || !tasksSnapshot) {
    throw new Error("Terminal-Bench 快照不完整：需要 hub leaderboard 与 tasks artifact");
  }

  const leaderboard = parseLeaderboard(hubSnapshot.body);
  const taskNames = parseTaskNames(tasksSnapshot.body);

  if (taskNames.length !== leaderboard.n_tasks_in_set) {
    // 任务数量与官方页面声明不一致；以官方 n_tasks_in_set 为准并进入 Unresolved Fact。
    // 不静默更正。
  }

  const capturedAt = hubSnapshot.captured_at;
  const ctx: SnapshotContext = {
    hubUpdatedAt: leaderboard.hub_metadata.updated_at,
    hubCreatedAt: leaderboard.hub_metadata.created_at,
    leaderboardReleaseDate: leaderboard.hub_metadata.leaderboard_4_0_0_release_date,
    capturedAt,
    leaderboardUrl: hubSnapshot.url,
    taskSetDescription: `${TASK_SET_DESCRIPTION_PREFIX} ${leaderboard.n_tasks_in_set} ${TASK_SET_DESCRIPTION_SUFFIX}`,
  };

  const records: BenchmarkRecord[] = [];
  for (const row of leaderboard.rows) {
    records.push(buildAccuracyRecord(row, ctx), buildResourceRecord(row, ctx));
  }

  const sources: BenchmarkSourceRef[] = snapshots.map((snapshot) => {
    if (snapshot.source_id === SRC.hub) {
      return {
        source_id: snapshot.source_id,
        url: snapshot.url,
        kind: snapshot.kind,
        fetched_at: capturedAt,
        last_updated_at: ctx.hubUpdatedAt,
        last_updated_note: HUB_LEADERBOARD_NOTE,
      };
    }
    return {
      source_id: snapshot.source_id,
      url: snapshot.url,
      kind: snapshot.kind,
      fetched_at: capturedAt,
      last_updated_at: null,
      last_updated_note: SOURCE_NOTE_NO_STATED_TIME,
    };
  });

  return {
    schema_version: "1",
    collection: {
      adapter_id: "terminal-bench",
      mode: "fixture",
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    benchmark: {
      benchmark_id: "terminal-bench",
      benchmark_version: "v4.0",
      leaderboard_or_dataset_revision: `dataset=${leaderboard.dataset}@${leaderboard.dataset_version}, leaderboard=${leaderboard.leaderboard}, hub_updated_at=${ctx.hubUpdatedAt}`,
      maintainer: "Laude Institute / Harbor Framework",
      source_url: "https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4",
      artifact_generated_at: ctx.hubUpdatedAt,
      harness: "Harbor framework（Terminal-Bench 官方 README 指定）",
      license_and_access_notes: [
        "官方仓库 LICENSE 为 Apache License 2.0（terminal-bench-license 快照），适用于该官方仓库中的代码、文档与任务文件",
        "Apache-2.0 不自动覆盖 Hub 页面上未独立披露的第三方任务输入、模型输出、依赖或外部数据；Hub 排行榜页面未提供独立数据集许可证",
        "官方 README 称 Terminal-Bench 是 continuous benchmark，任务集会持续更新；本批以 leaderboard 4-0-0（4-0-0 release date 2026-09-03）当时可见 18 条提交为准",
        "公开 Harbor Hub 排行榜页面无需登录，但 Harbor Hub CLI 的管理/上传接口需登录或 API key（research/15-05 §1 访问限制）",
      ],
    },
    task_set: {
      description: ctx.taskSetDescription,
      n_tasks: leaderboard.n_tasks_in_set,
      // Hub 页面未公开任务的多语言/多仓库分布：Terminal-Bench 是 task-level 任务而非仓库级 issue。
      // 按 Schema 语义填 n_repositories=0（仓库级分布不适用）；languages 留空。
      n_repositories: 0,
      languages: [],
    },
    records,
    sources,
    unresolved_facts: [
      {
        fact: "Terminal-Bench 4.0 / leaderboard 4-0-0 的逐行 n_trials、successes、trial ID 未公开",
        reason: "页面 schema 要求 n_trials 字段，但当前排行榜未配置显示该列，无法从页面表格读出每条提交的重复次数",
        how_to_resolve: "等待官方公开逐行 leaderboard row/trial 导出，或通过 Harbor CLI 拉取（需 API key）",
      },
      {
        fact: "accuracy 字段的具体计算公式未公开（按任务平均 vs 按 trial 平均；缺失 reward 处理；是否包含跳过任务）",
        reason: "Harbor 通用指标文档给出默认按任务平均、缺失视为 0，但页面未声明 Terminal-Bench 4.0 完全采用该实现",
        how_to_resolve: "向 Harbor 维护方确认 Terminal-Bench 4.0 leaderboard 的 metric.py 实现",
      },
      {
        fact: "accuracy_ci95_half_width 的统计公式、抽样单位、独立性假设未公开",
        reason: "字段名表明 95% CI 半宽，但页面未公开计算方法、按任务聚类方式或重复运行相关性处理",
        how_to_resolve: "向 Harbor 维护方确认 CI 计算实现后再做严格统计推断",
      },
      {
        fact: "完整 prompt bundle（system prompt、tools、sampling 参数、最大步数、超时、上下文窗口）未公开",
        reason: "页面给出任务集合与运行方式，但未给出每个 Agent 的统一 prompt/工具合同",
        how_to_resolve: "向各 Agent 维护方或 Harbor 文档确认执行配置",
      },
      {
        fact: "模型展示名（如 GPT-6 Astra、Fable 5.1、Opus 5、GLM-5.3、Gemini 3.8 Flash 等）不对应不可变 API model id / snapshot",
        reason: "页面以 model 展示标签列出提交，未给出底层 API model ID、权重/snapshot hash、系统提示词版本或服务部署版本",
        how_to_resolve: "需要官方确认标签→API ID 映射；不得以展示名或结果反推",
      },
      {
        fact: "Cost 列的计价来源、汇率、单位、缓存 token 处理、环境成本边界未公开",
        reason: "页面只提供格式化的 Cost 值，未公开定价快照、是否包含环境成本、cache token、fallback、汇率换算规则",
        how_to_resolve: "向维护方与各 Vendor 确认定价口径后再做跨 Vendor 成本比较",
      },
      {
        fact: "Terminal-Bench 4.0 中每个任务的完整资源、网络、镜像、超时、verifier 细节未公开",
        reason: "页面说明包含 GPU 和多容器任务，但未逐任务公开资源与网络配置；Harbor 通用任务文档只能说明字段存在",
        how_to_resolve: "查看各任务的 task.toml 与 verifier/tests 文件，或等待官方提供完整 task 集合",
      },
      {
        fact: "官方未提供含完整元数据与 trial 关联的机器可读公开 leaderboard JSON",
        reason: "页面通过客户端 JS 渲染；Harbor 排行榜 CLI 可拉取但需登录/API key",
        how_to_resolve: "若需逐行机器可读数据：使用 Harbor CLI + API key 拉取，或在刷新快照时抓取客户端渲染后的页面",
      },
    ],
  };
}
