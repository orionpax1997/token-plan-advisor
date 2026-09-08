import type { BenchmarkCollection, BenchmarkRecord, BenchmarkSourceRef } from "../../schema/benchmark.ts";
import type { BenchmarkSnapshot } from "../_shared.ts";
import {
  parseAbout,
  parseApiDocs,
  parseLeaderboard,
  parseMethodology,
  parseRegistry,
  parseSystemPrompts,
  parseTerms,
  type AboutSnapshot,
  type ApiDocsSnapshot,
  type LeaderboardRow,
  type LeaderboardSnapshot,
  type MethodologySnapshot,
  type RegistrySnapshot,
  type TermsSnapshot,
} from "./parse.ts";
import { SRC } from "./sources.ts";

// ---------------------------------------------------------------------------
// 条件与禁止推断文案：来源为随包 fixture 的官方接口/方法页转写快照与 research/15-03。
// API 文档允许商业使用（要求署名+链接）但 Terms 限制爬虫与商业用途——存在适用范围张力。
// 条件对整份 leaderboard 一致，逐记录携带以保证记录自足、可独立导出。
// ---------------------------------------------------------------------------

/**
 * 全部记录共享的禁止推断前缀（research/15-03 §Coding Plan 使用边界 + ticket 04 要求）。
 * 数字（registry 总数、榜单覆盖数、battles 门槛）从 fixture 插值，避免快照刷新后文案失真。
 */
function buildSharedProhibitedInferences(
  registry: RegistrySnapshot,
  methodology: MethodologySnapshot,
  about: AboutSnapshot,
  terms: TermsSnapshot,
  apiDocs: ApiDocsSnapshot,
): string[] {
  const registryTotal = registry.registry_total_models;
  const leaderboardCovered = registry.leaderboard_total_models_with_scores;
  return [
    "不得把 Design Arena Code leaderboard 排名直接当作 Coding Plan 排名、套餐性价比排名或购买建议",
    "不得从模型分数推断某个 Coding Plan 是否包含该模型、是否在用户所在地区可用、是否有相同上下文/工具/system prompt、是否允许商用或是否有同一额度",
    `不得把官方 registry 总数（${registryTotal}）当榜单覆盖数（${leaderboardCovered}）——registry vs leaderboard 是不同口径`,
    "不得把 Overall Frontend (Text-to-HTML) 与单独 Website/UI/Game 等类别直接等价——只允许在同快照 + 同类别内比较",
    "不得把 Elo 当绝对百分比：Elo 是随模型池、prompt 分布和 active sampling 变化的相对位置（Bradley-Terry strength 近似），历史快照不能直接比较；win rate 与 Elo 可能不同排序",
    "不得跨不同 battles 门槛的模型直接比较：方法页声明最小 15 次比较，About 页声明主图 50 次过滤、约 200 次才较可靠——本批如实记录差异，不强行归一化",
    `不得把 avgGenerationTimeMs 当 Plan 延迟/SLA——这是 Design Arena 平台特定的生成时间参考，与 Coding Plan 延迟口径不可换算`,
    "不得把 Design Arena Code 当编码正确性/编译/测试通过率/可维护性/安全性/多文件仓库/终端工具/调试/重构/后端/部署/生产可靠性 benchmark——这是单轮单文件 HTML 视觉偏好",
    "不得把 Design Arena Code 当 agent loop、tool calls、follow-ups 或多轮开发能力 benchmark——页面没有 agent loop 与 tool calls",
    "不得在未取得 Design Arena 明确许可时批量抓取接口或页面（Terms 限制爬虫、复制和商业用途；API 文档同时声明可商业使用但要求署名+链接——适用范围张力）",
    "不得基于 Design Arena Code 推断固定 API model id、模型 snapshot、Vendor 与 Coding Plan 的对应关系",
    "不得把 Design Arena Code 排名直接映射为 Coding Plan 套餐排名",
    `官方不保证数据完整、及时或可靠（${terms.no_warranty}）`,
  ];
}

