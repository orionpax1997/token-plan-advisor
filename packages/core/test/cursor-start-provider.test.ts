import { beforeAll, describe, expect, it } from "vitest";
import { createCursorStartInProvider } from "../src/providers/cursor/start/provider.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";

const CAPTURED_AT = "2026-09-07T14:30:00.000Z";
const COLLECTED_AT = "2026-09-08T10:30:00.000Z";

let collection: PlanCollection;

beforeAll(async () => {
  const provider = createCursorStartInProvider();
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

describe("Cursor Start（印度区域档）Data Provider（fixture 模式）", () => {
  it("采集信封：regional_variant 独立建模，不影响 USD 主体数据", () => {
    expect(collection.collection.provider_id).toBe("anysphere-cursor-start-in");
    expect(collection.vendor.vendor_id).toBe("anysphere");
    expect(collection.regional_variant?.variant_id).toBe("cursor-start-in");
    expect(collection.regional_variant?.jurisdiction.value).toBe("India");
    expect(collection.regional_variant?.jurisdiction.raw).toContain("only available in India");
    // 官方未声明独立印度主体：不猜测
    expect(collection.regional_variant?.operator_entity.value).toBeNull();
    expect(collection.regional_variant?.operator_entity.status).toBe("unobtainable");
    // 单独的采集快照，与全球版不共享 fixture
    expect(collection.sources.map((s) => s.source_id)).toEqual([
      "cursor-start-help",
      "cursor-start-blog",
      "cursor-start-regions",
    ]);
  });

  it("INR 价目：₹649/月税含价 verified，无年付编造", () => {
    const plan = collection.plans[0]!;
    expect(plan.plan_id).toBe("cursor-start");
    expect(plan.price_list.length).toBe(1);
    const monthly = plan.price_list[0]!;
    expect(monthly.amount.value).toBe(649);
    expect(monthly.currency.value).toBe("INR");
    expect(monthly.billing_period).toBe("monthly");
    expect(monthly.note).toContain("tax-inclusive");
    expect(monthly.amount.raw).toContain("₹649 per month, tax-inclusive");
  });

  it("额度原语与全球档可区分：usage_tier，非 usd_equivalence，无第三方池/on-demand", () => {
    expect(collection.quota_system.quota_model).toBe("usage_tier");
    const plan = collection.plans[0]!;
    expect(plan.quota.quota_model).toBe("usage_tier");
    const window = plan.quota.windows[0]!;
    expect(window.amount.value).toBeNull();
    expect(window.unit).toContain("first-party model usage");
    expect(window.note).toContain("不含 Other Models 美元等值池");
    expect(window.note).toContain("on-demand");
    // Grok 固定 effort 作为档位口径保留原文
    expect(plan.rate_limits.value).toContain("medium effort");
  });

  it("五维地区可用性（IN）：支付 UPI/3DS 可用；注册条件性（印度手机号）；网络条件性（反 VPN）", () => {
    const region = collection.regional_availability.find((r) => r.region_code === "IN");
    expect(region).toBeDefined();
    expect(region!.payment.state).toBe("officially_available");
    expect(region!.payment.evidence_raw).toContain("UPI");
    expect(region!.payment.evidence_raw).toContain("3D Secure");
    expect(region!.registration.state).toBe("officially_conditional");
    expect(region!.registration.evidence_raw).toContain("Indian phone number");
    expect(region!.network_access.state).toBe("officially_conditional");
    expect(region!.network_access.evidence_raw).toContain("VPN");
    expect(region!.service_policy.evidence_raw).toContain("only available in India");
    expect(region!.feature_restrictions.state).toBe("officially_conditional");
    expect(region!.feature_restrictions.evidence_raw).toContain("first-party");
  });

  it("回退链与时间戳：帮助中心→博客回退；博客发布时间入库", () => {
    const pricingChain = collection.source_chains.find((c) => c.chain_id === "cursor-start-pricing");
    expect(pricingChain?.attempts.map((a) => a.source_id)).toEqual(["cursor-start-help", "cursor-start-blog"]);
    expect(pricingChain?.chosen_source_id).toBe("cursor-start-help");
    for (const source of collection.sources) {
      expect(source.fetched_at).toBe(CAPTURED_AT);
    }
    const blog = collection.sources.find((s) => s.source_id === "cursor-start-blog");
    expect(blog?.last_updated_at).toBe("2026-07-28");
  });

  it("data_policy 不跨采集拼凑：Start 专页未披露的字段显式不可获取并指向主采集", () => {
    const policy = collection.plans[0]!.data_policy;
    expect(policy.training_use.value).toBeNull();
    expect(policy.training_use.note).toContain("anysphere-cursor");
    expect(policy.zdr_offered.value).toBeNull();
  });

  it("确定性：同一时钟两次采集输出完全一致", async () => {
    const provider = createCursorStartInProvider();
    const second = await provider.collect({ mode: "fixture", now: () => new Date(COLLECTED_AT) });
    expect(second).toEqual(collection);
  });
});
