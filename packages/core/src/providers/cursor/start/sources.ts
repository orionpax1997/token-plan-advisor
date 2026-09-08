import type { SourceSpec as CursorSourceSpec, SourceChainSpec } from "../../_shared.ts";

/** 来源 id 常量。 */
export const SRC = {
  startHelp: "cursor-start-help",
  startBlog: "cursor-start-blog",
  startRegions: "cursor-start-regions",
} as const;

/**
 * Cursor Start（印度区域档，INR）来源注册表。
 * 区域档位按 CONTEXT.md 的 Regional Variant 独立建模：独立币种（INR）、
 * 独立法域（印度）、独立套餐结构（仅第一方模型），不与 USD 主体数据合并。
 */
export const CURSOR_START_SOURCES: CursorSourceSpec[] = [
  {
    source_id: SRC.startHelp,
    url: "https://cursor.com/help/account-and-billing/cursor-start",
    file: "cursor-start-help.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.startBlog,
    url: "https://cursor.com/blog/cursor-start-india",
    file: "cursor-start-blog.md",
    kind: "announcement",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.startRegions,
    url: "https://cursor.com/help/security-and-privacy/regions",
    file: "cursor-start-regions.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
];

export const CURSOR_START_CHAINS: SourceChainSpec[] = [
  {
    chain_id: "cursor-start-pricing",
    purpose: "Cursor Start 价目与套餐结构（帮助中心 → 官方博客）",
    source_ids: [SRC.startHelp, SRC.startBlog],
  },
  {
    chain_id: "cursor-start-availability",
    purpose: "Cursor Start 地区限定与反 VPN 措施",
    source_ids: [SRC.startRegions, SRC.startHelp],
  },
];
