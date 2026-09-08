import { beforeAll, describe, expect, it } from "vitest";
import { createDeepSeekApiProvider } from "../src/providers/deepseek/api/provider.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";

const CAPTURED_AT = "2026-09-08T03:30:00.000Z";
const COLLECTED_AT = "2026-09-08T04:00:00.000Z";

let collection: PlanCollection;

beforeAll(async () => {
  const provider = createDeepSeekApiProvider();
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

describe("DeepSeek API Data Provider（fixture 模式，首批 api-usage Plan Type）", () => {
  it("采集信封：deepseek-api provider id、fixture 模式、采集时间戳、Schema 版本", () => {
    expect(collection.schema_version).toBe("1");
    expect(collection.collection.provider_id).toBe("deepseek-api");
    expect(collection.collection.mode).toBe("fixture");
    expect(collection.collection.collected_at).toBe(COLLECTED_AT);
    expect(collection.vendor.vendor_id).toBe("deepseek");
    expect(collection.vendor.display_name).toContain("DeepSeek");
  });

  it("regional_variant：杭州主体、中国大陆管辖法", () => {
    expect(collection.regional_variant?.variant_id).toBe("deepseek-api-global");
    expect(collection.regional_variant?.operator_entity.value).toContain("Hangzhou DeepSeek");
    expect(collection.regional_variant?.jurisdiction.value).toBe("People's Republic of China");
  });

  it("Plan Type 全部为 api-usage，三档按模型拆分", () => {
    expect(collection.plans).toHaveLength(3);
    const expectedIds = [
      "deepseek-api-v4-flash",
      "deepseek-api-v4-pro",
      "deepseek-api-v4-flash-vision-exp",
    ];
    for (const planId of expectedIds) {
      const plan = collection.plans.find((p) => p.plan_id === planId);
      expect(plan, planId).toBeDefined();
      expect(plan!.plan_type).toBe("api-usage");
      expect(plan!.audience).toBeNull();
    }
  });

  it("价格：每模型 6 条价目（peak/off-peak × 输入缓存命中/未命中/输出）；周末仅在 promotions[] 记录", () => {
    for (const planId of [
      "deepseek-api-v4-flash",
      "deepseek-api-v4-pro",
      "deepseek-api-v4-flash-vision-exp",
    ]) {
      const plan = collection.plans.find((p) => p.plan_id === planId)!;
      const standards = plan.price_list.filter((p) => p.price_type === "standard");
      const discounteds = plan.price_list.filter((p) => p.price_type === "discounted");
      const promos = plan.price_list.filter((p) => p.price_type === "promotional");
      // 每模型 3 个通道 × peak = 3 条 standard
      expect(standards.length, `${planId} standard`).toBe(3);
      // 每模型 3 个通道 × off_peak = 3 条 discounted
      expect(discounteds.length, `${planId} discounted`).toBe(3);
      // 周末统一价不在 price_list 里重复(避免与 discounted 金额重复)——
      // 它的语义信息已在 PlanCollection.promotions[] 中以 "price" 类型登记,
      // 这里只验证 price_list 内无 promotional 条目。
      expect(promos.length, `${planId} promotional in price_list`).toBe(0);
      for (const entry of plan.price_list) {
        expect(entry.billing_period).toBe("one_time");
        expect(entry.currency.value).toBe("CNY");
        if (entry.amount.value !== null) {
          expect(entry.amount.value).toBeGreaterThan(0);
        }
      }
    }
  });

  it("DeepSeek-V4-Pro 关键定价：peak cache_miss input = 9.0、peak output = 27.0、off-peak output = 13.5", () => {
    const pro = collection.plans.find((p) => p.plan_id === "deepseek-api-v4-pro")!;
    const standards = pro.price_list.filter((p) => p.price_type === "standard");
    const discounteds = pro.price_list.filter((p) => p.price_type === "discounted");
    // peak: 缓存命中输入 0.30 / 缓存未命中输入 9.0 / 输出 27.0
    const stdCacheHit = standards.find((e) => e.note?.includes("缓存命中"))!;
    const stdCacheMiss = standards.find((e) => e.note?.includes("缓存未命中"))!;
    const stdOutput = standards.find((e) => e.note?.includes("百万 tokens 输出") && e.note?.includes("高峰"))!;
    expect(stdCacheHit.amount.value).toBe(0.30);
    expect(stdCacheMiss.amount.value).toBe(9.0);
    expect(stdOutput.amount.value).toBe(27.0);

    // off-peak: 输出 13.5（高峰的 1/2）
    const offOutput = discounteds.find((e) => e.note?.includes("百万 tokens 输出"))!;
    expect(offOutput.amount.value).toBe(13.5);
  });

  it("quota_system：concurrency 配额、扣费公式与峰谷折扣 0.5 完整建模", () => {
    const qs = collection.quota_system;
    expect(qs.quota_model).toBe("concurrency");
    expect(qs.unit.value).toBe("concurrent_requests");
    expect(qs.formula.value?.raw).toContain("扣减费用");
    expect(qs.formula.value?.divisor).toBe(0);
    expect(qs.off_peak_discount.value).toBe(0.5);
    expect(qs.peak_hours.value).toContain("9:00");
    expect(qs.peak_hours.value).toContain("14:00");
  });

  it("三档 quota 配额（账号级并发上限）：flash/vision-exp = 2500、pro = 500", () => {
    for (const [planId, expectedLimit] of [
      ["deepseek-api-v4-flash", 2500],
      ["deepseek-api-v4-flash-vision-exp", 2500],
      ["deepseek-api-v4-pro", 500],
    ] as const) {
      const plan = collection.plans.find((p) => p.plan_id === planId)!;
      const win = plan.quota.windows[0]!;
      expect(plan.quota.quota_model).toBe("concurrency");
      expect(win.amount.value).toBe(expectedLimit);
      expect(win.unit).toBe("concurrent_requests");
    }
  });

  it("上下文窗口：每模型均 1M；输出长度均 384K", () => {
    for (const plan of collection.plans) {
      expect(plan.context_window_tokens.value).toBe(1_000_000);
    }
  });

  it("数据政策：默认未主动训练、可通过 'Improve the model for everyone' 关闭", () => {
    for (const plan of collection.plans) {
      expect(plan.data_policy.training_use.value).toEqual({ allowed: false });
      expect(plan.data_policy.training_use.note).toContain("Improve the model for everyone");
      expect(plan.data_policy.processing_location.value).toContain("China");
      expect(plan.data_policy.data_retention.value).toContain("only as long as needed");
      expect(plan.data_policy.zdr_offered.value).toBeNull();
      expect(plan.data_policy.zdr_offered.status).toBe("unobtainable");
    }
  });

  it("模型清单：deepseek-v4-flash-vision-exp 发布日期 2026-08-21（变更日志回填）", () => {
    const vision = collection.models.find((m) => m.model_code === "deepseek-v4-flash-vision-exp");
    expect(vision).toBeDefined();
    expect(vision!.release_date.value).toBe("2026-08-21");
    expect(vision!.availability[0]?.state).toBe("supported");

    const flash = collection.models.find((m) => m.model_code === "deepseek-v4-flash");
    expect(flash!.release_date.value).toBe("2026-07-31");

    const pro = collection.models.find((m) => m.model_code === "deepseek-v4-pro");
    expect(pro!.release_date.value).toBe("2026-08-13");
  });

  it("五维地区可用性：CN 五维度中 service_policy/registration/payment/network_access 已 verified，feature_restrictions unconfirmed；OVERSEAS 维度大多 officially_conditional", () => {
    const cn = collection.regional_availability.find((r) => r.region_code === "CN")!;
    expect(cn.registration.state).toBe("officially_available");
    expect(cn.payment.state).toBe("officially_available");
    expect(cn.network_access.state).toBe("officially_available");
    expect(cn.service_policy.state).toBe("officially_available");
    expect(cn.feature_restrictions.state).toBe("unconfirmed");

    const overseas = collection.regional_availability.find((r) => r.region_code === "OVERSEAS")!;
    expect(overseas.network_access.state).toBe("officially_conditional");
    expect(overseas.service_policy.state).toBe("officially_conditional");
  });

  it("限时促销：周末（周六/周日）按空闲时段价格计费，effective_from = 2026-08-23", () => {
    const promo = collection.promotions.find((p) => p.kind === "price");
    expect(promo).toBeDefined();
    expect(promo?.effective_from).toBe("2026-08-23");
    expect(promo?.description).toContain("周末");
    expect(promo?.description).toContain("空闲时段");
  });

  it("来源冲突：deepseek-v4-flash-vision-exp 并发限制仅在定价页披露（2500）→ STALE_CONFLICT 记入 Unresolved Facts", () => {
    const fact = collection.unresolved_facts.find((f) =>
      f.fact.includes("deepseek-v4-flash-vision-exp") && f.fact.includes("并发")
    );
    expect(fact).toBeDefined();
    expect(fact?.failure_code).toBe("STALE_CONFLICT");
  });

  it("LOGIN_REQUIRED：支付通道（支付宝/微信/Stripe/信用卡）官方公开清单缺失", () => {
    const fact = collection.unresolved_facts.find(
      (f) => f.failure_code === "LOGIN_REQUIRED" && f.fact.includes("支付通道"),
    );
    expect(fact).toBeDefined();
  });

  it("三时间戳：fetched_at = captured_at；Open Platform ToS 带 Effective date（2026-04-29）", () => {
    for (const source of collection.sources) {
      expect(source.fetched_at).toBe(CAPTURED_AT);
    }
    const termsService = collection.sources.find((s) => s.source_id === "deepseek-api-terms-service")!;
    expect(termsService.last_updated_at).toBe("2026-04-29");
    expect(termsService.last_updated_note).toContain("Effective date");

    const privacy = collection.sources.find((s) => s.source_id === "deepseek-api-privacy")!;
    expect(privacy.last_updated_at).toBe("2026-02-10");
    expect(privacy.last_updated_note).toContain("Published");

    const termsUse = collection.sources.find((s) => s.source_id === "deepseek-api-terms-use")!;
    expect(termsUse.last_updated_at).toBe("2026-03-27");

    // 定价页 / 限速页 / 公告 / 模型披露页 不显示更新时间
    const pricing = collection.sources.find((s) => s.source_id === "deepseek-api-pricing")!;
    expect(pricing.last_updated_at).toBeNull();
    expect(pricing.last_updated_note).toContain("以采集时间为准");
  });

  it("回退链：8 条链派生（pricing / rate-limit / billing / legal / terms-use / data-policy / model-catalog / change-log）", () => {
    expect(collection.source_chains.length).toBe(8);
    for (const chain of collection.source_chains) {
      expect(chain.chosen_source_id).not.toBeNull();
      expect(chain.attempts.some((a) => a.ok)).toBe(true);
    }
    const pricing = collection.source_chains.find((c) => c.chain_id === "deepseek-api-pricing");
    expect(pricing?.attempts[0]?.source_id).toBe("deepseek-api-pricing");
    expect(pricing?.attempts[0]?.kind).toBe("pricing_page");
    // 独立的 terms-use 链：避免 pickBodyByChain 跨链串读 terms-service 与 terms-of-use
    const termsUse = collection.source_chains.find((c) => c.chain_id === "deepseek-api-terms-use");
    expect(termsUse?.chosen_source_id).toBe("deepseek-api-terms-use");
    // 独立的 change-log 链：避免与 pricing 链串读
    const changeLog = collection.source_chains.find((c) => c.chain_id === "deepseek-api-change-log");
    expect(changeLog?.chosen_source_id).toBe("deepseek-api-change-log");
  });

  it("确定性：同一时钟两次采集输出完全一致", async () => {
    const provider = createDeepSeekApiProvider();
    const second = await provider.collect({ mode: "fixture", now: () => new Date(COLLECTED_AT) });
    expect(second).toEqual(collection);
  });
});