// ---------------------------------------------------------------------------
// 记录装配
// ---------------------------------------------------------------------------

/** Design Arena Code 记录共享的快照环境。 */
interface SnapshotContext {
  /** 快照落盘时间（fixture manifest captured_at）。 */
  capturedAt: string;
  /** 接口请求时间（leaderboard 接口 captured_at）。 */
  leaderboardCapturedAt: string;
  leaderboardUrl: string;
  taskSetDescription: string;
  registryTotal: number;
  leaderboardCovered: number;
  /** 方法页声明的最小比较次数。 */
  minBattlesMethodology: number;
  /** About 页声明的最小比较次数（主图过滤）。 */
  minBattlesAboutMain: number;
  /** About 页声明的最小比较次数（可靠性）。 */
  minBattlesAboutReliability: number;
  /** btStdErr 当前值（allcategories 接口当前为 null）。 */
  btStdErrNote: string;
  /** 可选 prompt enhancement 使用的模型（system-prompts 页原文）。 */
  enhancementModel: string;
}

/** 计数口径：wins/losses/battles 是 head-to-head pairwise vote 计数（整数）。 */
function battleCounts(row: LeaderboardRow): { numerator: number; denominator: number } {
  // wins + losses = 已完成比较；与官方 battles 字段等价（无平局/无效统计），用 wins + losses 作主口径；
  // 保留官方 battles 字段以备未来差异检测——此处 numerator=wins、denominator=losses+battles 中较大者？
  // 选用 wins / battles 直接表达「在该模型所有 pairwise 中胜出比例」（win rate 也是 wins/battles）。
  return { numerator: row.wins, denominator: row.battles };
}

function sourceSnapshot(ctx: SnapshotContext, artifactLocator: string): BenchmarkRecord["source_snapshot"] {
  return {
    source_ids: [SRC.leaderboard, SRC.methodology, SRC.about],
    artifact: artifactLocator,
    revision:
      `leaderboard_captured_at=${ctx.leaderboardCapturedAt}, ` +
      `registry_total=${ctx.registryTotal}, leaderboard_covered=${ctx.leaderboardCovered}, ` +
      `min_battles_methodology=${ctx.minBattlesMethodology}, min_battles_about_main=${ctx.minBattlesAboutMain}, ` +
      `min_battles_about_reliability=${ctx.minBattlesAboutReliability}, ` +
      `captured_at=${ctx.capturedAt}`,
    url: ctx.leaderboardUrl,
    captured_at: ctx.capturedAt,
  };
}

function baseConditions(row: LeaderboardRow, ctx: SnapshotContext): BenchmarkRecord["conditions"] {
  return {
    task_set_description: ctx.taskSetDescription,
    // 用户触发的真实 prompt，不是固定题集；可选 prompt enhancement 改变 prompt 分布
    prompt_policy:
      `真实用户 prompt 触发生成（非固定公开题库）；可选 prompt enhancement 使用 ${ctx.enhancementModel}（增强前后不是同一 prompt 分布）；` +
      `官方方法页声明 prompt 字符上限与 system prompt bundle 声明不一致（如实记录差异）`,
    tool_environment:
      "单轮、单文件 HTML 生成；无 agent loop、tool calls、follow-ups；sandboxed iframe 渲染，约 1200px viewport；允许部分 CDN/library；" +
      "采样动态性：每个投票 session 随机抽取 4 个模型加 1 个 backup 形成多组 pairwise votes（active sampling），模型曝光与对手结构不必均匀——历史快照不可直接比较",
    // 上下文窗口未公开
    context_limit_or_context_description: {
      value: null,
      status: "unobtainable",
      note: "Design Arena Code 没有统一的上下文窗口声明；prompt 字符上限官方方法页与 system prompt 页声明不一致",
      source_ids: [],
    },
    success_definition:
      "成功信号是用户视觉与交互偏好（pairwise preference）；每个投票 session 随机抽取 4 个模型加 1 个 backup，形成多组 pairwise votes；active sampling 使模型曝光和对手结构不必均匀；Elo 是 Bradley-Terry strength 的近似",
    // 没有公开的 repeat_count 概念——battles 是计数口径
    repeat_count: {
      value: row.battles,
      status: "verified",
      note: `官方 leaderboard API battles 字段（head-to-head pairwise 比较数）；方法页声明最小 15 次比较，About 页声明主图 50 次过滤、约 200 次才较可靠——本条记录 battles=${row.battles}`,
      source_ids: [SRC.leaderboard],
    },
    cost_and_token_metadata: {
      cost_basis: {
        value: null,
        status: "not_applicable",
        note: "Design Arena Code 不公开 cost/price 字段；avgGenerationTimeMs 是平台特定生成时间参考，不与 Plan 价格/延迟口径可比",
        source_ids: [],
      },
    },
  };
}

