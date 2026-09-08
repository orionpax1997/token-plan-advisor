/**
 * Terminal-Bench 4.0 官方 artifact 的纯解析层：JSON → 类型化结构。
 * 只做形状守卫与逐字段透传（verbatim-first），不解释、不补齐、不猜测。
 */

/** leaderboard.json 单行（Hub 页面直接显示的字段子集：本批消费的字段）。 */
export interface LeaderboardRow {
  rank: number;
  agent: string;
  model: string;
  effort: string;
  /** 0–1 数值；页面以百分比字符串显示（如 "58.2%"）。 */
  accuracy: number;
  /** 95% CI 半宽（页面 ± 字段名）；官方未公开计算公式。 */
  accuracy_ci95_half_width: number;
  display_accuracy: string;
  release_date: string;
  agent_org: string;
  model_org: string;
  /** 页面 Tokens 列：精确数（页面以 "1.5B" 等格式显示，本批保留精确数）。 */
  tokens: number;
  /** 页面 Cost 列（USD）；页面脚注可能说明语义（如排除 fallback tokens）。 */
  cost: number;
}

export interface LeaderboardArtifact {
  dataset: string;
  /** 数据集版本（页面对应 `terminal-bench/terminal-bench@4`）。 */
  dataset_version: string;
  /** 排行榜 revision（页面对应 `4-0-0`）。 */
  leaderboard: string;
  title: string;
  /** 研究采集时点（页面快照时间）。 */
  captured_at: string;
  hub_metadata: {
    created_at: string;
    updated_at: string;
    leaderboard_4_0_0_release_date: string;
  };
  n_tasks_in_set: number;
  rows: LeaderboardRow[];
}

export function parseLeaderboard(body: string): LeaderboardArtifact {
  const parsed = JSON.parse(body) as Partial<LeaderboardArtifact>;
  if (
    typeof parsed.dataset !== "string" ||
    typeof parsed.dataset_version !== "string" ||
    typeof parsed.leaderboard !== "string" ||
    typeof parsed.title !== "string" ||
    typeof parsed.captured_at !== "string" ||
    typeof parsed.n_tasks_in_set !== "number" ||
    !Array.isArray(parsed.rows)
  ) {
    throw new Error(
      "terminal-bench leaderboard artifact 形状不符合预期（dataset/dataset_version/leaderboard/title/captured_at/n_tasks_in_set/rows）",
    );
  }
  return parsed as LeaderboardArtifact;
}

/** tasks.txt：一行一个任务名；空行忽略。 */
export function parseTaskNames(body: string): string[] {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
