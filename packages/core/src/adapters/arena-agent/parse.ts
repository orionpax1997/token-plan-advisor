/**
 * Arena Agent 官方页面转写快照的纯解析层：JSON → 类型化结构。
 * 只做形状守卫与逐字段透传（verbatim-first），不解释、不补齐、不猜测。
 *
 * fixture 性质说明：Arena 服务条款禁止程序化或自动化抓取/提取/下载网页数据，
 * 未发现 Agent leaderboard 聚合数据的独立开放许可证；转写 JSON 是官方页面公开
 * 字段的结构化快照（非页面原文），字段名是本批采集口径，数值与文案保留官方原表述。
 */

/** Arena Agent leaderboard 页面公开字段的转写行。 */
export interface LeaderboardRow {
  rank: number;
  model: string;
  vendor: string;
  sessions: number;
  share_of_sessions: number;
  net_improvement: number;
  net_improvement_ci_lo: number;
  net_improvement_ci_hi: number;
  confirmed_success: number;
  praise_vs_complaint: number;
  steerability: number;
  /** lower_is_better：bash 失败后成功恢复行为的累计发生率——重试少好 */
  bash_recovery: number;
  /** lower_is_better：调用不存在工具或泄漏无效内容的累计发生率——发生率低好 */
  tool_hallucination: number;
  /** 资源字段：真实任务工作流的 P50 统计 */
  p50_cost_per_task_usd: number;
  p50_output_tokens_per_task: number;
  price_per_million_input_usd: number;
  price_per_million_output_usd: number;
}

export interface LeaderboardSnapshot {
  page: string;
  url: string;
  page_meta: {
    page_updated_display: string;
    captured_at: string;
    total_sessions_display: string;
    total_sessions_value: number;
    total_models_display: string;
    total_models_value: number;
  };
  scope: {
    evaluation_target: string;
    task_kinds_observed: string[];
    tool_access_in_agent_mode: string[];
    no_fixed_prompt: boolean;
    no_fixed_task_set: boolean;
    no_published_repeat_or_seed: boolean;
    routing: string;
    session_structure: string;
  };
  signals_definition: {
    name: string;
    display?: string;
    definition: string;
    ci?: string;
    direction: "higher_is_better" | "lower_is_better";
    note?: string;
    role?: string;
  }[];
  rows: LeaderboardRow[];
}

export function parseLeaderboard(body: string): LeaderboardSnapshot {
  const parsed = JSON.parse(body) as Partial<LeaderboardSnapshot>;
  if (
    typeof parsed.page !== "string" ||
    typeof parsed.url !== "string" ||
    typeof parsed.page_meta?.page_updated_display !== "string" ||
    typeof parsed.page_meta?.captured_at !== "string" ||
    typeof parsed.page_meta?.total_sessions_value !== "number" ||
    typeof parsed.page_meta?.total_models_value !== "number" ||
    typeof parsed.scope?.evaluation_target !== "string" ||
    !Array.isArray(parsed.signals_definition) ||
    parsed.signals_definition.length === 0 ||
    !Array.isArray(parsed.rows) ||
    parsed.rows.length === 0
  ) {
    throw new Error("Arena Agent leaderboard 转写形状不符合预期（page_meta/scope/signals_definition/rows）");
  }
  for (const row of parsed.rows) {
    if (
      typeof row.rank !== "number" ||
      typeof row.model !== "string" ||
      typeof row.vendor !== "string" ||
      typeof row.net_improvement !== "number" ||
      typeof row.confirmed_success !== "number" ||
      typeof row.praise_vs_complaint !== "number" ||
      typeof row.steerability !== "number" ||
      typeof row.bash_recovery !== "number" ||
      typeof row.tool_hallucination !== "number"
    ) {
      throw new Error(`Arena Agent leaderboard 行缺少必需字段：${row.model ?? "(unknown)"}`);
    }
  }
  return parsed as LeaderboardSnapshot;
}

