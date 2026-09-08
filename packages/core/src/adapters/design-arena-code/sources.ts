import type { BenchmarkSourceSpec } from "../_shared.ts";

/** 来源 id 常量：normalize 层引用，避免字面量散落。 */
export const SRC = {
  leaderboard: "design-arena-code-leaderboard",
  registry: "design-arena-code-registry",
  methodology: "design-arena-code-methodology",
  about: "design-arena-code-about",
  systemPrompts: "design-arena-code-system-prompts",
  terms: "design-arena-code-terms",
  apiDocs: "design-arena-code-api-docs",
} as const;

/**
 * Design Arena Code leaderboard 官方来源注册表（research/15-03 记录的官方 URL）。
 *
 * API 文档允许商业使用（要求署名+链接），Terms 又限制爬虫、复制和商业用途——
 * 适用范围张力，官方未给出统一明确许可结论。本 fixture 为官方接口与方法页的
 * 结构化快照（不含页面 HTML 全文）；自动化批量访问授权申请为待办（见 license_and_access_notes）。
 *
 * 与 Arena Agent 不同：Design Arena 公开 leaderboard API（POST /api/leaderboard），
 * 字段为机读 JSON（modelId/wins/losses/battles/winRate/elo/btStdErr/avgGenerationTimeMs）；
 * registry 接口独立返回官方模型总数——registry 总数 ≠ 榜单覆盖数（当前 496 vs 164）。
 */
export const DESIGN_ARENA_CODE_SOURCES: BenchmarkSourceSpec[] = [
  {
    source_id: SRC.leaderboard,
    url: "https://www.designarena.ai/leaderboard/code",
    file: "leaderboard.json",
    kind: "leaderboard_artifact",
  },
  {
    source_id: SRC.registry,
    url: "https://www.designarena.ai/api/registry",
    file: "registry.json",
    kind: "task_set_artifact",
  },
  {
    source_id: SRC.methodology,
    url: "https://notes.designarena.ai/methodology/",
    file: "methodology.json",
    kind: "official_docs",
  },
  {
    source_id: SRC.about,
    url: "https://www.designarena.ai/about",
    file: "about.json",
    kind: "official_docs",
  },
  {
    source_id: SRC.systemPrompts,
    url: "https://www.designarena.ai/system-prompts",
    file: "system-prompts.json",
    kind: "official_docs",
  },
  {
    source_id: SRC.terms,
    url: "https://www.designarena.ai/terms-and-conditions",
    file: "terms.json",
    kind: "official_license",
  },
  {
    source_id: SRC.apiDocs,
    url: "https://docs.designarena.ai/introduction",
    file: "api-docs.json",
    kind: "official_docs",
  },
];
