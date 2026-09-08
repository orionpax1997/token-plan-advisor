import type { SourceSpec as CodeBuddySourceSpec, SourceChainSpec } from "../../_shared.ts";

/** 来源 id 常量。 */
export const SRC = {
  pricingIntl: "codebuddy-intl-pricing",
  billingOverview: "intl-1256-77269",
  priceDetails: "intl-1256-77270",
  productOverview: "intl-1256-77266",
  privacyPolicy: "intl-codebuddy-privacy",
} as const;

/**
 * CodeBuddy 国际站（Tencent Cloud International）来源注册表。
 * 种类遵循探索 01 §7.3 的来源优先级（定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款）。
 */
export const CODEBUDDY_INTL_SOURCES: CodeBuddySourceSpec[] = [
  {
    source_id: SRC.pricingIntl,
    url: "https://www.codebuddy.ai/docs/ide/Account/pricing",
    file: "codebuddy-intl-pricing.md",
    kind: "pricing_page",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.billingOverview,
    url: "https://www.tencentcloud.com/document/product/1256/77269",
    file: "intl-1256-77269.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.priceDetails,
    url: "https://www.tencentcloud.com/document/product/1256/77270",
    file: "intl-1256-77270.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.productOverview,
    url: "https://www.tencentcloud.com/document/product/1256/77266",
    file: "intl-1256-77266.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.privacyPolicy,
    url: "https://www.codebuddy.ai/document/privacy-policy",
    file: "intl-codebuddy-privacy.md",
    kind: "legal",
    ok_code: "OK_MD",
  },
];

/**
 * 回退链配置：每条链记录来源优先级与首选失败时的备选入口。
 */
export const CODEBUDDY_INTL_CHAINS: SourceChainSpec[] = [
  {
    chain_id: "codebuddy-intl-pricing",
    purpose: "CodeBuddy 国际个人版价目与额度",
    source_ids: [SRC.pricingIntl, SRC.billingOverview, SRC.priceDetails],
  },
  {
    chain_id: "codebuddy-intl-billing-rules",
    purpose: "CodeBuddy 国际计费规则、积分发放与老用户保价",
    source_ids: [SRC.billingOverview, SRC.priceDetails, SRC.pricingIntl],
  },
  {
    chain_id: "codebuddy-intl-legacy-pricing",
    purpose: "CodeBuddy 国际过渡期老价口径（Price details）",
    source_ids: [SRC.priceDetails, SRC.pricingIntl],
  },
  {
    chain_id: "codebuddy-intl-privacy",
    purpose: "CodeBuddy 国际隐私政策与数据处理",
    source_ids: [SRC.privacyPolicy, SRC.billingOverview],
  },
];