import { beforeAll, describe, expect, it } from "vitest";
import { createTraeCnProvider } from "../src/providers/trae/cn/provider.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";

const CAPTURED_AT = "2026-09-07T09:15:00.000Z";
const COLLECTED_AT = "2026-09-08T10:00:00.000Z";

let collection: PlanCollection;

beforeAll(async () => {
  const provider = createTraeCnProvider();
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

describe("TRAE CN Data Provider（fixture 模式）", () => {
  it("采集信封：TRAE CN regional_variant、独立 vendor_id=bytedance-trae", () => {
    expect(collection.collection.provider_id).toBe("trae-cn");
    expect(collection.vendor.vendor_id).toBe("bytedance-trae");
    expect(collection.regional_variant?.variant_id).toBe("trae-cn");
    // 主体与法域：官方未声明独立 CN 主体、未发布地区政策
    expect(collection.regional_variant?.operator_entity.value).toBeNull();
    expect(collection.regional_variant?.operator_entity.status).toBe("unobtainable");
    expect(collection.regional_variant?.jurisdiction.value).toBeNull();
    expect(collection.regional_variant?.jurisdiction.status).toBe("unobtainable");
  });

  it("价格：四档 会员 Lite/Pro/Pro+/Ultra 全部已验证、币种 CNY、连续包月 discounted", () => {
    expect(collection.plans.length).toBe(4);
    const planIds = collection.plans.map((p) => p.plan_id);
    expect(planIds).toEqual(["trae-cn-lite", "trae-cn-pro", "trae-cn-pro-plus", "trae-cn-ultra"]);
    // 单月标准价
    const lite = collection.plans.find((p) => p.plan_id === "trae-cn-lite")!;
    const liteMonthly = lite.price_list.find(
      (p) => p.billing_period === "monthly" && p.price_type === "standard",
    );
    expect(liteMonthly?.amount.value).toBe(49);
    expect(liteMonthly?.currency.value).toBe("CNY");
    // 连续包月 discounted
    const liteRecurring = lite.price_list.find(
      (p) => p.billing_period === "monthly" && p.price_type === "discounted",
    );
    expect(liteRecurring?.amount.value).toBe(45);
  });

  it("首月优惠（promotional）：Lite ¥29.9 / Pro ¥69 限时首月价进入 price_list", () => {
    const lite = collection.plans.find((p) => p.plan_id === "trae-cn-lite")!;
    const litePromo = lite.price_list.find(
      (p) => p.price_type === "promotional",
    );
    expect(litePromo?.amount.value).toBe(29.9);
    expect(litePromo?.note).toContain("限时首月优惠");

    const pro = collection.plans.find((p) => p.plan_id === "trae-cn-pro")!;
    const proPromo = pro.price_list.find(
      (p) => p.price_type === "promotional",
    );
    expect(proPromo?.amount.value).toBe(69);
  });

  it("积分池：Lite 2000 Work 专属积分 / Pro 4000 / Pro+ 12000 / Ultra 40000 通用积分", () => {
    const lite = collection.plans.find((p) => p.plan_id === "trae-cn-lite")!;
    const liteWindow = lite.quota.windows.find((w) =>
      w.unit?.includes("Work 专属积分"),
    );
    expect(liteWindow?.amount.value).toBe(2000);

    const pro = collection.plans.find((p) => p.plan_id === "trae-cn-pro")!;
    const proWindow = pro.quota.windows.find((w) => w.unit?.includes("通用积分"));
    expect(proWindow?.amount.value).toBe(4000);

    const proPlus = collection.plans.find((p) => p.plan_id === "trae-cn-pro-plus")!;
    expect(
      proPlus.quota.windows.find((w) => w.unit?.includes("通用积分"))?.amount.value,
    ).toBe(12000);

    const ultra = collection.plans.find((p) => p.plan_id === "trae-cn-ultra")!;
    expect(
      ultra.quota.windows.find((w) => w.unit?.includes("通用积分"))?.amount.value,
    ).toBe(40000);
  });

  it("31 个自然日计费周期：作为窗口 anchor 信息进入 windows raw，不与自然月混淆", () => {
    // 全部 plan 的第二个 window 应携带"31 个自然日"原文
    for (const plan of collection.plans) {
      const billingWindow = plan.quota.windows.find(
        (w) => w.unit?.includes("周期") && w.status === "not_applicable",
      );
      expect(billingWindow, plan.plan_id).toBeDefined();
      expect(billingWindow?.raw).toContain("31 个自然日");
    }
  });

  it("并发云任务：Lite 2 / Pro 10 / Pro+ 10 / Ultra 20 进入 rate_limits", () => {
    const ultra = collection.plans.find((p) => p.plan_id === "trae-cn-ultra")!;
    expect(ultra.rate_limits.value).toContain("20 个云端任务并行");
    const lite = collection.plans.find((p) => p.plan_id === "trae-cn-lite")!;
    expect(lite.rate_limits.value).toContain("2 个云端任务并行");
  });

  it("设备限制 3 台：TRAE CN 文档明确，与 TRAE 国际版渲染失败页面对比", () => {
    // CN 文档明确 3 台；采集输出不需要单独字段，但应进入 Rate Limits raw 上下文
    const ultra = collection.plans.find((p) => p.plan_id === "trae-cn-ultra")!;
    expect(ultra.rate_limits.status).toBe("verified");
  });

  it("支付方式：抖音支付 + 支付宝 + 微信支付（连续包月不支持）verified", () => {
    expect(collection.payment.methods).toContain("抖音支付");
    expect(collection.payment.methods).toContain("支付宝");
    // 微信支付连续包月不支持，原文体现在 payment.notes
    expect(collection.payment.notes.some((n) => n.includes("连续包月"))).toBe(true);
  });

  it("RENDER_DEPENDENT：trae.cn/pricing 客户端渲染失败，进入 Unresolved Fact", () => {
    const render = collection.unresolved_facts.find(
      (f) => f.failure_code === "RENDER_DEPENDENT" && f.fact.includes("trae.cn/pricing"),
    );
    expect(render, "应有 trae.cn/pricing 渲染失败标注").toBeDefined();
    const pricingSrc = collection.sources.find((s) => s.source_id === "trae-cn-pricing");
    expect(pricingSrc?.failure_code).toBe("RENDER_DEPENDENT");
  });

  it("五维地区可用性：CN 条目如实标 unconfirmed（无地区政策声明）", () => {
    expect(collection.regional_availability.length).toBe(1);
    const cn = collection.regional_availability.find((r) => r.region_code === "CN")!;
    // 注册/支付：官方明确（如实 verified）
    expect(cn.registration.state).toBe("officially_available");
    expect(cn.payment.state).toBe("officially_available");
    // 网络可达性：无声明
    expect(cn.network_access.state).toBe("unconfirmed");
    expect(cn.network_access.status).toBe("unobtainable");
    // 服务政策：无声明（重要：不默认可用）
    expect(cn.service_policy.state).toBe("unconfirmed");
    expect(cn.service_policy.status).toBe("unobtainable");
    expect(cn.service_policy.note).toContain("无官方地区政策声明");
    // 功能限制：会员档位门控 verified
    expect(cn.feature_restrictions.state).toBe("officially_conditional");
    expect(cn.feature_restrictions.evidence_raw).toMatch(/Seed|DeepSeek|Kimi/);
  });

  it("TRAE CN/国际账号互通：进入 Unresolved Fact（CN 视角）", () => {
    const interop = collection.unresolved_facts.find(
      (f) => f.fact.includes("账号/订阅互通"),
    );
    expect(interop).toBeDefined();
  });

  it("回退链：价目链首选文档站、定价页 attempts 仍记录", () => {
    const pricing = collection.source_chains.find((c) => c.chain_id === "trae-cn-pricing");
    expect(pricing).toBeDefined();
    const attempts = pricing!.attempts.map((a) => a.source_id);
    expect(attempts).toContain("trae-cn-pricing");
    expect(attempts).toContain("trae-cn-plans-and-billing");
    expect(pricing!.chosen_source_id).toBe("trae-cn-plans-and-billing");
  });

  it("确定性：同一时钟两次采集输出完全一致", async () => {
    const provider = createTraeCnProvider();
    const second = await provider.collect({ mode: "fixture", now: () => new Date(COLLECTED_AT) });
    expect(second).toEqual(collection);
  });
});