function subjectIdentity(row: LeaderboardRow): BenchmarkRecord["subject_identity"] {
  return {
    subject_kind: "model_configuration",
    model_display_name: row.modelId,
    model_api_id_or_snapshot: {
      value: null,
      status: "unobtainable",
      note: "Design Arena API 的 modelId 是机读字符串，未声明为不可变 API model id / snapshot；不以展示名或分数反推",
      source_ids: [],
    },
    // Design Arena 不公开 vendor 字段；保持 null + unobtainable
    vendor: {
      value: null,
      status: "unobtainable",
      note: "Design Arena Code 不公开 vendor 字段；不得以 modelId 猜 Provider",
      source_ids: [],
    },
    // Design Arena Code 是单轮单文件 HTML，无 agent/harness 概念
    agent_or_harness: "Design Arena Code（单轮单文件 HTML 生成；无 agent loop、tool calls）",
    reasoning_effort_or_configuration: {
      value: null,
      status: "not_applicable",
      note: "Design Arena Code 不公开 reasoning effort / 模型配置；可选 prompt enhancement 使用第三方模型",
      source_ids: [],
    },
  };
}

interface ScoreSpec {
  /** record_id 段。 */
  slug: string;
  /** metric_name。 */
  metricName: string;
  /** metric_value 读取字段。 */
  rowField: keyof LeaderboardRow;
  /** higher_is_better（Elo/winRate）；avgGenerationTimeMs 是 descriptive_only。 */
  direction: "higher_is_better" | "lower_is_better" | "descriptive_only";
  /** metric_unit。 */
  metricUnit: string;
  /** 用于 metric_space 的标识。 */
  metricSpaceKey: string;
  /** 是否进入 benchmark_resource_usage（avgGenerationTimeMs 进入）。 */
  isResourceUsage: boolean;
  /** leaderboard captured_at 用于 metric_space 前缀（防止跨版本统一分）。 */
  version: string;
  /** confidence_status。 */
  confidenceStatus: "confidence_interval_reported" | "point_estimate_only";
  /** normalization_method 文本。 */
  normalizationMethod: string;
  /** note。 */
  note: string;
  /** capability 标签（注册表的 Design Arena 行）。 */
  capability: BenchmarkRecord["capability"];
}

