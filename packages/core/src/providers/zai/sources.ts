import type { SourceKind } from "../../schema/plan.ts";

export interface SourceSpec {
  source_id: string;
  url: string;
  /** fixture 文件名（相对 fixtures/zai/）。 */
  file: string;
  kind: SourceKind;
}

/**
 * z.ai 国际区来源注册表，顺序遵循探索 01 §7.3 的来源优先级
 * （定价/文档 → 公告 → 法律条款 → 购买入口）。
 */
export const ZAI_SOURCES: SourceSpec[] = [
  { source_id: "devpack-overview", url: "https://docs.z.ai/devpack/overview.md", file: "devpack-overview.md", kind: "docs_help" },
  { source_id: "devpack-teamplan", url: "https://docs.z.ai/devpack/teamplan.md", file: "devpack-teamplan.md", kind: "docs_help" },
  { source_id: "devpack-usage-policy", url: "https://docs.z.ai/devpack/usage-policy.md", file: "devpack-usage-policy.md", kind: "docs_help" },
  { source_id: "devpack-faq", url: "https://docs.z.ai/devpack/faq.md", file: "devpack-faq.md", kind: "docs_help" },
  { source_id: "help-faq", url: "https://docs.z.ai/help/faq.md", file: "help-faq.md", kind: "docs_help" },
  { source_id: "notice-usage-revision", url: "https://docs.z.ai/devpack/notice/usage-revision.md", file: "notice-usage-revision.md", kind: "announcement" },
  { source_id: "notice-transition", url: "https://docs.z.ai/devpack/transition.md", file: "notice-transition.md", kind: "announcement" },
  { source_id: "notice-event-glm-53-flash", url: "https://docs.z.ai/devpack/notice/event-glm-5.3-flash.md", file: "notice-event-glm-53-flash.md", kind: "announcement" },
  { source_id: "legal-terms-of-use", url: "https://docs.z.ai/legal-agreement/terms-of-use.md", file: "legal-terms-of-use.md", kind: "legal" },
  { source_id: "legal-privacy-policy", url: "https://docs.z.ai/legal-agreement/privacy-policy.md", file: "legal-privacy-policy.md", kind: "legal" },
  // z.ai/subscribe 正文为重度客户端渲染（RENDER_DEPENDENT），仅 meta 可静态核验。
  { source_id: "subscribe-page", url: "https://z.ai/subscribe", file: "subscribe-meta.html", kind: "pricing_page" },
];
