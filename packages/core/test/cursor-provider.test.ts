import { beforeAll, describe, expect, it } from "vitest";
import { createCursorProvider } from "../src/providers/cursor/global/provider.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";

const CAPTURED_AT = "2026-09-07T14:00:00.000Z";
const COLLECTED_AT = "2026-09-08T10:00:00.000Z";

let collection: PlanCollection;

beforeAll(async () => {
  const provider = createCursorProvider();
  const result = await provider.collect({
    mode: "fixture",
    now: () => new Date(COLLECTED_AT),
  });
  const validation = validatePlanCollection(result);
  if (!validation.ok) {
    throw new Error(`fixture 采集结果未通过 Schema 校验:\n${validation.issues.join("\n")}`);
  }
  collection = validation.value;
});

function planOf(planId: string): PlanCollection["plans"][number] {
  const plan = collection.plans.find((p) => p.plan_id === planId);
  if (!plan) throw new Error(`缺少计划 ${planId}`);
  return plan;
}

describe("Cursor Data Provider（fixture 模式）", () => {
  it("采集信封：anysphere vendor、全球主采集无 regional_variant", () => {
    expect(collection.schema_version).toBe("1");
    expect(collection.collection.provider_id).toBe("anysphere-cursor");
    expect(collection.collection.mode).toBe("fixture");
    expect(collection.collection.collected_at).toBe(COLLECTED_AT);
    expect(collection.vendor.vendor_id).toBe("anysphere");
    expect(collection.regional_variant).toBeNull();
    // 七档齐备
    expect(collection.plans.map((p) => p.plan_id)).toEqual([
      "cursor-hobby",
      "cursor-pro",
      "cursor-pro-plus",
      "cursor-ultra",
      "cursor-teams-standard",
      "cursor-teams-premium",
      "cursor-enterprise",
    ]);
  });

  it("JS 渲染定价页经 JSON-LD 采集成功：失败码 JS_RENDERED_DATA 与替代来源在输出中可见", () => {
    // 来源层：定价页抓取成功但正文 JS 渲染，失败码随来源记录
    const pricingSource = collection.sources.find((s) => s.source_id === "cursor-pricing");
    expect(pricingSource).toBeDefined();
    expect(pricingSource?.failure_code).toBe("JS_RENDERED_DATA");
    expect(pricingSource?.source_kind).toBe("pricing_page");

    // 链层：attempts[0] 带 JS_RENDERED_DATA；正文不可读，链上备选为帮助中心/文档站
    const pricingChain = collection.source_chains.find((c) => c.chain_id === "cursor-pricing");
    expect(pricingChain).toBeDefined();
    expect(pricingChain!.attempts[0]).toMatchObject({
      source_id: "cursor-pricing",
      ok: true,
      failure_code: "JS_RENDERED_DATA",
      kind: "pricing_page",
    });
    expect(pricingChain!.attempts.map((a) => a.source_id)).toEqual([
      "cursor-pricing",
      "cursor-help-pricing",
      "cursor-docs-models-pricing",
    ]);

    // 字段层：个人月付价实际来自定价页 JSON-LD（字段级 source_ids 可追溯）
    const proMonthly = planOf("cursor-pro").price_list.find((p) => p.billing_period === "monthly" && p.price_type === "standard");
    expect(proMonthly?.amount.value).toBe(20);
    expect(proMonthly?.amount.source_ids).toEqual(["cursor-pricing"]);
    expect(proMonthly?.currency.value).toBe("USD");
  });

  it("usd_equivalence 双池额度原语：等值语义、池归属、on-demand 溢出显式标注，不与 messages/tokens 混算", () => {
    expect(collection.quota_system.quota_model).toBe("usd_equivalence");
    for (const plan of collection.plans) {
      expect(plan.quota.quota_model).toBe("usd_equivalence");
      expect(plan.quota.windows.length).toBe(2);
      const [firstParty, otherModels] = plan.quota.windows;
      expect(firstParty!.unit).toContain("Cursor Models");
      expect(otherModels!.unit).toContain("Other Models");
      // 双池均标注美元等值语义与 on-demand 溢出，不与 messages/tokens 混算
      for (const w of plan.quota.windows) {
        expect(w.note).toContain("美元等值");
        expect(w.note).toContain("on-demand");
        expect(w.note).toContain("不与 messages/tokens 混算");
      }
    }
    // Other Models 池官方数值：Pro $20 / Pro+ $70 / Ultra $400（verified，来源为帮助中心表）
    expect(planOf("cursor-pro").quota.windows[1]!.amount.value).toBe(20);
    expect(planOf("cursor-pro-plus").quota.windows[1]!.amount.value).toBe(70);
    expect(planOf("cursor-ultra").quota.windows[1]!.amount.value).toBe(400);
    expect(planOf("cursor-ultra").quota.windows[1]!.status).toBe("verified");
    expect(planOf("cursor-ultra").quota.windows[1]!.amount.source_ids).toEqual(["cursor-help-pricing"]);
    // Cursor Models 池官方故意无数值：unobtainable + 原文保留
    const proFirstParty = planOf("cursor-pro").quota.windows[0]!;
    expect(proFirstParty.amount.value).toBeNull();
    expect(proFirstParty.status).toBe("unobtainable");
    expect(proFirstParty.raw).toContain("Generous included usage");
    expect(proFirstParty.raw).toContain("Significantly more included usage");
  });

  it("Pro 2025-06 改制语义：用量制为准，请求制历史仅作来源注释", () => {
    const pro = planOf("cursor-pro");
    // 现行用量制（美元等值池）是唯一建模口径；无"请求制"额度窗口
    expect(pro.quota.quota_model).toBe("usd_equivalence");
    for (const w of pro.quota.windows) {
      expect(w.unit).not.toContain("requests");
    }
    // 改制历史出现在 Other Models 池注释中，且引用官方博客原文
    const note = pro.quota.windows[1]!.note ?? "";
    expect(note).toContain("2025-06-16");
    expect(note).toContain("500 requests");
    expect(note).toContain("2025-07-04");
    // 改制注释的来源可经 pricing-history 链追溯到官方博客
    const historyChain = collection.source_chains.find((c) => c.chain_id === "cursor-pricing-history");
    expect(historyChain?.chosen_source_id).toBe("cursor-blog-new-tier");
    const legacy = collection.unresolved_facts.find((f) => f.fact.includes("500 requests"));
    expect(legacy).toBeUndefined(); // 历史口径是已解决的事实注释，不进入 Unresolved Facts
  });

  it("Teams 年付官方数值与 Premium 5x 相对倍数：不按 5×$20 推算", () => {
    const standard = planOf("cursor-teams-standard");
    const standardAnnual = standard.price_list.find((p) => p.billing_period === "annual");
    expect(standardAnnual?.amount.value).toBe(32);
    expect(standardAnnual?.amount.source_ids).toEqual(["cursor-blog-teams-pricing"]);
    const premium = planOf("cursor-teams-premium");
    expect(premium.price_list.find((p) => p.billing_period === "monthly")?.amount.value).toBe(120);
    const premiumOtherModels = premium.quota.windows[1]!;
    expect(premiumOtherModels.amount.value).toBeNull();
    expect(JSON.stringify(premiumOtherModels.note)).toContain("5x");
    expect(JSON.stringify(collection)).toContain("5x the usage of a Standard seat");
  });

  it("个人年付：官方仅声明 20% 折扣，具体月单价标记 LOGIN_REQUIRED 而非换算", () => {
    for (const planId of ["cursor-pro", "cursor-pro-plus", "cursor-ultra"]) {
      const annual = planOf(planId).price_list.find((p) => p.billing_period === "annual");
      expect(annual?.amount.value).toBeNull();
      expect(annual?.amount.failure_code).toBe("LOGIN_REQUIRED");
      expect(annual?.status).toBe("unobtainable");
    }
    const fact = collection.unresolved_facts.find((f) => f.failure_code === "LOGIN_REQUIRED" && f.fact.includes("年付"));
    expect(fact).toBeDefined();
    expect(JSON.stringify(fact)).toContain("20% discount");
    // 换算值（16/48/160）不得作为官方价格出现
    const monthlyValues = collection.plans.flatMap((p) => p.price_list.map((e) => e.amount.value));
    expect(monthlyValues).not.toContain(16);
    expect(monthlyValues).not.toContain(48);
    expect(monthlyValues).not.toContain(160);
  });

  it("五维地区可用性：iOS 内购排除大陆落在支付/功能维度，不产生'支持中国'单一布尔", () => {
    const cn = collection.regional_availability.find((r) => r.region_code === "CN");
    expect(cn).toBeDefined();
    // 支付维度：官方明确的 iOS 渠道排除（条件性），Stripe 可用性未确认
    expect(cn!.payment.state).toBe("officially_conditional");
    expect(cn!.payment.evidence_raw).toContain("everywhere except mainland China");
    expect(cn!.payment.status).toBe("verified");
    // 注册/网络：无官方声明 → unconfirmed，不猜测
    expect(cn!.registration.state).toBe("unconfirmed");
    expect(cn!.network_access.state).toBe("unconfirmed");
    // 服务政策：通用出口管制条款（未点名大陆）→ 条件性 + 说明
    expect(cn!.service_policy.state).toBe("officially_conditional");
    expect(cn!.service_policy.evidence_raw).toContain("embargoed");
    expect(cn!.service_policy.note).toContain("未点名中国大陆");
    // 功能维度：模型级地区限制
    expect(cn!.feature_restrictions.state).toBe("officially_conditional");
    expect(cn!.feature_restrictions.evidence_raw).toContain("may not be available in your region");
    // iOS 原文同时可在顶层 payment.notes 追溯
    expect(collection.payment.notes.join("\n")).toContain("mainland China");
  });

  it("Privacy Mode / ZDR 进入 data_policy", () => {
    const pro = planOf("cursor-pro");
    expect(pro.data_policy.training_use.value).toEqual({ allowed: false });
    expect(pro.data_policy.training_use.raw).toContain("ANYSPHERE WILL NOT USE CONTENT TO TRAIN");
    expect(pro.data_policy.zdr_offered.value).toBe(true);
    expect(pro.data_policy.zdr_offered.raw).toContain("ZDR");
    expect(pro.data_policy.data_retention.value).toContain("ZDR");
    expect(pro.data_policy.data_retention.raw).toContain("Most models run under Cursor's ZDR agreements");
    // 处理位置为 partial：仅 Enterprise 驻留选项有官方声明
    expect(pro.data_policy.processing_location.status).toBe("partial");
    expect(pro.data_policy.processing_location.value).toContain("US-only");
  });

  it("Admin API 能力标记为 API_AVAILABLE：仅声明，不登录、不读取账户数据", () => {
    const fact = collection.unresolved_facts.find((f) => f.failure_code === "API_AVAILABLE");
    expect(fact).toBeDefined();
    expect(fact!.fact).toContain("Admin API");
    expect(JSON.stringify(fact)).toContain("Basic Authentication");
    expect(JSON.stringify(fact)).toContain("/teams/spend");
    expect(fact!.reason).toContain("未登录、未调用");
    // 能力声明有来源（Admin API 文档页）支撑
    const adminSource = collection.sources.find((s) => s.source_id === "cursor-docs-admin-api");
    expect(adminSource).toBeDefined();
    const usageChain = collection.source_chains.find((c) => c.chain_id === "cursor-usage-visibility");
    expect(usageChain?.chosen_source_id).toBe("cursor-docs-admin-api");
  });

  it("限时促销带生效日期：模型价促销与 TIME_DEPENDENT 到期提示可区分", () => {
    const promo = collection.promotions.find((p) => p.kind === "price");
    expect(promo).toBeDefined();
    expect(promo?.effective_until).toBe("2026-08-31");
    const fact = collection.unresolved_facts.find((f) => f.failure_code === "TIME_DEPENDENT");
    expect(fact).toBeDefined();
    expect(fact!.fact).toContain("August 31, 2026");
  });

  it("回退链与三时间戳：每条链带 attempts 与 chosen；ToS 带页面自述时间", () => {
    expect(collection.source_chains.length).toBeGreaterThanOrEqual(6);
    for (const chain of collection.source_chains) {
      expect(chain.attempts.length).toBeGreaterThanOrEqual(1);
    }
    for (const source of collection.sources) {
      expect(source.fetched_at).toBe(CAPTURED_AT);
      expect(source.url).toMatch(/^https:\/\//);
    }
    const tos = collection.sources.find((s) => s.source_id === "cursor-tos");
    expect(tos?.last_updated_at).toBe("2026-08-13");
    const helpPricing = collection.sources.find((s) => s.source_id === "cursor-help-pricing");
    expect(helpPricing?.last_updated_at).toBeNull(); // 帮助中心无页面级时间戳
    expect(helpPricing?.last_updated_note).toContain("以采集时间为准");
    // 定价历史博客带发布时间
    const newTier = collection.sources.find((s) => s.source_id === "cursor-blog-new-tier");
    expect(newTier?.last_updated_at).toBe("2025-06-16");
  });

  it("模型清单：第一方入 Cursor Models 池，第三方绑定付费档", () => {
    const composer = collection.models.find((m) => m.model_code === "composer-2.5");
    expect(composer?.availability[0]?.plans).toBe("all");
    expect(composer?.availability[0]?.raw).toContain("Cursor Models");
    const sol = collection.models.find((m) => m.model_code === "gpt-5.6-sol");
    expect(sol?.availability[0]?.plans).toContain("cursor-pro");
    expect(sol?.availability[0]?.plans).not.toContain("cursor-hobby");
    expect(sol?.availability[0]?.raw).toContain("272k");
  });

  it("确定性：同一时钟两次采集输出完全一致", async () => {
    const provider = createCursorProvider();
    const second = await provider.collect({ mode: "fixture", now: () => new Date(COLLECTED_AT) });
    expect(second).toEqual(collection);
  });
});
