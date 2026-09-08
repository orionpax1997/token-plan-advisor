/**
 * Artificial Analysis Intelligence 官方页面转写快照的纯解析层：JSON → 类型化结构。
 * 只做形状守卫与逐字段透传（verbatim-first），不解释、不补齐、不猜测。
 *
 * fixture 性质说明：AA 网站 ToS 禁止抓取/复制页面内容，转写 JSON 是官方页面事实的
 * 结构化快照（非页面原文），字段名是本批采集口径，数值与文案保留官方原表述。
 */

/** 主页 Intelligence 区块转写。 */
export interface HomepageSnapshot {
  intelligence_index_version_display: string;
  component_evals_listed: string[];
  intelligence_chart_coverage: { display: string; shown: number; of_total: number };
  frontier_creators_chart_coverage: { display: string; shown: number; of_total: number };
  activity_stream: {
    methodology_updated: string;
    year_shown: boolean;
    unified_data_updated_at: string | null;
  };
}

export function parseHomepage(body: string): HomepageSnapshot {
  const parsed = JSON.parse(body) as Partial<HomepageSnapshot>;
  if (
    typeof parsed.intelligence_index_version_display !== "string" ||
    !Array.isArray(parsed.component_evals_listed) ||
    typeof parsed.intelligence_chart_coverage?.shown !== "number" ||
    typeof parsed.intelligence_chart_coverage?.of_total !== "number" ||
    typeof parsed.frontier_creators_chart_coverage?.shown !== "number" ||
    typeof parsed.frontier_creators_chart_coverage?.of_total !== "number" ||
    typeof parsed.activity_stream?.methodology_updated !== "string" ||
    typeof parsed.activity_stream?.year_shown !== "boolean"
  ) {
    throw new Error(
      "homepage 转写形状不符合预期（version_display/component_evals/coverage/activity_stream）",
    );
  }
  return parsed as HomepageSnapshot;
}

/** 方法页权重表单行（官方 v4.1.1 组成，逐字段转写）。 */
export interface MethodologyEvalRow {
  eval_name: string;
  category: string;
  category_weight_percent: number;
  index_weight_percent: number;
  n_tasks: number;
  n_tasks_description: string;
  repeats: number;
  response_and_tools: string;
  scoring_method: string;
  harness_or_environment: string;
  judge_or_grader: string;
  /** 仅部分评测有显式上下文要求（如 AA-LCR 的 128K context window）。 */
  context_requirements?: string;
  /** 仅部分评测在方法页公开专门 prompt/背景注入（如 GDPval 参考文件、SciCode 科学家标注背景）。 */
  prompt_or_context_notes?: string;
  /** 仅 AA-Omniscience：Index 权重由 Accuracy 与非幻觉率两个成分组成。 */
  index_weight_breakdown?: string;
}

export interface MethodologySnapshot {
  index_version: string;
  category_weights_percent: Record<string, number> & { sum_check: number };
  evals: MethodologyEvalRow[];
  gdpval_normalization_published: string;
  token_counting: string;
  no_unified_normalization_formula_published: boolean;
}

export function parseMethodology(body: string): MethodologySnapshot {
  const parsed = JSON.parse(body) as Partial<MethodologySnapshot>;
  if (
    typeof parsed.index_version !== "string" ||
    typeof parsed.category_weights_percent?.sum_check !== "number" ||
    !Array.isArray(parsed.evals) ||
    parsed.evals.length === 0 ||
    typeof parsed.token_counting !== "string" ||
    typeof parsed.no_unified_normalization_formula_published !== "boolean"
  ) {
    throw new Error("methodology 转写形状不符合预期（index_version/category_weights/evals）");
  }
  for (const row of parsed.evals) {
    if (
      typeof row.eval_name !== "string" ||
      typeof row.category !== "string" ||
      typeof row.index_weight_percent !== "number" ||
      typeof row.n_tasks !== "number" ||
      typeof row.repeats !== "number" ||
      typeof row.scoring_method !== "string" ||
      typeof row.harness_or_environment !== "string" ||
      typeof row.judge_or_grader !== "string"
    ) {
      throw new Error(`methodology 权重表行缺少必需字段：${row.eval_name ?? "(unknown)"}`);
    }
  }
  return parsed as MethodologySnapshot;
}

/** 方法总览页转写（cost per task 口径、模态范围等 Index 级定位事实）。 */
export interface MethodologyLandingSnapshot {
  index_definition: string;
  cost_per_task_definition: string;
  modality_scope: string;
}

export function parseMethodologyLanding(body: string): MethodologyLandingSnapshot {
  const parsed = JSON.parse(body) as Partial<MethodologyLandingSnapshot>;
  if (
    typeof parsed.index_definition !== "string" ||
    typeof parsed.cost_per_task_definition !== "string" ||
    typeof parsed.modality_scope !== "string"
  ) {
    throw new Error("methodology-landing 转写形状不符合预期（definition/cost_per_task/modality）");
  }
  return parsed as MethodologyLandingSnapshot;
}

/** 指数详情页转写。 */
export interface IndexDetailSnapshot {
  intelligence_index_version_display: string;
  intelligence_index_coverage: { display: string; shown: number; of_total: number };
}

export function parseIndexDetail(body: string): IndexDetailSnapshot {
  const parsed = JSON.parse(body) as Partial<IndexDetailSnapshot>;
  if (
    typeof parsed.intelligence_index_version_display !== "string" ||
    typeof parsed.intelligence_index_coverage?.shown !== "number" ||
    typeof parsed.intelligence_index_coverage?.of_total !== "number"
  ) {
    throw new Error("index-detail 转写形状不符合预期（version_display/coverage）");
  }
  return parsed as IndexDetailSnapshot;
}

/** Data API 文档转写（版本字段口径、tier 与限流、模型条目字段）。 */
export interface ApiDocsSnapshot {
  base_url: string;
  auth: string;
  intelligence_index_version_field: {
    field_name: string;
    format: string;
    example_value: string;
    patch_note: string;
  };
  tiers: { tier: string; data_scope: string; rate_limit_per_24h: number | null }[];
  attribution: string;
  model_entry_fields: string[];
}

export function parseApiDocs(body: string): ApiDocsSnapshot {
  const parsed = JSON.parse(body) as Partial<ApiDocsSnapshot>;
  const versionField = parsed.intelligence_index_version_field;
  if (
    typeof parsed.base_url !== "string" ||
    typeof versionField?.example_value !== "string" ||
    typeof versionField?.format !== "string" ||
    !Array.isArray(parsed.tiers) ||
    parsed.tiers.length === 0 ||
    typeof parsed.attribution !== "string" ||
    !Array.isArray(parsed.model_entry_fields)
  ) {
    throw new Error("data-api-docs 转写形状不符合预期（base_url/version_field/tiers/attribution）");
  }
  return parsed as ApiDocsSnapshot;
}

/** Terms of Use 转写。 */
export interface TermsSnapshot {
  rights_holder: string;
  license_grant: string;
  prohibitions: string[];
  api_redistribution: string;
}

export function parseTerms(body: string): TermsSnapshot {
  const parsed = JSON.parse(body) as Partial<TermsSnapshot>;
  if (
    typeof parsed.rights_holder !== "string" ||
    typeof parsed.license_grant !== "string" ||
    !Array.isArray(parsed.prohibitions) ||
    parsed.prohibitions.length === 0 ||
    typeof parsed.api_redistribution !== "string"
  ) {
    throw new Error("terms 转写形状不符合预期（rights_holder/license_grant/prohibitions）");
  }
  return parsed as TermsSnapshot;
}
