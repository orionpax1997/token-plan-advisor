import type { BenchmarkSourceSpec } from "../_shared.ts";

/** 来源 id 常量：normalize 层引用，避免字面量散落。 */
export const SRC = {
  release: "deepswe-release",
  leaderboard: "deepswe-leaderboard",
  tasks: "deepswe-tasks",
  readme: "deepswe-readme",
  license: "deepswe-license",
  run: "deepswe-run",
} as const;

/**
 * DeepSWE v1.1 官方快照注册表（research/15-01 记录的 artifact URL）。
 * trials.json（31,617 条 trial、约 51MB）官方同口径公开，但本批只需官方聚合
 * leaderboard，为控制包体积不随包分发；其 URL 记录于 unresolved fact 的
 * how_to_resolve 中，后续如需 trial 级核验再行引入。
 */
export const DEEPSWE_SOURCES: BenchmarkSourceSpec[] = [
  {
    source_id: SRC.release,
    url: "https://deepswe.datacurve.ai/artifacts/v1.1/release.json",
    file: "release.json",
    kind: "release_manifest",
  },
  {
    source_id: SRC.leaderboard,
    url: "https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json",
    file: "leaderboard-live.json",
    kind: "leaderboard_artifact",
  },
  {
    source_id: SRC.tasks,
    url: "https://deepswe.datacurve.ai/artifacts/v1.1/tasks.json",
    file: "tasks.json",
    kind: "task_set_artifact",
  },
  {
    source_id: SRC.readme,
    url: "https://raw.githubusercontent.com/datacurve-ai/deep-swe/main/README.md",
    file: "README.md",
    kind: "official_docs",
  },
  {
    source_id: SRC.license,
    url: "https://raw.githubusercontent.com/datacurve-ai/deep-swe/main/LICENSE",
    file: "LICENSE",
    kind: "official_license",
  },
  {
    // 官方运行说明（静态 SSR HTML）：mini-swe-agent + Pier + Modal 编排、网络隔离与资源上限的来源
    source_id: SRC.run,
    url: "https://deepswe.datacurve.ai/run",
    file: "deepswe-run-page.html",
    kind: "official_docs",
  },
];
