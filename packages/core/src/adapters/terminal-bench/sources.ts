import type { BenchmarkSourceSpec } from "../_shared.ts";

/** 来源 id 常量：normalize 层引用，避免字面量散落。 */
export const SRC = {
  hub: "terminal-bench-hub",
  hubHtml: "terminal-bench-hub-html",
  tasks: "terminal-bench-tasks",
  readme: "terminal-bench-readme",
  license: "terminal-bench-license",
  harborTasksDocs: "harbor-tasks-docs",
  harborMetricsDocs: "harbor-metrics-docs",
  harborTutorial: "harbor-tb-tutorial",
} as const;

/**
 * Terminal-Bench 4.0 官方快照注册表（research/15-05 记录的官方来源 URL）。
 *
 * 页面是 Harbor Hub 公开动态榜单，客户端 JS 渲染排行榜行；
 * 官方未提供逐行机器可读 leaderboard JSON（Harbor CLI 可拉取但需登录/API key，
 * Hub 排行榜 CLI 文档明确区分了管理接口与公开页面），因此本批把页面直接显示的
 * 字段以 JSON 形式落盘（leaderboard.json），保留官方列名与字段命名。
 *
 * 来源种类：hub/leaderboard.json = leaderboard_artifact；hubHtml 与 tasks.txt = 同一公开
 * 页面拆分的不同部分；官方 README/LICENSE 与 Harbor 官方任务/指标/教程文档作为
 * official_docs/official_license。
 */
export const TERMINAL_BENCH_SOURCES: BenchmarkSourceSpec[] = [
  {
    source_id: SRC.readme,
    url: "https://github.com/harbor-framework/terminal-bench/blob/main/README.md",
    file: "README.md",
    kind: "official_docs",
  },
  {
    source_id: SRC.license,
    url: "https://github.com/harbor-framework/terminal-bench/blob/main/LICENSE",
    file: "LICENSE",
    kind: "official_license",
  },
  {
    source_id: SRC.hub,
    url: "https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0",
    file: "leaderboard.json",
    kind: "leaderboard_artifact",
  },
  {
    source_id: SRC.hubHtml,
    url: "https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0",
    file: "leaderboard-page.html",
    kind: "official_docs",
  },
  {
    source_id: SRC.tasks,
    url: "https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0",
    file: "tasks.txt",
    kind: "task_set_artifact",
  },
  {
    source_id: SRC.harborTasksDocs,
    url: "https://www.harborframework.com/docs/tasks",
    file: "harbor-tasks-docs.html",
    kind: "official_docs",
  },
  {
    source_id: SRC.harborMetricsDocs,
    url: "https://www.harborframework.com/docs/datasets/metrics",
    file: "harbor-metrics-docs.html",
    kind: "official_docs",
  },
  {
    source_id: SRC.harborTutorial,
    url: "https://www.harborframework.com/docs/tutorials/running-terminal-bench",
    file: "harbor-tb-tutorial.html",
    kind: "official_docs",
  },
];
