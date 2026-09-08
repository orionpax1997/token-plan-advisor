/**
 * Design Arena Code 官方接口/方法页转写快照的纯解析层：JSON → 类型化结构。
 * 只做形状守卫与逐字段透传（verbatim-first），不解释、不补齐、不猜测。
 *
 * fixture 性质说明：API 文档允许商业使用（要求署名+链接），Terms 又限制爬虫与
 * 商业用途——存在适用范围张力；转写 JSON 是官方接口响应与方法页的结构化快照
 * （非页面原文），字段名保留官方 API 原表述。
 */

/** Design Arena leaderboard 单行（官方 API 字段名原样）。 */
export interface LeaderboardRow {
  modelId: string;
  wins: number;
  losses: number;
  battles: number;
  winRate: number;
  elo: number;
  btStdErr: number | null;
  avgGenerationTimeMs: number;
}

export interface LeaderboardSnapshot {
  page: string;
  url: string;
  captured_at: string;
  request: { endpoint: string; method: string; body: Record<string, unknown> };
  scope: {
    category: string;
    evaluation_target: string;
    task_kinds_in_overall: string[];
    single_turn_single_file_html: boolean;
    no_agent_loop: boolean;
    no_tool_calls: boolean;
    no_follow_ups: boolean;
    rendering_environment: string;
    voting_mechanism: string;
    system_prompt_char_limit_methodology_note: string;
    system_prompt_char_limit_system_prompt_note: string;
    system_prompt_limit_conflict_note: string;
  };
  rows: LeaderboardRow[];
}

export function parseLeaderboard(body: string): LeaderboardSnapshot {
  const parsed = JSON.parse(body) as Partial<LeaderboardSnapshot>;
  if (
    typeof parsed.page !== "string" ||
    typeof parsed.url !== "string" ||
    typeof parsed.captured_at !== "string" ||
    !Array.isArray(parsed.rows) ||
    parsed.rows.length === 0
  ) {
    throw new Error("Design Arena Code leaderboard 转写形状不符合预期（page/captured_at/rows）");
  }
  for (const row of parsed.rows) {
    if (
      typeof row.modelId !== "string" ||
      typeof row.wins !== "number" ||
      typeof row.losses !== "number" ||
      typeof row.battles !== "number" ||
      typeof row.winRate !== "number" ||
      typeof row.elo !== "number"
    ) {
      throw new Error(`Design Arena Code leaderboard 行缺少必需字段：${row.modelId ?? "(unknown)"}`);
    }
  }
  return parsed as LeaderboardSnapshot;
}

export interface RegistrySnapshot {
  page: string;
  url: string;
  captured_at: string;
  registry_total_models: number;
  leaderboard_total_models_with_scores: number;
  registry_vs_leaderboard_note: string;
}

export function parseRegistry(body: string): RegistrySnapshot {
  const parsed = JSON.parse(body) as Partial<RegistrySnapshot>;
  if (
    typeof parsed.registry_total_models !== "number" ||
    typeof parsed.leaderboard_total_models_with_scores !== "number"
  ) {
    throw new Error("Design Arena registry 转写形状不符合预期（registry_total_models/leaderboard_total_models_with_scores）");
  }
  return parsed as RegistrySnapshot;
}

export interface MethodologySnapshot {
  page: string;
  url: string;
  key_facts: {
    category_definition: string;
    voting_mechanism: string;
    prompt_char_limit_declaration: string;
    minimum_battles_methodology_page: number;
    minimum_battles_about_page: string;
    battle_threshold_conflict_note: string;
    btStdErr_current: string;
  };
  scope_limits: string;
}

export function parseMethodology(body: string): MethodologySnapshot {
  const parsed = JSON.parse(body) as Partial<MethodologySnapshot>;
  if (
    typeof parsed.key_facts?.category_definition !== "string" ||
    typeof parsed.key_facts?.voting_mechanism !== "string" ||
    typeof parsed.key_facts?.minimum_battles_methodology_page !== "number"
  ) {
    throw new Error("Design Arena methodology 转写形状不符合预期（key_facts/minimum_battles_methodology_page）");
  }
  return parsed as MethodologySnapshot;
}

export interface AboutSnapshot {
  page: string;
  url: string;
  key_facts: {
    evaluation_target: string;
    voting_session_composition: string;
    active_sampling: string;
    min_battles_for_main_chart: number;
    min_battles_for_reliability: number;
    supported_libraries: string;
    rendering_viewport: string;
  };
}

export function parseAbout(body: string): AboutSnapshot {
  const parsed = JSON.parse(body) as Partial<AboutSnapshot>;
  if (
    typeof parsed.key_facts?.evaluation_target !== "string" ||
    typeof parsed.key_facts?.voting_session_composition !== "string" ||
    typeof parsed.key_facts?.min_battles_for_main_chart !== "number"
  ) {
    throw new Error("Design Arena about 转写形状不符合预期（key_facts）");
  }
  return parsed as AboutSnapshot;
}

export interface SystemPromptsSnapshot {
  page: string;
  url: string;
  key_facts: {
    prompt_char_limit: string;
    optional_enhancement_model: string;
    enhancement_note: string;
  };
}

export function parseSystemPrompts(body: string): SystemPromptsSnapshot {
  const parsed = JSON.parse(body) as Partial<SystemPromptsSnapshot>;
  if (
    typeof parsed.key_facts?.prompt_char_limit !== "string" ||
    typeof parsed.key_facts?.optional_enhancement_model !== "string"
  ) {
    throw new Error("Design Arena system-prompts 转写形状不符合预期（key_facts）");
  }
  return parsed as SystemPromptsSnapshot;
}

export interface TermsSnapshot {
  page: string;
  url: string;
  rights_holder: string;
  data_license_terms: string;
  prohibitions: string[];
  no_warranty: string;
  use_recommendation: string;
}

export function parseTerms(body: string): TermsSnapshot {
  const parsed = JSON.parse(body) as Partial<TermsSnapshot>;
  if (
    typeof parsed.rights_holder !== "string" ||
    typeof parsed.data_license_terms !== "string" ||
    !Array.isArray(parsed.prohibitions) ||
    parsed.prohibitions.length === 0
  ) {
    throw new Error("Design Arena terms 转写形状不符合预期（rights_holder/data_license_terms/prohibitions）");
  }
  return parsed as TermsSnapshot;
}

export interface ApiDocsSnapshot {
  page: string;
  url: string;
  key_facts: {
    endpoints: { leaderboard: string; registry: string };
    auth: string;
    rate_limits_published: boolean;
    attribution_requirement: string;
    response_fields: string[];
    use_scope_tension: string;
  };
}

export function parseApiDocs(body: string): ApiDocsSnapshot {
  const parsed = JSON.parse(body) as Partial<ApiDocsSnapshot>;
  if (
    typeof parsed.key_facts?.auth !== "string" ||
    typeof parsed.key_facts?.attribution_requirement !== "string" ||
    !Array.isArray(parsed.key_facts?.response_fields)
  ) {
    throw new Error("Design Arena api-docs 转写形状不符合预期（key_facts/auth/response_fields）");
  }
  return parsed as ApiDocsSnapshot;
}