const SCORE_SPECS_TEMPLATE = (version: string): ScoreSpec[] => [
  {
    slug: "elo",
    metricName: "elo",
    rowField: "elo",
    direction: "higher_is_better",
    metricUnit: "elo_score",
    metricSpaceKey: "elo",
    isResourceUsage: false,
    version,
    capability: ["frontend_visual_preference"],
    confidenceStatus: "point_estimate_only",
    normalizationMethod:
      `identity：normalized_metric 直接采用官方 leaderboard API elo 数值；metric_space 限定为同一 Design Arena Code leaderboard 接口快照（${version}）内的 elo 指标空间；` +
      "Elo 是 Bradley-Terry strength 的近似，随模型池、prompt 分布与 active sampling 变化；当前接口 btStdErr=null 不构造伪 CI",
    note: "Elo 是 head-to-head 相对技能评分；约 1200 为平台基准；当前 allcategories 接口 btStdErr 为 null，不自行制造精确误差范围",
  },
  {
    slug: "win_rate",
    metricName: "win_rate",
    rowField: "winRate",
    direction: "higher_is_better",
    metricUnit: "ratio",
    metricSpaceKey: "win_rate",
    isResourceUsage: false,
    version,
    capability: ["frontend_visual_preference"],
    confidenceStatus: "point_estimate_only",
    normalizationMethod:
      `identity：normalized_metric 直接采用官方 leaderboard API winRate 数值；metric_space 限定为同一 Design Arena Code leaderboard 接口快照（${version}）内的 win_rate 指标空间；` +
      "winRate 是 wins / battles 口径；与 Elo 可能不同排序；当前接口 btStdErr=null 不构造伪 CI",
    note: "winRate 是 wins / battles 的胜率；当前 allcategories 接口 btStdErr 为 null",
  },
  {
    slug: "battles",
    metricName: "battles",
    rowField: "battles",
    direction: "higher_is_better",
    metricUnit: "count",
    metricSpaceKey: "battles",
    isResourceUsage: false,
    version,
    capability: ["frontend_visual_preference"],
    confidenceStatus: "point_estimate_only",
    normalizationMethod:
      `identity：normalized_metric 直接采用官方 leaderboard API battles 数值（head-to-head pairwise 比较数）；` +
      `metric_space 限定为同一 Design Arena Code leaderboard 接口快照（${version}）内的 battles 指标空间；` +
      `battles 是 sample size：方法页声明最小 15 次比较，About 页声明主图 50 次过滤、约 200 次才较可靠——下游须按官方门槛分层比较`,
    note: "battles 是 sample size（pairwise vote 计数）；不同 battles 门槛下的模型不能直接比较",
  },
  {
    slug: "avg_generation_time_ms",
    metricName: "avg_generation_time_ms",
    rowField: "avgGenerationTimeMs",
    direction: "descriptive_only",
    metricUnit: "ms",
    metricSpaceKey: "avg_generation_time_ms",
    isResourceUsage: true,
    version,
    capability: ["benchmark_resource_usage"],
    confidenceStatus: "point_estimate_only",
    normalizationMethod:
      "none：avgGenerationTimeMs 保留官方原值（raw_metric.metric_value）；" +
      "只作 Design Arena 平台特定生成时间参考，不与 Plan 延迟/SLA 口径可比；不做来源内归一化",
    note: "avgGenerationTimeMs 是 Design Arena 平台特定生成时间参考；不得当 Plan 延迟",
  },
];

function buildScoreRecord(
  row: LeaderboardRow,
  spec: ScoreSpec,
  sharedProhibitions: string[],
  ctx: SnapshotContext,
): BenchmarkRecord {
  const raw = row[spec.rowField];
  if (typeof raw !== "number") {
    throw new Error(`${spec.metricName} 缺少数值字段：${row.modelId}`);
  }
  return {
    record_id: `design-arena-code:leaderboard:${row.modelId}:${spec.slug}`,
    capability: spec.capability,
    raw_metric: {
      metric_name: spec.metricName,
      metric_value: raw,
      metric_unit: spec.metricUnit,
      metric_direction: spec.direction,
      numerator_and_denominator: spec.isResourceUsage
        ? {
            value: null,
            status: "not_applicable",
            note: "avgGenerationTimeMs 是平台特定生成时间连续量，不是 head-to-head 计数；不适用 wins/battles 分子分母口径",
            source_ids: [],
          }
        : {
            value: battleCounts(row),
            status: "verified",
            source_ids: [SRC.leaderboard],
          },
      confidence_interval_or_error: {
        value: null,
        status: "unobtainable",
        note: ctx.btStdErrNote,
        source_ids: [],
      },
      note: spec.note,
    },
    normalized_metric:
      spec.isResourceUsage
        ? null
        : {
            value: raw,
            metric_space: `design-arena-code:${ctx.leaderboardCapturedAt}:${spec.metricSpaceKey}`,
          },
    normalization_method: spec.normalizationMethod,
    source_snapshot: sourceSnapshot(
      ctx,
      `leaderboard.json#rows[modelId=${row.modelId}].${spec.rowField}`,
    ),
    subject_identity: subjectIdentity(row),
    conditions: baseConditions(row, ctx),
    confidence_status: spec.confidenceStatus,
    evidence_level: "A",
    comparability_class: "reference_only",
    allowed_use: "explanation",
    prohibited_inferences: spec.isResourceUsage
      ? [
          ...sharedProhibitions,
          "avgGenerationTimeMs 仅作 Design Arena 平台特定生成时间参考，不得当 Plan 延迟/SLA",
        ]
      : [
          ...sharedProhibitions,
          `${spec.metricName} 仅在同快照 + 同类别（${ctx.taskSetDescription}）内可比；不得跨历史快照、跨类别、跨不同 battles 门槛直接比较`,
        ],
  };
}

