import type { SourceSpec as CodeBuddySourceSpec, SourceChainSpec } from "../../_shared.ts";

/** 来源 id 常量：normalize 层引用，避免字面量散落。 */
export const SRC = {
  pricingCn: "codebuddy-cn-pricing",
  versionDoc: "cloud-1749-109769",
  billingDoc: "cloud-1749-126592",
  creditsDoc: "cloud-1749-129680",
  faqDoc: "cloud-1749-104248",
} as const;

/**
 * CodeBuddy 中国站（腾讯云代码助手）来源注册表。
 * 种类（kind）遵循探索 01 §7.3 的来源优先级（定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款）。
 * 本注册表覆盖价目、积分规则与版本说明三类事实。
 */
export const CODEBUDDY_CN_SOURCES: CodeBuddySourceSpec[] = [
  {
    source_id: SRC.pricingCn,
    url: "https://www.codebuddy.cn/docs/ide/Account/pricing",
    file: "codebuddy-cn-pricing.md",
    kind: "pricing_page",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.versionDoc,
    url: "https://cloud.tencent.com/document/product/1749/109769",
    file: "cloud-1749-109769.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.billingDoc,
    url: "https://cloud.tencent.com/document/product/1749/126592",
    file: "cloud-1749-126592.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.creditsDoc,
    url: "https://cloud.tencent.com/document/product/1749/129680",
    file: "cloud-1749-129680.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.faqDoc,
    url: "https://cloud.tencent.com/document/product/1749/104248",
    file: "cloud-1749-104248.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
];

/**
 * 回退链配置。每条链按来源优先级升序尝试，首个成功者作为 chosen_source_id。
 * 链的存在让采集输出明确记录"首选失败→备选"的回退路径。
 */
export const CODEBUDDY_CN_CHAINS: SourceChainSpec[] = [
  {
    chain_id: "codebuddy-cn-pricing",
    purpose: "CodeBuddy 中国个人版价目与额度",
    source_ids: [SRC.pricingCn, SRC.versionDoc, SRC.billingDoc],
  },
  {
    chain_id: "codebuddy-cn-billing",
    purpose: "CodeBuddy 中国计费概述与过渡条款（含旧价口径）",
    source_ids: [SRC.billingDoc, SRC.versionDoc],
  },
  {
    chain_id: "codebuddy-cn-version",
    purpose: "CodeBuddy 中国版本说明与模型清单",
    source_ids: [SRC.versionDoc, SRC.pricingCn],
  },
  {
    chain_id: "codebuddy-cn-credits-rules",
    purpose: "CodeBuddy 中国积分发放/有效期/消耗规则",
    source_ids: [SRC.creditsDoc, SRC.pricingCn, SRC.versionDoc],
  },
  {
    chain_id: "codebuddy-cn-faq",
    purpose: "CodeBuddy 中国常见问题与登录/账号相关说明",
    source_ids: [SRC.faqDoc, SRC.versionDoc],
  },
];