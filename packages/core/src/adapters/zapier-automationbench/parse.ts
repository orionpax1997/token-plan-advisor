/**
 * Zapier AutomationBench 1.0.6 官方 artifact 的纯解析层：JSON → 类型化结构。
 * 只做形状守卫与逐字段透传（verbatim-first），不解释、不补齐、不猜测。
 *
 * 重要：私有 held-out leaderboard 与公开 600-task 仓库是两个不同的数据集标识，
 * 本层只解析、不合并、不换算。
 */

export interface PageMeta {
  captured_at: string;
  published_time_utc: string;
  last_modified_utc: string;
  benchmark_version: string;
}

export function parsePageMeta(body: string): PageMeta {
  const parsed = JSON.parse(body) as Partial<PageMeta>;
  if (
    typeof parsed.captured_at !== "string" ||
    typeof parsed.published_time_utc !== "string" ||
    typeof parsed.last_modified_utc !== "string" ||
    typeof parsed.benchmark_version !== "string"
  ) {
    throw new Error("zapier 页面元数据形状不符合预期（captured_at/published_time_utc/last_modified_utc/benchmark_version）");
  }
  return parsed as PageMeta;
}

export interface PrivateLeaderboardRow {
  rank: number;
  /** 页面显示的模型/配置展示名（含 effort 标签）。 */
  display_name: string;
  vendor: string;
  model: string;
  effort: string;
  /** 严格 headline 指标：所有 scored assertions 都通过的比例。 */
  score: number;
  /** 页面 Cost / task（USD）；第 5 名（fallback combo）成本仅含主模型部分。 */
  cost_per_task_usd: number;
  /** Fable 5.1 + Opus 5 fallback 组合：cost 列排除了 fallback tokens。 */
  is_fallback_combo: boolean;
  /** Gemini 促销价说明（非榜单 cost 列）。 */
  promotional_pricing_note?: string;
  /** Fallback 详情（仅 is_fallback_combo=true 的行携带）。 */
  fallback_note?: string;
}

export interface PrivateLeaderboardArtifact {
  benchmark_version: string;
  captured_at: string;
  headline_metric: string;
  diagnostic_metric: string;
  task_set_kind: "private_held_out";
  task_set_description: string;
  toolset: string;
  max_steps: number;
  rows: PrivateLeaderboardRow[];
  additional_rows_note: string;
}

export function parsePrivateLeaderboard(body: string): PrivateLeaderboardArtifact {
  const parsed = JSON.parse(body) as Partial<PrivateLeaderboardArtifact>;
  if (
    typeof parsed.benchmark_version !== "string" ||
    typeof parsed.captured_at !== "string" ||
    parsed.headline_metric !== "task_completed_correctly" ||
    parsed.diagnostic_metric !== "partial_credit" ||
    parsed.task_set_kind !== "private_held_out" ||
    typeof parsed.task_set_description !== "string" ||
    typeof parsed.toolset !== "string" ||
    typeof parsed.max_steps !== "number" ||
    !Array.isArray(parsed.rows)
  ) {
    throw new Error(
      "zapier 私有 leaderboard artifact 形状不符合预期（benchmark_version/captured_at/headline_metric/diagnostic_metric/task_set_kind/task_set_description/toolset/max_steps/rows）",
    );
  }
  return parsed as PrivateLeaderboardArtifact;
}

export interface PublicTaskDomain {
  name: string;
  n_tasks: number;
  topics: string[];
}

export interface PublicTasksArtifact {
  benchmark_version: string;
  task_set_kind: "public";
  captured_at: string;
  total_tasks: number;
  domain_count: number;
  domains: PublicTaskDomain[];
  simulated_apps: number;
  api_endpoints: number;
  toolset_modes: string[];
  default_max_steps: number;
  simple_domain_note: string;
}

export function parsePublicTasks(body: string): PublicTasksArtifact {
  const parsed = JSON.parse(body) as Partial<PublicTasksArtifact>;
  if (
    typeof parsed.benchmark_version !== "string" ||
    parsed.task_set_kind !== "public" ||
    typeof parsed.total_tasks !== "number" ||
    typeof parsed.domain_count !== "number" ||
    !Array.isArray(parsed.domains) ||
    !Array.isArray(parsed.toolset_modes) ||
    typeof parsed.default_max_steps !== "number"
  ) {
    throw new Error("zapier 公开任务 artifact 形状不符合预期");
  }
  return parsed as PublicTasksArtifact;
}

export interface PublicBaselineRow {
  display_name: string;
  vendor: string;
  model: string;
}

export interface PublicBaselinesArtifact {
  benchmark_version: string;
  task_set_kind: "public";
  captured_at: string;
  note: string;
  rows: PublicBaselineRow[];
  baseline_scores_note: string;
}

export function parsePublicBaselines(body: string): PublicBaselinesArtifact {
  const parsed = JSON.parse(body) as Partial<PublicBaselinesArtifact>;
  if (
    typeof parsed.benchmark_version !== "string" ||
    parsed.task_set_kind !== "public" ||
    typeof parsed.captured_at !== "string" ||
    !Array.isArray(parsed.rows)
  ) {
    throw new Error("zapier 公开基线 artifact 形状不符合预期");
  }
  return parsed as PublicBaselinesArtifact;
}
