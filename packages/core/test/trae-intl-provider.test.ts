import { beforeAll, describe, expect, it } from "vitest";
import { createTraeIntlProvider } from "../src/providers/trae/intl/provider.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";

const CAPTURED_AT = "2026-09-07T09:15:00.000Z";
const COLLECTED_AT = "2026-09-08T10:00:00.000Z";

let collection: PlanCollection;

beforeAll(async () => {
  const provider = createTraeIntlProvider();
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

describe("TRAE 国际 Data Provider（fixture 模式）", () => {
  it("采集信封：TRAE International regional_variant、ByteDance vendor_id", () => {
    expect(collection.collection.provider_id).toBe("trae-intl");
    expect(collection.collection.mode).toBe("fixture");
    expect(collection.vendor.vendor_id).toBe("bytedance-trae");
    expect(collection.regional_variant?.variant_id).toBe("trae-intl");
    // 主体未单独声明（如实标为 unobtainable，不猜测 ByteDance 单独主体）
    expect(collection.regional_variant?.operator_entity.value).toBeNull();
    expect(collection.regional_variant?.operator_entity.status).toBe("unobtainable");
  });

  it("价目：五档 Free/Lite/Pro/Pro+/Ultra 全部已验证、币种 USD、Recurring/Single/Annual 三口径", () => {
    expect(collection.plans.length).toBe(5);
    const planIds = collection.plans.map((p) => p.plan_id);
    expect(planIds).toEqual(["trae-intl-free", "trae-intl-lite", "trae-intl-pro", "trae-intl-pro-plus", "trae-intl-ultra"]);
    for (const plan of collection.plans) {
      const verifiedPrices = plan.price_list.filter(
        (p) => p.status === "verified",
      );
      expect(verifiedPrices.length, plan.plan_id).toBeGreaterThanOrEqual(1);
      for (const entry of verifiedPrices) {
        expect(entry.currency.value).toBe("USD");
      }
    }
    // Lite 档应有 3 个 verified 价目：Recurring $3 / Single $4.5 / Annual $27
    const lite = collection.plans.find((p) => p.plan_id === "trae-intl-lite")!;
    const liteAmounts = lite.price_list
      .filter((p) => p.status === "verified")
      .map((p) => p.amount.value)
      .sort((a, b) => Number(a) - Number(b));
    expect(liteAmounts).toEqual([3, 4.5, 27]);
  });

  it("额度原语：usd_equivalence（Dollar Usage）+ Bonus Usage unobtainable + On-Demand 可选附加池", () => {
    expect(collection.quota_system.quota_model).toBe("usd_equivalence");
    for (const plan of collection.plans) {
      expect(plan.quota.quota_model).toBe("usd_equivalence");
      // Basic Usage 已验证；Bonus Usage 不可获取（官方明确无数值）
      const basicUsage = plan.quota.windows.find(
        (w) => w.unit && w.unit.includes("Basic Usage"),
      );
      expect(basicUsage?.amount.status, plan.plan_id).toBe("verified");
      const bonusUsage = plan.quota.windows.find(
        (w) => w.unit && w.unit.includes("Bonus Usage"),
      );
      expect(bonusUsage?.amount.status, plan.plan_id).toBe("unobtainable");
      expect(bonusUsage?.amount.note).toContain("based on your actual use");
    }
    // On-Demand 仅 Lite 及以上有
    const free = collection.plans.find((p) => p.plan_id === "trae-intl-free")!;
    const freeOnDemand = free.quota.windows.find((w) => w.unit && w.unit.includes("On-Demand"));
    expect(freeOnDemand, "Free 档不应有 On-Demand 池").toBeUndefined();
    const pro = collection.plans.find((p) => p.plan_id === "trae-intl-pro")!;
    const proOnDemand = pro.quota.windows.find((w) => w.unit && w.unit.includes("On-Demand"));
    expect(proOnDemand, "Pro 档应有 On-Demand 池").toBeDefined();
  });

  it("Concurrent Cloud Tasks 与 Queue Priority 进入 rate_limits", () => {
    // Ultra: 20 concurrent / Fast queue
    const ultra = collection.plans.find((p) => p.plan_id === "trae-intl-ultra")!;
    expect(ultra.rate_limits.value).toContain("Fast queue");
  });

  it("STALE_CONFLICT：Pro Trial 7-day (现行) vs 14-day (2026-02-13 博客) 显式记录", () => {
    const conflict = collection.unresolved_facts.find(
      (f) => f.failure_code === "STALE_CONFLICT" && f.fact.includes("Pro Trial"),
    );
    expect(conflict, "应有 Pro Trial 时长不一致的 STALE_CONFLICT 说明").toBeDefined();
    expect(conflict?.fact).toMatch(/7.*天|14.*天/);
  });

  it("RENDER_DEPENDENT：trae.ai/pricing 客户端渲染失败，进入 Unresolved Fact", () => {
    const render = collection.unresolved_facts.find(
      (f) => f.failure_code === "RENDER_DEPENDENT",
    );
    expect(render, "应有 RENDER_DEPENDENT 标注").toBeDefined();
    expect(render?.fact).toContain("trae.ai/pricing");
    // 来源清单中 trae-intl-pricing 仍带 RENDER_DEPENDENT failure_code
    const pricingSrc = collection.sources.find((s) => s.source_id === "trae-intl-pricing");
    expect(pricingSrc?.failure_code).toBe("RENDER_DEPENDENT");
  });

  it("US 模型屏蔽（GPT/MiniMax）进入 feature_restrictions", () => {
    const globalRegion = collection.regional_availability.find(
      (r) => r.region_code === "GLOBAL",
    );
    expect(globalRegion).toBeDefined();
    expect(globalRegion!.feature_restrictions.evidence_raw).toMatch(/GPT.*MiniMax/i);
    expect(globalRegion!.feature_restrictions.state).toBe("officially_restricted");
  });

  it("五维地区可用性：CN/HK/MO/GLOBAL；TRAE 国际版明确排除中国大陆", () => {
    expect(collection.regional_availability.length).toBe(4);
    const cn = collection.regional_availability.find((r) => r.region_code === "CN")!;
    expect(cn.registration.state).toBe("officially_restricted");
    expect(cn.registration.evidence_raw).toMatch(/中国大陆/);
    expect(cn.service_policy.state).toBe("officially_restricted");
    // CN 的功能限制维度无官方针对 CN 的声明 → unconfirmed（US 屏蔽 GPT/MiniMax 属 GLOBAL/US 维度）
    expect(cn.feature_restrictions.state).toBe("unconfirmed");
    expect(cn.feature_restrictions.evidence_raw).not.toContain("United States");
    // 港澳：服务政策按付费清单口径
    const hk = collection.regional_availability.find((r) => r.region_code === "HK")!;
    const mo = collection.regional_availability.find((r) => r.region_code === "MO")!;
    expect(hk.registration.state).toBe("officially_restricted");
    expect(mo.registration.state).toBe("officially_restricted");
    // 网络可达性等未声明的维度如实标 unobtainable
    expect(cn.network_access.status).toBe("unobtainable");
  });

  it("TRAE CN/国际账号/订阅互通未声明：进入 Unresolved Fact", () => {
    const interop = collection.unresolved_facts.find(
      (f) => f.fact.includes("账号/订阅互通"),
    );
    expect(interop, "应有账号互通说明").toBeDefined();
    expect(interop?.failure_code).toBe("RENDER_DEPENDENT");
  });

  it("回退链：价目链首选文档站、定价页 attempts 仍记录", () => {
    const pricing = collection.source_chains.find((c) => c.chain_id === "trae-intl-pricing");
    expect(pricing).toBeDefined();
    // attempts 序列反映"定价页 RENDER_DEPENDENT 在前"的回退意图
    const pricingAttempts = pricing!.attempts.map((a) => a.source_id);
    expect(pricingAttempts).toContain("trae-intl-pricing");
    expect(pricingAttempts).toContain("trae-intl-plans-and-billing");
    // 实际 chosen 是文档站
    expect(pricing!.chosen_source_id).toBe("trae-intl-plans-and-billing");
  });

  it("来源清单：fetched_at、source_id、url、failure_code（定价页 RENDER_DEPENDENT）", () => {
    expect(collection.sources.length).toBeGreaterThanOrEqual(10);
    for (const source of collection.sources) {
      expect(source.fetched_at).toBe(CAPTURED_AT);
      expect(source.url).toMatch(/^https:\/\//);
    }
    const pricing = collection.sources.find((s) => s.source_id === "trae-intl-pricing");
    expect(pricing?.failure_code).toBe("RENDER_DEPENDENT");
    // 文档站 OK_MD
    const plans = collection.sources.find((s) => s.source_id === "trae-intl-plans-and-billing");
    expect(plans?.failure_code).toBe("OK_MD");
  });

  it("Legacy 计费折算（6 Fast Requests = $1 Dollar Usage）通过 legacy 链追溯", () => {
    // Legacy 计费的具体折算率不在当前 schema 字段中显式存储，但 Legacy 文档内容应被
    // 抓取（以保留改制追溯）；源 source_chains 应包含 legacy 链
    const legacy = collection.source_chains.find((c) => c.chain_id === "trae-intl-legacy-billing");
    expect(legacy).toBeDefined();
    expect(legacy?.chosen_source_id).toBe("trae-intl-billing");
  });

  it("确定性：同一时钟两次采集输出完全一致", async () => {
    const provider = createTraeIntlProvider();
    const second = await provider.collect({ mode: "fixture", now: () => new Date(COLLECTED_AT) });
    expect(second).toEqual(collection);
  });
});