export interface MethodologySnapshot {
  page: string;
  url: string;
  key_facts: {
    evaluation_target: string;
    production_setting: string;
    routing_method: string;
    session_definition: string;
    headline_signal_definition: string;
    headline_signal_aggregation: string;
    ci_method: string;
    cost_token_definition: string;
    no_fixed_inputs: string[];
  };
  scope_limits: string;
}

export function parseMethodology(body: string): MethodologySnapshot {
  const parsed = JSON.parse(body) as Partial<MethodologySnapshot>;
  if (
    typeof parsed.page !== "string" ||
    typeof parsed.url !== "string" ||
    typeof parsed.key_facts?.evaluation_target !== "string" ||
    typeof parsed.key_facts?.headline_signal_definition !== "string" ||
    !Array.isArray(parsed.key_facts?.no_fixed_inputs)
  ) {
    throw new Error("Arena Agent methodology 转写形状不符合预期（key_facts/no_fixed_inputs）");
  }
  return parsed as MethodologySnapshot;
}

export interface AgentModeHelpSnapshot {
  page: string;
  url: string;
  key_facts: {
    task_kinds_observed: string[];
    tool_access_in_agent_mode: string[];
  };
  scope_limits: string;
}

export function parseAgentModeHelp(body: string): AgentModeHelpSnapshot {
  const parsed = JSON.parse(body) as Partial<AgentModeHelpSnapshot>;
  if (
    typeof parsed.page !== "string" ||
    !Array.isArray(parsed.key_facts?.task_kinds_observed) ||
    !Array.isArray(parsed.key_facts?.tool_access_in_agent_mode)
  ) {
    throw new Error("Arena Agent Agent Mode help 转写形状不符合预期（task_kinds/tool_access）");
  }
  return parsed as AgentModeHelpSnapshot;
}

export interface CategoriesCostSnapshot {
  page: string;
  url: string;
  key_facts: {
    category_definition: string;
    cost_metric_definition: string;
    pricing_data_field: string;
  };
  scope_limits: string;
}

export function parseCategoriesCost(body: string): CategoriesCostSnapshot {
  const parsed = JSON.parse(body) as Partial<CategoriesCostSnapshot>;
  if (
    typeof parsed.page !== "string" ||
    typeof parsed.key_facts?.category_definition !== "string" ||
    typeof parsed.key_facts?.cost_metric_definition !== "string"
  ) {
    throw new Error("Arena Agent categories & cost 转写形状不符合预期（key_facts）");
  }
  return parsed as CategoriesCostSnapshot;
}

export interface TermsSnapshot {
  page: string;
  url: string;
  rights_holder: string;
  license_grant: string;
  prohibitions: string[];
  data_origin: string;
  robots_txt: string;
}

export function parseTerms(body: string): TermsSnapshot {
  const parsed = JSON.parse(body) as Partial<TermsSnapshot>;
  if (
    typeof parsed.page !== "string" ||
    typeof parsed.rights_holder !== "string" ||
    typeof parsed.license_grant !== "string" ||
    !Array.isArray(parsed.prohibitions) ||
    parsed.prohibitions.length === 0
  ) {
    throw new Error("Arena Agent terms 转写形状不符合预期（rights_holder/license_grant/prohibitions）");
  }
  return parsed as TermsSnapshot;
}

export interface PrivacySnapshot {
  page: string;
  url: string;
  key_facts: {
    data_source: string;
    anonymization: string;
    real_user_data_risk: string;
  };
}

export function parsePrivacy(body: string): PrivacySnapshot {
  const parsed = JSON.parse(body) as Partial<PrivacySnapshot>;
  if (
    typeof parsed.page !== "string" ||
    typeof parsed.key_facts?.data_source !== "string" ||
    typeof parsed.key_facts?.anonymization !== "string"
  ) {
    throw new Error("Arena Agent privacy 转写形状不符合预期（key_facts）");
  }
  return parsed as PrivacySnapshot;
}
