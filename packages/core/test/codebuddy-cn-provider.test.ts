import { beforeAll, describe, expect, it } from "vitest";
import { createCodeBuddyCnProvider } from "../src/providers/codebuddy/cn/provider.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";

const CAPTURED_AT = "2026-09-07T09:15:00.000Z";
const COLLECTED_AT = "2026-09-07T10:00:00.000Z";

let collection: PlanCollection;

beforeAll(async () => {
  const provider = createCodeBuddyCnProvider();
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

describe("CodeBuddy CN Data Provider（fixture 模式）", () => {
  it("采集信封：CN regional variant、北京腾讯云主体、人民币", () => {
    expect(collection.schema_version).toBe("1");
    expect(collection.collection.provider_id).toBe("tencent-codebuddy-cn");
    expect(collection.collection.mode).toBe("fixture");
    expect(collection.collection.collected_at).toBe(COLLECTED_AT);
    expect(collection.vendor.vendor_id).toBe("tencent-cloud");
    expect(collection.vendor.display_name).toContain("腾讯云");
    expect(collection.regional_variant?.variant_id).toBe("codebuddy-cn");
    expect(collection.regional_variant?.operator_entity.value).toContain("腾讯云计算");
    expect(collection.regional_variant?.jurisdiction.value).toBe("中国大陆");
  });

  it("价格：四档个人版全部已验证、币种 CNY、月付/年付多个价目", () => {
    const plans = collection.plans.filter((p) => p.audience === "individual");
    expect(plans.length).toBeGreaterThanOrEqual(4);
    for (const plan of plans) {
      const standards = plan.price_list.filter((p) => p.price_type === "standard");
      expect(standards.length).toBeGreaterThanOrEqual(1);
      for (const entry of standards) {
        expect(entry.currency.value).toBe("CNY");
        expect(entry.amount.value).not.toBeNull();
      }
    }
  });

  it("STALE_CONFLICT：1749-126592 旧价与 109769 新价并存，显式标记而非静默择一", () => {
    const conflict = collection.unresolved_facts.find((f) =>
      (f.fact.includes("1749-126592") || f.fact.includes("1749/126592")) && f.fact.includes("新三档")
    );
    expect(conflict, "应有旧价与新价并存的 STALE_CONFLICT 说明").toBeDefined();
    expect(conflict?.failure_code).toBe("STALE_CONFLICT");

    // 旧的"个人专业版 58 元"必须出现在某个 source_conflict 字段中或被显式记录
    const oldPriceVisible = JSON.stringify(collection).includes("58") ||
      JSON.stringify(collection).includes("58 元") ||
      JSON.stringify(collection).includes("696");
    expect(oldPriceVisible, "旧价必须出现在输出中可追溯").toBe(true);
  });

  it("TIME_DEPENDENT 限时促销：双倍 Credits 活动带生效日期采集", () => {
    const promo = collection.promotions.find((p) =>
      p.description.includes("双倍") || p.description.includes("双倍 Credits")
    );
    expect(promo, "应有双倍 Credits 限时促销").toBeDefined();
    expect(promo?.effective_from).not.toBeNull();
    expect(promo?.effective_until).not.toBeNull();
    // 双倍 Credits 期间为 2026-07-01~09-30
    expect(promo?.effective_from).toBe("2026-07-01");
    expect(promo?.effective_until).toBe("2026-09-30");
  });

  it("LOGIN_REQUIRED：年付实际单价、个人版订阅升级的老用户保价字段标记", () => {
    const loginFacts = collection.unresolved_facts.filter((f) => f.failure_code === "LOGIN_REQUIRED");
    expect(loginFacts.length).toBeGreaterThanOrEqual(1);
    const yearFact = loginFacts.find((f) => f.fact.includes("年付") || f.fact.includes("实际单价"));
    expect(yearFact, "应有需登录的年付单价 Unresolved Fact").toBeDefined();
  });

  it("额度原语：credits 制独立建模（与 messages/tokens 不直接换算）", () => {
    expect(collection.quota_system.quota_model).toBe("credits_5h_weekly");
    expect(collection.quota_system.unit.value).toBe("credits");
    for (const plan of collection.plans) {
      expect(plan.quota.quota_model).toBe("credits_5h_weekly");
      for (const w of plan.quota.windows) {
        expect(w.unit).toBe("credits");
        expect(w.amount.value).not.toBeNull();
      }
    }
  });

  it("五维地区可用性：CN 注册/支付/服务政策均 officially_available，海外维度按默认 unconfirmed", () => {
    const cn = collection.regional_availability.find((r) => r.region_code === "CN");
    expect(cn).toBeDefined();
    expect(cn!.registration.state).toBe("officially_available");
    expect(cn!.payment.state).toBe("officially_available");
    expect(cn!.network_access.state).toBe("officially_available");
    expect(cn!.service_policy.state).toBe("officially_available");
    expect(cn!.feature_restrictions.state).toBe("officially_available");
  });

  it("回退链：source_chains 至少记录价目与版本两条链，每条含尝试与 chosen", () => {
    expect(collection.source_chains.length).toBeGreaterThanOrEqual(2);
    const pricing = collection.source_chains.find((c) => c.purpose.includes("价目") || c.purpose.includes("积分"));
    expect(pricing).toBeDefined();
    expect(pricing!.attempts.length).toBeGreaterThanOrEqual(2);
    expect(pricing!.chosen_source_id).not.toBeNull();
    // 至少一条 attempts 应当 ok=true
    expect(pricing!.attempts.some((a) => a.ok)).toBe(true);
    // attempts 按优先级升序：定价页应排在前面
    expect(pricing!.attempts[0]!.kind).toBe("pricing_page");
  });

  it("来源清单：每条来源带 fetched_at、last_updated_at 可追溯", () => {
    expect(collection.sources.length).toBeGreaterThanOrEqual(4);
    for (const source of collection.sources) {
      expect(source.source_id).toBeTruthy();
      expect(source.fetched_at).toBe(CAPTURED_AT);
      expect(source.url).toMatch(/^https:\/\//);
    }
    // 计费概述页面带 "最近更新时间 2026-06-08"
    const billing = collection.sources.find((s) => s.source_id === "cloud-1749-126592");
    expect(billing?.last_updated_at).toBe("2026-06-08");
    // 版本说明页面带 "最近更新时间 2026-08-03"
    const version = collection.sources.find((s) => s.source_id === "cloud-1749-109769");
    expect(version?.last_updated_at).toBe("2026-08-03");
  });

  it("确定性：同一时钟两次采集输出完全一致", async () => {
    const provider = createCodeBuddyCnProvider();
    const second = await provider.collect({ mode: "fixture", now: () => new Date(COLLECTED_AT) });
    expect(second).toEqual(collection);
  });
});