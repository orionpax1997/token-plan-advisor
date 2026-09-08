/**
 * DeepSWE 官方 artifact 的纯解析层：JSON → 类型化结构。
 * 只做形状守卫与逐字段透传（verbatim-first），不解释、不补齐、不猜测。
 */

/** leaderboard-live.json 单行（官方字段名的子集：本批消费的字段）。 */
export interface LeaderboardRow {
  model: string;
  harness: string;
  /** 官方 provider 字段：大量配置缺失或为空（research/15-01）；缺失即 undefined。 */
  provider?: string | null;
  /** reasoning effort；官方 default 配置此字段为 null。 */
  reasoning_effort: string | null;
  config: string;
  source: string;
  pass_at_1: number;
  pass_at_4: number;
  n_passed: number;
  n_attempted: number;
  n_tasks_attempted: number;
  n_tasks_passed_any: number;
  ci_lo: number;
  ci_hi: number;
  ci_half: number;
  ci_method: string;
  n_runs: number;
  /** 官方价格口径说明；仅部分配置给出。 */
  cost_basis?: string;
  /** 资源聚合字段（cost/token/steps/duration），部分字段可能缺失或为 null。 */
  [aggregate: string]: unknown;
}

export interface LeaderboardArtifact {
  scope: string;
  unit: string;
  generated_at: string;
  n_tasks_in_set: number;
  rows: LeaderboardRow[];
}

export function parseLeaderboard(body: string): LeaderboardArtifact {
  const parsed = JSON.parse(body) as Partial<LeaderboardArtifact>;
  if (
    typeof parsed.scope !== "string" ||
    typeof parsed.unit !== "string" ||
    typeof parsed.generated_at !== "string" ||
    typeof parsed.n_tasks_in_set !== "number" ||
    !Array.isArray(parsed.rows)
  ) {
    throw new Error("leaderboard artifact 形状不符合预期（scope/unit/generated_at/n_tasks_in_set/rows）");
  }
  return parsed as LeaderboardArtifact;
}

export interface TaskRow {
  id: string;
  language: string;
  repository: string;
}

export interface TaskSetArtifact {
  scope: string;
  nTasks: number;
  rows: TaskRow[];
  /** 语言 → 任务数（保持 artifact 首现顺序）。 */
  languageCounts: { language: string; n_tasks: number }[];
  nRepositories: number;
}

export function parseTasks(body: string): TaskSetArtifact {
  const parsed = JSON.parse(body) as { scope?: unknown; n_tasks?: unknown; rows?: unknown };
  if (
    typeof parsed.scope !== "string" ||
    typeof parsed.n_tasks !== "number" ||
    !Array.isArray(parsed.rows)
  ) {
    throw new Error("tasks artifact 形状不符合预期（scope/n_tasks/rows）");
  }
  const rows: TaskRow[] = [];
  for (const raw of parsed.rows) {
    const r = raw as Partial<TaskRow>;
    if (typeof r.id !== "string" || typeof r.language !== "string" || typeof r.repository !== "string") {
      throw new Error("tasks artifact 行缺少 id/language/repository 字段");
    }
    rows.push({ id: r.id, language: r.language, repository: r.repository });
  }
  // 语言分布：按 artifact 首现顺序计数；仓库数为去重计数
  const counts = new Map<string, number>();
  const repos = new Set<string>();
  for (const row of rows) {
    counts.set(row.language, (counts.get(row.language) ?? 0) + 1);
    repos.add(row.repository);
  }
  return {
    scope: parsed.scope,
    nTasks: parsed.n_tasks,
    rows,
    languageCounts: [...counts.entries()].map(([language, n_tasks]) => ({ language, n_tasks })),
    nRepositories: repos.size,
  };
}

/** release.json：release 标识与 artifact 寻址信息。 */
export interface ReleaseArtifact {
  release_id: string;
  artifact_base_url: string;
  artifact_key_prefix: string;
}

export function parseRelease(body: string): ReleaseArtifact {
  const parsed = JSON.parse(body) as Partial<ReleaseArtifact>;
  if (typeof parsed.release_id !== "string" || typeof parsed.artifact_base_url !== "string") {
    throw new Error("release artifact 形状不符合预期（release_id/artifact_base_url）");
  }
  return parsed as ReleaseArtifact;
}
