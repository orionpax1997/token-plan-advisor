import type { BenchmarkSourceSpec } from "../_shared.ts";

/** 来源 id 常量：normalize 层引用，避免字面量散落。 */
export const SRC = {
  page: "zapier-benchmarks-page",
  pageMeta: "zapier-benchmarks-page-meta",
  privateLeaderboard: "zapier-private-leaderboard",
  readme: "zapier-readme",
  license: "zapier-license",
  changelog: "zapier-changelog",
  publicTasks: "zapier-public-tasks",
  publicBaselines: "zapier-public-baselines",
  pyproject: "zapier-pyproject",
  runner: "zapier-runner",
  eval: "zapier-eval-script",
  taskContract: "zapier-task-contract",
  salesTasks: "zapier-sales-tasks",
  pricing: "zapier-pricing",
} as const;

/**
 * Zapier AutomationBench 1.0.6 官方快照注册表（research/15-06 记录的官方来源 URL）。
 *
 * 重要：本批把官方私有 held-out leaderboard 与公开 600-task 仓库作为**两个不同的
 * 数据集标识**分开记录，不互相补齐分数（私有 vs 公开 README 明确不 1:1 等价）。
 *
 *   - 私有 held-out leaderboard = 来源 zapier-benchmarks-page + zapier-private-leaderboard.json
 *     （页面/榜单内容；domain 摘要仅在 license_and_access_notes 中引用，不再作为独立 record）
 *   - 公开 600-task 仓库 = 来源 zapier-public-tasks.json（README 公开任务清单 + domain 主题，
 *     在 task_set.domains 字段表达），public-baselines.json 提供公开 baseline 模型展示名作为 reference
 *
 * 跨两者的分数（私有 vs 公开）禁止换算、补齐或拼接；strict record 的 record_id 前缀
 * `zapier-private:1.0.6:` 已与 task_set.task_set_kind + license_and_access_notes 同步。
 */
export const ZAPIER_AUTOMATIONBENCH_SOURCES: BenchmarkSourceSpec[] = [
  {
    source_id: SRC.page,
    url: "https://zapier.com/benchmarks",
    file: "leaderboard.html",
    kind: "leaderboard_artifact",
  },
  {
    source_id: SRC.pageMeta,
    url: "https://zapier.com/benchmarks",
    file: "page-meta.json",
    kind: "official_docs",
  },
  {
    source_id: SRC.privateLeaderboard,
    url: "https://zapier.com/benchmarks",
    file: "private-leaderboard.json",
    kind: "leaderboard_artifact",
  },
  {
    source_id: SRC.readme,
    url: "https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md",
    file: "README.md",
    kind: "official_docs",
  },
  {
    source_id: SRC.license,
    url: "https://raw.githubusercontent.com/zapier/AutomationBench/main/LICENSE",
    file: "LICENSE",
    kind: "official_license",
  },
  {
    source_id: SRC.changelog,
    url: "https://raw.githubusercontent.com/zapier/AutomationBench/main/CHANGELOG.md",
    file: "CHANGELOG.md",
    kind: "official_docs",
  },
  {
    source_id: SRC.publicTasks,
    url: "https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md",
    file: "public-tasks.json",
    kind: "task_set_artifact",
  },
  {
    source_id: SRC.publicBaselines,
    url: "https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md",
    file: "public-baselines.json",
    kind: "leaderboard_artifact",
  },
  {
    source_id: SRC.pyproject,
    url: "https://raw.githubusercontent.com/zapier/AutomationBench/main/pyproject.toml",
    file: "pyproject.toml",
    kind: "official_docs",
  },
  {
    source_id: SRC.runner,
    url: "https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/runner.py",
    file: "runner.py",
    kind: "official_docs",
  },
  {
    source_id: SRC.eval,
    url: "https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/scripts/eval.py",
    file: "eval.py",
    kind: "official_docs",
  },
  {
    source_id: SRC.taskContract,
    url: "https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/task_contract.py",
    file: "task_contract.py",
    kind: "official_docs",
  },
  {
    source_id: SRC.salesTasks,
    url: "https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/domains/sales/tasks.py",
    file: "sales-tasks.py",
    kind: "official_docs",
  },
  {
    source_id: SRC.pricing,
    url: "https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/pricing.py",
    file: "pricing.py",
    kind: "official_docs",
  },
];
