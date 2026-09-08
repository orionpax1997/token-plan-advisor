import type { SourceSpec as CursorSourceSpec, SourceChainSpec } from "../../_shared.ts";

/** 来源 id 常量：normalize 层引用，避免字面量散落。 */
export const SRC = {
  pricing: "cursor-pricing",
  helpPricing: "cursor-help-pricing",
  docsModelsPricing: "cursor-docs-models-pricing",
  helpUsageLimits: "cursor-help-usage-limits",
  helpOverages: "cursor-help-overages",
  docsAdminApi: "cursor-docs-admin-api",
  helpAppStore: "cursor-help-appstore",
  helpRegions: "cursor-help-regions",
  helpPrivacy: "cursor-help-privacy",
  docsPrivacyGovernance: "cursor-docs-privacy-governance",
  tos: "cursor-tos",
  blogNewTier: "cursor-blog-new-tier",
  blogJune2025Pricing: "cursor-blog-june-2025-pricing",
  blogTeamsPricing: "cursor-blog-teams-pricing",
  helpReferral: "cursor-help-referral",
} as const;

/**
 * Cursor（Anysphere）全球版（USD）来源注册表。
 * 种类（kind）遵循探索 01 §7.3 的来源优先级（定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款）。
 *
 * 营销定价页（cursor.com/pricing）为客户端渲染：静态 HTML 只显示月付与 4 张卡片，
 * Yearly/档位切换经 JS 渲染；但页面内嵌 JSON-LD `Offer` 结构化数据（探索 01 §7.4 将其
 * 列为 `JS_RENDERED_DATA` 的典型案例）。因此该来源 ok_code = "JS_RENDERED_DATA"：
 * 抓取成功但正文不可直接读表，价目经 JSON-LD 与帮助中心/文档站替代入口完成采集。
 */
export const CURSOR_SOURCES: CursorSourceSpec[] = [
  {
    source_id: SRC.pricing,
    url: "https://cursor.com/pricing",
    file: "cursor-pricing.html",
    kind: "pricing_page",
    ok_code: "JS_RENDERED_DATA",
  },
  {
    source_id: SRC.helpPricing,
    url: "https://cursor.com/help/account-and-billing/pricing",
    file: "cursor-help-pricing.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.docsModelsPricing,
    url: "https://cursor.com/docs/models-and-pricing",
    file: "cursor-docs-models-pricing.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.helpUsageLimits,
    url: "https://cursor.com/help/models-and-usage/usage-limits",
    file: "cursor-help-usage-limits.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.helpOverages,
    url: "https://cursor.com/help/account-and-billing/overages",
    file: "cursor-help-overages.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.docsAdminApi,
    url: "https://cursor.com/docs/account/teams/admin-api",
    file: "cursor-docs-admin-api.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.helpAppStore,
    url: "https://cursor.com/help/account-and-billing/app-store-subscription",
    file: "cursor-help-appstore.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.helpRegions,
    url: "https://cursor.com/help/security-and-privacy/regions",
    file: "cursor-help-regions.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.helpPrivacy,
    url: "https://cursor.com/help/security-and-privacy/privacy",
    file: "cursor-help-privacy.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.docsPrivacyGovernance,
    url: "https://cursor.com/docs/enterprise/privacy-and-data-governance",
    file: "cursor-docs-privacy-governance.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.tos,
    url: "https://cursor.com/terms-of-service",
    file: "cursor-tos.html",
    kind: "legal",
    ok_code: "OK",
  },
  {
    source_id: SRC.blogNewTier,
    url: "https://cursor.com/blog/new-tier",
    file: "cursor-blog-new-tier.md",
    kind: "announcement",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.blogJune2025Pricing,
    url: "https://cursor.com/blog/june-2025-pricing",
    file: "cursor-blog-june-2025-pricing.md",
    kind: "announcement",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.blogTeamsPricing,
    url: "https://cursor.com/blog/teams-pricing-june-2026",
    file: "cursor-blog-teams-pricing.md",
    kind: "announcement",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.helpReferral,
    url: "https://cursor.com/help/account-and-billing/referral-program",
    file: "cursor-help-referral.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
];

/**
 * 回退链配置。每条链按来源优先级升序尝试，首个成功者作为 chosen_source_id。
 * 链的存在让采集输出明确记录"首选失败→备选"的回退路径；
 * JS 渲染定价页的替代入口（JSON-LD → 帮助中心表 → 文档站）在 cursor-pricing 链上可见。
 */
export const CURSOR_CHAINS: SourceChainSpec[] = [
  {
    chain_id: "cursor-pricing",
    purpose: "Cursor 个人与团队价目（JS 渲染定价页 → JSON-LD/帮助中心/文档站替代入口）",
    source_ids: [SRC.pricing, SRC.helpPricing, SRC.docsModelsPricing],
  },
  {
    chain_id: "cursor-quota-pools",
    purpose: "双池额度（Cursor Models / Other Models）与 on-demand 溢出计费",
    source_ids: [SRC.helpPricing, SRC.docsModelsPricing, SRC.helpUsageLimits, SRC.helpOverages],
  },
  {
    chain_id: "cursor-usage-visibility",
    purpose: "用量可见性（Admin API 能力声明；不登录、不读取账户数据）",
    source_ids: [SRC.docsAdminApi, SRC.helpUsageLimits],
  },
  {
    chain_id: "cursor-regional",
    purpose: "地区与支付渠道可用性（iOS 内购、模型地区限制、出口管制）",
    source_ids: [SRC.helpAppStore, SRC.helpRegions, SRC.tos],
  },
  {
    chain_id: "cursor-data-policy",
    purpose: "隐私模式 / ZDR / 数据治理",
    source_ids: [SRC.helpPrivacy, SRC.docsPrivacyGovernance, SRC.tos],
  },
  {
    chain_id: "cursor-pricing-history",
    purpose: "定价改制历史（2025-06 请求制→用量制；仅作来源注释，不建模旧档位）",
    source_ids: [SRC.blogNewTier, SRC.blogJune2025Pricing],
  },
  {
    chain_id: "cursor-teams-annual",
    purpose: "Teams 年付价与 Premium 席位倍数",
    source_ids: [SRC.blogTeamsPricing, SRC.helpPricing],
  },
  {
    chain_id: "cursor-personal-yearly",
    purpose: "个人计划年付折扣声明（具体月单价需登录 Stripe checkout）",
    source_ids: [SRC.helpReferral, SRC.helpPricing],
  },
];