// ---------------------------------------------------------------------------
// 采集文档装配
// ---------------------------------------------------------------------------

const SOURCE_NOTE_NO_STATED_TIME = "来源页面/接口未显示精确更新时间，以采集时间为准";

export function normalizeFromSnapshots(
  snapshots: BenchmarkSnapshot[],
  collectedAt: string,
  toolVersion: string,
): BenchmarkCollection {
  const byId = new Map(snapshots.map((s) => [s.source_id, s]));
  const leaderboardSnapshot = byId.get(SRC.leaderboard);
  const registrySnapshot = byId.get(SRC.registry);
  const methodologySnapshot = byId.get(SRC.methodology);
  const aboutSnapshot = byId.get(SRC.about);
  const systemPromptsSnapshot = byId.get(SRC.systemPrompts);
  const termsSnapshot = byId.get(SRC.terms);
  const apiDocsSnapshot = byId.get(SRC.apiDocs);
  if (
    !leaderboardSnapshot ||
    !registrySnapshot ||
    !methodologySnapshot ||
    !aboutSnapshot ||
    !systemPromptsSnapshot ||
    !termsSnapshot ||
    !apiDocsSnapshot
  ) {
    throw new Error(
      "Design Arena Code 快照不完整：需要 leaderboard/registry/methodology/about/system-prompts/terms/api-docs",
    );
  }

  const leaderboard = parseLeaderboard(leaderboardSnapshot.body);
  const registry = parseRegistry(registrySnapshot.body);
  const methodology = parseMethodology(methodologySnapshot.body);
  const about = parseAbout(aboutSnapshot.body);
  const systemPrompts = parseSystemPrompts(systemPromptsSnapshot.body);
  const terms = parseTerms(termsSnapshot.body);
  const apiDocs = parseApiDocs(apiDocsSnapshot.body);

  const capturedAt = leaderboardSnapshot.captured_at;
  const taskKinds = leaderboard.scope.task_kinds_in_overall.join("、");
  const taskSetDescription =
    `Design Arena Code leaderboard（${leaderboard.scope.category}）：${taskKinds} 五类单文件 HTML 输出，` +
    `真实用户 prompt 触发，sandboxed iframe 渲染；active sampling 形成 pairwise votes。` +
    `本批快照接口覆盖 ${registry.leaderboard_total_models_with_scores} 个有分数的模型；` +
    `官方 registry 总数 ${registry.registry_total_models} ≠ 榜单覆盖数。` +
    `方法页声明 prompt 字符上限 ${methodology.key_facts.prompt_char_limit_declaration}，` +
    `system prompt bundle 声明 ${systemPrompts.key_facts.prompt_char_limit}——` +
    `不一致差异如实保留。`;
  const ctx: SnapshotContext = {
    capturedAt,
    leaderboardCapturedAt: leaderboard.captured_at,
    leaderboardUrl: leaderboardSnapshot.url,
    taskSetDescription,
    registryTotal: registry.registry_total_models,
    leaderboardCovered: registry.leaderboard_total_models_with_scores,
    minBattlesMethodology: methodology.key_facts.minimum_battles_methodology_page,
    minBattlesAboutMain: about.key_facts.min_battles_for_main_chart,
    minBattlesAboutReliability: about.key_facts.min_battles_for_reliability,
    btStdErrNote: methodology.key_facts.btStdErr_current,
    enhancementModel: systemPrompts.key_facts.optional_enhancement_model,
  };

  const sharedProhibitions = buildSharedProhibitedInferences(registry, methodology, about, terms, apiDocs);

  const records: BenchmarkRecord[] = [];
  const scoreSpecs = SCORE_SPECS_TEMPLATE(leaderboard.captured_at);
  for (const row of leaderboard.rows) {
    for (const spec of scoreSpecs) {
      records.push(buildScoreRecord(row, spec, sharedProhibitions, ctx));
    }
  }

  const sources: BenchmarkSourceRef[] = snapshots.map((snapshot) => {
    const note =
      snapshot.source_id === SRC.leaderboard
        ? `leaderboard 接口 captured_at=${leaderboard.captured_at}；registry 接口 captured_at=${registry.captured_at}`
        : SOURCE_NOTE_NO_STATED_TIME;
    return {
      source_id: snapshot.source_id,
      url: snapshot.url,
      kind: snapshot.kind,
      fetched_at: capturedAt,
      last_updated_at: snapshot.source_id === SRC.leaderboard ? leaderboard.captured_at : null,
      last_updated_note: note,
    };
  });

  return {
    schema_version: "1",
    collection: {
      adapter_id: "design-arena-code",
      mode: "fixture",
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    benchmark: {
      benchmark_id: "design-arena-code",
      benchmark_version: leaderboard.captured_at,
      leaderboard_or_dataset_revision:
        `category=${leaderboard.scope.category}, request=${JSON.stringify(leaderboard.request.body)}, ` +
        `leaderboard_covered=${registry.leaderboard_total_models_with_scores}, registry_total=${registry.registry_total_models}, ` +
        `min_battles_methodology=${methodology.key_facts.minimum_battles_methodology_page}, ` +
        `min_battles_about_main=${about.key_facts.min_battles_for_main_chart}, ` +
        `min_battles_about_reliability=${about.key_facts.min_battles_for_reliability}, ` +
        `active_sampling=true, single_turn_single_file_html=true, no_agent_loop=true, ` +
        `prompt_char_limit_methodology=${methodology.key_facts.prompt_char_limit_declaration}, ` +
        `prompt_char_limit_system_prompts=${systemPrompts.key_facts.prompt_char_limit}, ` +
        `captured_at=${capturedAt}`,
      maintainer: terms.rights_holder,
      source_url: leaderboardSnapshot.url,
      artifact_generated_at: null,
      harness:
        "Design Arena Code：单轮单文件 HTML 生成；sandboxed iframe 渲染；每个投票 session 随机抽取 4 个模型加 1 个 backup（active sampling）；无 agent loop、无 tool calls",
      license_and_access_notes: [
        `维护主体：${terms.rights_holder}`,
        `数据许可表述（API 文档）：${apiDocs.key_facts.attribution_requirement}；正式 API 需要 API key（${apiDocs.key_facts.auth}）；rate limits 未公开（rate_limits_published=${apiDocs.key_facts.rate_limits_published}）`,
        `条款许可表述：${terms.data_license_terms}`,
        `条款禁止：${terms.prohibitions.join("；")}`,
        `适用范围张力：${apiDocs.key_facts.use_scope_tension}`,
        `官方不保证：${terms.no_warranty}`,
        `官方建议：${terms.use_recommendation}`,
        "本 fixture 为官方接口与方法页的结构化快照（不含页面 HTML 全文）；如需批量自动化访问，需取得 Design Arena 明确许可并签署授权（授权申请为待办）",
        "本批数据仅作内部研究证据（reference_only / explanation）；不主张外部再分发权或商业使用许可",
        `comparability_scope：仅在同快照 + 同类别（${leaderboard.scope.category}）+ 同 active sampling 条件下可比；不得跨历史快照、跨单独 Website/UI/Game 等类别、跨不同 battles 门槛比较`,
      ],
    },
    task_set: {
      // Design Arena Code 不是固定题集；prompt 来自真实用户
      description:
        `Design Arena Code（${leaderboard.scope.category}）：${taskKinds} 五类单文件 HTML 输出，` +
        `真实用户 prompt 触发，非固定公开题库；可选 prompt enhancement 使用 ${systemPrompts.key_facts.optional_enhancement_model}。` +
        `本批快照接口覆盖 ${registry.leaderboard_total_models_with_scores} 个有分数的模型；官方 registry 总数 ${registry.registry_total_models} ≠ 榜单覆盖数。` +
        `没有 n_tasks 概念——记录接口覆盖数与 battles 计数口径。`,
      n_tasks: 0,
      n_repositories: 0,
      languages: [],
    },
    records,
    sources,
    unresolved_facts: [
      {
        fact: "官方 registry 总数（496）≠ leaderboard 覆盖数（164）——registry vs leaderboard 是不同口径；不能把 registry 总数当榜单覆盖数",
        reason: "官方接口返回两个独立口径；页面无统一覆盖数披露",
        how_to_resolve: "下游使用应分别声明 registry 与 leaderboard 覆盖数；不得用 registry 总数反推榜单覆盖数",
      },
      {
        fact: "当前 leaderboard 接口（allcategories）btStdErr=null——官方未给出 wins/losses/battles/elo/winRate 的逐行误差范围",
        reason: "API 当前返回 btStdErr 为 null；不构造伪 CI",
        how_to_resolve: "等待官方公布逐行误差范围；不得用其他来源误差反推",
      },
      {
        fact: "battles 门槛在方法页（最小 15 次比较）与 About 页（主图 50 次过滤、约 200 次才较可靠）声明不一致",
        reason: "官方两页声明门槛不同；本批如实记录差异，不强行归一化",
        how_to_resolve: "下游比较时按官方门槛分层（methodology_15 / about_main_50 / about_reliability_200），不跨门槛直接比较",
      },
      {
        fact: "prompt 字符上限在方法页（< 5,000 chars）与 system prompt bundle（10,000 chars）声明不一致——限制可能已变化",
        reason: "官方两页声明上限不同；本批如实记录差异",
        how_to_resolve: "等待官方明确当前限制；不得自行假设统一上限",
      },
      {
        fact: "官方不公开 cost/price/vendor/reasoning effort/model snapshot/model API id 与完整 system prompt bundle",
        reason: "API 字段为 modelId/wins/losses/battles/winRate/elo/btStdErr/avgGenerationTimeMs；vendor 不在公开字段内",
        how_to_resolve: "不得以 modelId 反推 vendor/API ID；如需建立模型→Coding Plan 映射，需先取得官方模型清单与对应 API",
      },
      {
        fact: "API 文档允许商业使用（要求署名+链接）+ Terms 限制爬虫/复制/商业用途——适用范围张力未由官方统一结论",
        reason: "官方两份文件表述不同",
        how_to_resolve: "取得 Design Arena 明确书面许可前不做商业产品集成；fixture 仅作内部研究证据（reference_only / explanation）",
      },
      {
        fact: "active sampling 使模型曝光与对手结构不必均匀——同一 leaderboard 内的相对排名受采样策略影响，历史快照不能直接比较",
        reason: "About 页原文声明 active sampling；Elo 是相对位置",
        how_to_resolve: "只比较同快照内的相对表现并查看 battles 门槛与采样窗口；跨日比较需重新采集并对齐 active sampling 窗口",
      },
      {
        fact: "Overall Frontend 与单独 Website/UI Component/Game Development/Data Visualization/3D Design 不可直接等价——本批只导入 Overall (allcategories)",
        reason: "细分任务域不在本批快照导入范围；用户视觉偏好因任务类型显著不同",
        how_to_resolve: "如需细分任务域结果，应取得 Design Arena 明确许可并分别采集对应类别接口",
      },
    ],
  };
}
