import type { BenchmarkSourceSpec } from "../_shared.ts";

/** 来源 id 常量：normalize 层引用，避免字面量散落。 */
export const SRC = {
  homepage: "aa-homepage",
  methodology: "aa-methodology",
  methodologyLanding: "aa-methodology-landing",
  indexDetail: "aa-index-detail",
  apiDocs: "aa-api-docs",
  terms: "aa-terms",
} as const;

/**
 * Artificial Analysis Intelligence v4.1.1 官方快照注册表（research/15-04 记录的页面 URL）。
 *
 * 与 DeepSWE/Terminal-Bench/Zapier 不同：AA 网站 Terms of Use 禁止复制、分发、下载与
 * 自动化查询（strip/scrape/mine），因此 fixture 不是页面 HTML/JSON 原文，而是官方页面
 * 事实的结构化转写（2026-09-08 06:33 UTC 采集，事实基准 research/15-04），逐项可溯源至
 * 此处登记的官方 URL。自动化访问授权申请为待办（见 license_and_access_notes）。
 */
export const ARTIFICIAL_ANALYSIS_SOURCES: BenchmarkSourceSpec[] = [
  {
    source_id: SRC.homepage,
    url: "https://artificialanalysis.ai/#intelligence",
    file: "homepage-intelligence.json",
    kind: "official_docs",
  },
  {
    source_id: SRC.methodology,
    url: "https://artificialanalysis.ai/methodology/intelligence-benchmarking",
    file: "methodology-intelligence-index.json",
    kind: "official_docs",
  },
  {
    source_id: SRC.methodologyLanding,
    url: "https://artificialanalysis.ai/methodology/",
    file: "methodology-landing.json",
    kind: "official_docs",
  },
  {
    source_id: SRC.indexDetail,
    url: "https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index",
    file: "index-detail-page.json",
    kind: "official_docs",
  },
  {
    source_id: SRC.apiDocs,
    url: "https://artificialanalysis.ai/data-api/docs",
    file: "data-api-docs.json",
    kind: "official_docs",
  },
  {
    source_id: SRC.terms,
    url: "https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf",
    file: "terms-of-use.json",
    kind: "official_license",
  },
];
