import type { BenchmarkSourceSpec } from "../_shared.ts";

/** 来源 id 常量：normalize 层引用，避免字面量散落。 */
export const SRC = {
  leaderboard: "arena-agent-leaderboard",
  methodology: "arena-agent-methodology",
  agentModeHelp: "arena-agent-mode-help",
  categoriesCost: "arena-agent-categories-cost",
  terms: "arena-agent-terms",
  privacy: "arena-agent-privacy",
} as const;

/**
 * Arena Agent 官方来源注册表（research/15-02 记录的官方 URL）。
 *
 * 与 DeepSWE/Terminal-Bench/Zapier 不同：Arena 服务条款禁止程序化或自动化抓取、
 * 提取或下载网页数据，未发现 Agent leaderboard 聚合数据的独立开放许可证。
 * 因此 fixture 是官方页面公开字段的结构化快照（leaderboard 公开行 + 五类信号 +
 * Net Improvement 95% CI + 资源字段 + session/model 数 + 页面显示更新时间），
 * 不是页面 HTML 全文；逐项事实可溯源至 manifest 登记的官方 URL 与本采集时点。
 * 自动化访问授权申请为待办（见 license_and_access_notes）。
 */
export const ARENA_AGENT_SOURCES: BenchmarkSourceSpec[] = [
  {
    source_id: SRC.leaderboard,
    url: "https://arena.ai/leaderboard/agent",
    file: "leaderboard.json",
    kind: "leaderboard_artifact",
  },
  {
    source_id: SRC.methodology,
    url: "https://arena.ai/blog/agent-arena-methodology",
    file: "methodology.json",
    kind: "official_docs",
  },
  {
    source_id: SRC.agentModeHelp,
    url: "https://help.arena.ai/articles/5432423882-how-to-use-agent-mode",
    file: "agent-mode-help.json",
    kind: "official_docs",
  },
  {
    source_id: SRC.categoriesCost,
    url: "https://arena.ai/blog/agent-categories-and-cost",
    file: "categories-and-cost.json",
    kind: "official_docs",
  },
  {
    source_id: SRC.terms,
    url: "https://help.arena.ai/articles/5629909088-terms-of-use",
    file: "terms.json",
    kind: "official_license",
  },
  {
    source_id: SRC.privacy,
    url: "https://help.arena.ai/articles/3765052346-privacy-policy",
    file: "privacy.json",
    kind: "official_docs",
  },
];
