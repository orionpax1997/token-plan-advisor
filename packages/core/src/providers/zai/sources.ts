import type { FailureCode, SourceKind } from "../../schema/plan.ts";

export interface SourceSpec {
  source_id: string;
  url: string;
  /** fixture 文件名（相对 fixtures/zai/）。 */
  file: string;
  kind: SourceKind;
  /** 200 时的失败分类标记；docs.z.ai 的 .md 页为 OK_MD，订阅页仅静态 meta 可读为 OK。 */
  ok_code: FailureCode;
}

/** 来源 id 常量：normalize 层引用，避免字面量散落。 */
export const SRC = {
  overview: "devpack-overview",
  teamplan: "devpack-teamplan",
  usagePolicy: "devpack-usage-policy",
  faq: "devpack-faq",
  helpFaq: "help-faq",
  usageRevision: "notice-usage-revision",
  transition: "notice-transition",
  eventFlash: "notice-event-glm-53-flash",
  terms: "legal-terms-of-use",
  privacy: "legal-privacy-policy",
  subscribe: "subscribe-page",
} as const;

/**
 * z.ai 国际区来源注册表。种类（kind）遵循探索 01 §7.3 的来源优先级
 * （定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款）；
 * 本数组的排列仅为采集顺序，优先级回退链在 ticket 02 落地。
 */
export const ZAI_SOURCES: SourceSpec[] = [
  { source_id: SRC.overview, url: "https://docs.z.ai/devpack/overview.md", file: "devpack-overview.md", kind: "docs_help", ok_code: "OK_MD" },
  { source_id: SRC.teamplan, url: "https://docs.z.ai/devpack/teamplan.md", file: "devpack-teamplan.md", kind: "docs_help", ok_code: "OK_MD" },
  { source_id: SRC.usagePolicy, url: "https://docs.z.ai/devpack/usage-policy.md", file: "devpack-usage-policy.md", kind: "docs_help", ok_code: "OK_MD" },
  { source_id: SRC.faq, url: "https://docs.z.ai/devpack/faq.md", file: "devpack-faq.md", kind: "docs_help", ok_code: "OK_MD" },
  { source_id: SRC.helpFaq, url: "https://docs.z.ai/help/faq.md", file: "help-faq.md", kind: "docs_help", ok_code: "OK_MD" },
  { source_id: SRC.usageRevision, url: "https://docs.z.ai/devpack/notice/usage-revision.md", file: "notice-usage-revision.md", kind: "announcement", ok_code: "OK_MD" },
  { source_id: SRC.transition, url: "https://docs.z.ai/devpack/transition.md", file: "notice-transition.md", kind: "announcement", ok_code: "OK_MD" },
  { source_id: SRC.eventFlash, url: "https://docs.z.ai/devpack/notice/event-glm-5.3-flash.md", file: "notice-event-glm-53-flash.md", kind: "announcement", ok_code: "OK_MD" },
  { source_id: SRC.terms, url: "https://docs.z.ai/legal-agreement/terms-of-use.md", file: "legal-terms-of-use.md", kind: "legal", ok_code: "OK_MD" },
  { source_id: SRC.privacy, url: "https://docs.z.ai/legal-agreement/privacy-policy.md", file: "legal-privacy-policy.md", kind: "legal", ok_code: "OK_MD" },
  // z.ai/subscribe 正文为重度客户端渲染（RENDER_DEPENDENT），仅 meta 可静态核验。
  { source_id: SRC.subscribe, url: "https://z.ai/subscribe", file: "subscribe-meta.html", kind: "pricing_page", ok_code: "OK" },
];
