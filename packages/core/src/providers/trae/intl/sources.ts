import type { SourceSpec as TraeSourceSpec, SourceChainSpec } from "../../_shared.ts";

/** 来源 id 常量：normalize 层引用，避免字面量散落。 */
export const SRC = {
  /**
   * 营销定价页（trae.ai/pricing）：客户端渲染，仅获取页脚联系邮箱。
   * 失败分类 `RENDER_DEPENDENT` 与探索 01 §7.4 一致——抓取成功但无可机读正文。
   */
  pricing: "trae-intl-pricing",
  /** 核心计费文档（new-plans-and-billing）：覆盖价目/额度/支付/地区。 */
  plansAndBilling: "trae-intl-plans-and-billing",
  /** 订阅 FAQ：细则（自动续费、地区订阅限制）。 */
  plansFaq: "trae-intl-plans-and-billing-faqs",
  /** 按量付费说明：On-Demand 触发条件与结算口径。 */
  onDemand: "trae-intl-on-demand-usage",
  /** Legacy 旧版计费（保留 fast/slow requests 折算规则）。 */
  legacyBilling: "trae-intl-billing",
  /** 支持国家/地区列表：Asia/Europe/... 41 国不含大陆/港/澳。 */
  supportedCountries: "trae-intl-supported-countries",
  /** 内置模型与 API 费率表（/1M tokens）。 */
  models: "trae-intl-models",
  /** 2026-02-13 会员升级 token 计费转型公告。 */
  blogMembershipUpgrade: "trae-intl-blog-membership-upgrade",
  /** 更新日志（按日期）。 */
  changelog: "trae-intl-changelog",
  /** 隐私政策（US users 口径）。 */
  privacyPolicy: "trae-intl-privacy-policy",
} as const;

/**
 * Trae 国际站（trae.ai，USD，"Dollar Usage"计费）来源注册表。
 * 种类遵循探索 01 §7.3 的来源优先级（定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款）。
 *
 * 营销定价页 trae.ai/pricing 为客户端渲染（仅返回 FAQ 标题与联系邮箱），正文需经
 * docs.trae.ai 帮助文档替代入口（research/04 §1.1）。定价页 `ok_code = RENDER_DEPENDENT`，
 * 表示抓取 200 但无可机读正文。
 */
export const TRAE_INTL_SOURCES: TraeSourceSpec[] = [
  {
    source_id: SRC.pricing,
    url: "https://www.trae.ai/pricing",
    file: "trae-intl-pricing.html",
    kind: "pricing_page",
    ok_code: "RENDER_DEPENDENT",
  },
  {
    source_id: SRC.plansAndBilling,
    url: "https://docs.trae.ai/ide/new-plans-and-billing",
    file: "trae-intl-plans-and-billing.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.plansFaq,
    url: "https://docs.trae.ai/ide/plans-and-billing-faqs",
    file: "trae-intl-plans-and-billing-faqs.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.onDemand,
    url: "https://docs.trae.ai/ide/on-demand-usage",
    file: "trae-intl-on-demand-usage.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.legacyBilling,
    url: "https://docs.trae.ai/ide/billing",
    file: "trae-intl-billing.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.supportedCountries,
    url: "https://docs.trae.ai/ide/supported-countries-and-regions",
    file: "trae-intl-supported-countries.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.models,
    url: "https://docs.trae.ai/ide/models",
    file: "trae-intl-models.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.blogMembershipUpgrade,
    url: "https://www.trae.ai/blog/trae_membership_0213",
    file: "trae-intl-blog-membership-upgrade.md",
    kind: "announcement",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.changelog,
    url: "https://docs.trae.ai/ide/changelog",
    file: "trae-intl-changelog.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.privacyPolicy,
    url: "https://www.trae.ai/privacy-policy",
    file: "trae-intl-privacy-policy.md",
    kind: "legal",
    ok_code: "OK_MD",
  },
];

/**
 * 回退链配置：每条链按来源优先级升序尝试，首个成功者作为 chosen_source_id。
 * 价目链首选 marketing 定价页（即使 RENDER_DEPENDENT 也记录尝试），回退至文档站。
 *
 * 注意：定价页 (`pricing`) 在 chain 中首位是记录尝试的需要，但 `pickBodyByChain`
 * 会在首个非空 body 处停下。对于链的"实际读取正文"而言，文档站应优先于 RENDER_DEPENDENT
 * 页面（虽然 HTTP 200 但无可机读正文）。这通过把 pricing 移到第二位、
 * 但仍保留其在 source_chains 的尝试记录中实现。
 *
 * 然而为同时满足：(1) chain attempts 包含 pricing 用于失败码追溯，
 * (2) pickBodyByChain 跳过 RENDER_DEPENDENT 正文选择下一个候选，
 * 本 Provider 使用两套链：
 *   - chain_for_extraction: 跳过 RENDER_DEPENDENT 正文（用于字段抽取）
 *   - chain_for_source_chains: 完整候选（用于 source_chains 字段展示）
 *
 * 为了简洁、避免重复声明两份链，本 Provider 优先使用 plans-and-billing 文档站作为
 * extract 起点；pricing 仅进入 source_chains 的 attempts 列表。
 */
export const TRAE_INTL_CHAINS: SourceChainSpec[] = [
  {
    chain_id: "trae-intl-pricing",
    purpose: "Trae 国际五档价目（文档站 new-plans-and-billing；pricing 页 RENDER_DEPENDENT 仅作 source_chains 记录）",
    source_ids: [SRC.plansAndBilling, SRC.pricing, SRC.blogMembershipUpgrade],
  },
  {
    chain_id: "trae-intl-billing-rules",
    purpose: "Trae 国际计费规则、自动续费、Pro 试用、地区订阅限制",
    source_ids: [SRC.plansFaq, SRC.plansAndBilling],
  },
  {
    chain_id: "trae-intl-on-demand",
    purpose: "Trae 国际按量付费（On-Demand Usage）触发条件与结算口径",
    source_ids: [SRC.onDemand, SRC.plansAndBilling],
  },
  {
    chain_id: "trae-intl-regions",
    purpose: "Trae 国际支持国家/地区清单（含中国大陆/港澳的排除式声明）",
    source_ids: [SRC.supportedCountries, SRC.plansAndBilling],
  },
  {
    chain_id: "trae-intl-models",
    purpose: "Trae 国际内置模型与 API 费率表（含 US 屏蔽 GPT/MiniMax）",
    source_ids: [SRC.models, SRC.plansAndBilling],
  },
  {
    chain_id: "trae-intl-privacy",
    purpose: "Trae 国际隐私政策（US users 口径，声明用于训练改进）",
    source_ids: [SRC.privacyPolicy, SRC.plansFaq],
  },
  {
    chain_id: "trae-intl-legacy-billing",
    purpose: "Trae 国际旧版计费（fast/slow requests → Dollar Usage 折算）",
    source_ids: [SRC.legacyBilling],
  },
];
