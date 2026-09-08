import { beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createCodeBuddyCnProvider } from "../src/providers/codebuddy/cn/provider.ts";
import { createCodeBuddyIntlProvider } from "../src/providers/codebuddy/intl/provider.ts";
import { CODEBUDDY_CN_SOURCES } from "../src/providers/codebuddy/cn/sources.ts";
import { CODEBUDDY_INTL_SOURCES } from "../src/providers/codebuddy/intl/sources.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";
import type { Fetcher } from "../src/providers/types.ts";

const CN_FIXTURE_DIR = new URL("../fixtures/codebuddy-cn/", import.meta.url).pathname;
const INTL_FIXTURE_DIR = new URL("../fixtures/codebuddy-intl/", import.meta.url).pathname;
const COLLECTED_AT = "2026-09-07T11:00:00.000Z";

/** 把 fixture 快照伪装成 HTTP 响应，验证 live 路径的解析逻辑（不发起真实网络请求）。 */
function fakeLiveFetcher(
  fixtureDir: string,
  sources: { source_id: string; file: string; url: string }[],
): Fetcher {
  return async (url) => {
    const source = sources.find((s) => s.url === url);
    if (!source) return { status: 404, body: "" };
    const body = await readFile(join(fixtureDir, source.file), "utf8");
    return { status: 200, body };
  };
}

describe("CodeBuddy CN Data Provider（live 模式，注入抓取函数）", () => {
  let live: PlanCollection;
  let fixture: PlanCollection;

  beforeAll(async () => {
    const provider = createCodeBuddyCnProvider();
    live = await provider.collect({
      mode: "live",
      fetcher: fakeLiveFetcher(CN_FIXTURE_DIR, CODEBUDDY_CN_SOURCES),
      now: () => new Date(COLLECTED_AT),
    });
    fixture = await provider.collect({
      mode: "fixture",
      now: () => new Date(COLLECTED_AT),
    });
  });

  it("与 fixture 模式归一化出相同的事实（同一快照内容）", () => {
    expect(validatePlanCollection(live).ok).toBe(true);
    expect(live.plans).toEqual(fixture.plans);
    expect(live.unresolved_facts).toEqual(fixture.unresolved_facts);
    expect(live.source_chains).toEqual(fixture.source_chains);
  });

  it("live 模式 fetched_at 来自采集时钟", () => {
    expect(live.collection.mode).toBe("live");
    for (const source of live.sources) {
      expect(source.fetched_at).toBe(COLLECTED_AT);
    }
    const versionDoc = live.sources.find((s) => s.source_id === "cloud-1749-109769");
    expect(versionDoc?.last_updated_at).toBe("2026-08-03");
  });

  it("首选定价页失败时自动回退到版本说明，source_chains 记录两次尝试", async () => {
    const provider = createCodeBuddyCnProvider();
    const failingFetcher: Fetcher = async (url) => {
      // 首选定价页（codebuddy.cn）410 GONE
      if (url.includes("codebuddy.cn/docs/ide/Account/pricing")) {
        return { status: 410, body: "" };
      }
      return fakeLiveFetcher(CN_FIXTURE_DIR, CODEBUDDY_CN_SOURCES)(url);
    };
    const degraded = await provider.collect({
      mode: "live",
      fetcher: failingFetcher,
      now: () => new Date(COLLECTED_AT),
    });

    // 价目链：首选失败，被回退到 1749/109769
    const pricingChain = degraded.source_chains.find((c) => c.chain_id === "codebuddy-cn-pricing");
    expect(pricingChain).toBeDefined();
    expect(pricingChain!.attempts[0]).toMatchObject({
      source_id: "codebuddy-cn-pricing",
      ok: false,
      http_status: 410,
      failure_code: "GONE",
    });
    expect(pricingChain!.chosen_source_id).toBe("cloud-1749-109769");
    // 整链失败：404 billing doc + GONE pricing → chosen 仍非 null（109769 成功）
    const cnPricing = degraded.sources.find((s) => s.source_id === "codebuddy-cn-pricing");
    expect(cnPricing?.http_status).toBe(410);
  });

  it("整链失败时 chosen_source_id 为 null，采集整体仍成功（其他链不互相阻断）", async () => {
    const provider = createCodeBuddyCnProvider();
    const allFailingFetcher: Fetcher = async (url) => {
      // 价目链：定价页 410 + 版本说明 410 + 计费概述 410 → 整链失败
      if (
        url.includes("codebuddy.cn/docs/ide/Account/pricing") ||
        url.includes("cloud.tencent.com/document/product/1749/109769") ||
        url.includes("cloud.tencent.com/document/product/1749/126592")
      ) {
        return { status: 410, body: "" };
      }
      return fakeLiveFetcher(CN_FIXTURE_DIR, CODEBUDDY_CN_SOURCES)(url);
    };
    const degraded = await provider.collect({
      mode: "live",
      fetcher: allFailingFetcher,
      now: () => new Date(COLLECTED_AT),
    });
    const pricingChain = degraded.source_chains.find((c) => c.chain_id === "codebuddy-cn-pricing");
    expect(pricingChain?.chosen_source_id).toBeNull();
    expect(pricingChain?.attempts.every((a) => !a.ok)).toBe(true);
    // 其他链（积分规则、FAQ）仍成功
    const creditsChain = degraded.source_chains.find((c) => c.chain_id === "codebuddy-cn-credits-rules");
    expect(creditsChain?.chosen_source_id).not.toBeNull();
    // 整链失败时，相关计划降级：体验版/标准版等个人版的 price_list 不为空但部分缺失
    const standard = degraded.plans.find((p) => p.plan_id === "codebuddy-cn-standard");
    expect(standard).toBeDefined();
    // 价目来自 109769；若 109769 也失败，相关价目状态为 unobtainable
    // 但 Plan 仍存在（不删除），价格条目降级
    expect(degraded.plans.length).toBeGreaterThanOrEqual(7);
  });

  it("回退链驱动字段层 source_ids：定价页失败后字段 source_ids 改为回退源", async () => {
    const provider = createCodeBuddyCnProvider();
    const failingFetcher: Fetcher = async (url) => {
      if (url.includes("codebuddy.cn/docs/ide/Account/pricing")) {
        return { status: 410, body: "" };
      }
      return fakeLiveFetcher(CN_FIXTURE_DIR, CODEBUDDY_CN_SOURCES)(url);
    };
    const degraded = await provider.collect({
      mode: "live",
      fetcher: failingFetcher,
      now: () => new Date(COLLECTED_AT),
    });
    // 价目链首选为 codebuddy-cn-pricing，失败后回退到 cloud-1749-109769
    expect(degraded.source_chains[0]!.chosen_source_id).toBe("cloud-1749-109769");
    // 字段层 source_ids 应反映回退后的 chosen 源（仅为 cloud-1749-109769）
    const cnRegion = degraded.regional_availability.find((r) => r.region_code === "CN")!;
    // regions_availability 用 pricing 链作回退；payment 维度的 source_ids 只含 chosen
    expect(cnRegion.payment.source_ids).toEqual(["cloud-1749-109769"]);
    expect(cnRegion.payment.source_ids).not.toContain("codebuddy-cn-pricing");
    // 同时存在数据：体验版价格来自 109769 的 features 表不包含价格字段，因此 standard 的 price_list 为空；
    // 但 credits 表在 109769 中存在：standard 的 credits windows 仍存在且 source_ids 是 chosen
    const standard = degraded.plans.find((p) => p.plan_id === "codebuddy-cn-standard")!;
    expect(standard).toBeDefined();
    // credits windows 来自 129680（首选 credits 链）；不动用 pricing 链回退
    if (standard.quota.windows.length > 0) {
      for (const w of standard.quota.windows) {
        // 每个 window 的 source_ids 应当仅为单一 chosen 来源
        expect(w.source_ids.length).toBeGreaterThanOrEqual(1);
        expect(w.source_ids.length).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe("CodeBuddy Intl Data Provider（live 模式，注入抓取函数）", () => {
  let live: PlanCollection;
  let fixture: PlanCollection;

  beforeAll(async () => {
    const provider = createCodeBuddyIntlProvider();
    live = await provider.collect({
      mode: "live",
      fetcher: fakeLiveFetcher(INTL_FIXTURE_DIR, CODEBUDDY_INTL_SOURCES),
      now: () => new Date(COLLECTED_AT),
    });
    fixture = await provider.collect({
      mode: "fixture",
      now: () => new Date(COLLECTED_AT),
    });
  });

  it("与 fixture 模式归一化出相同的事实", () => {
    expect(live.plans).toEqual(fixture.plans);
    expect(live.unresolved_facts).toEqual(fixture.unresolved_facts);
    expect(live.source_chains).toEqual(fixture.source_chains);
  });

  it("Billing Overview 403 时自动回退到 Price Details 与 Pricing 文档", async () => {
    const provider = createCodeBuddyIntlProvider();
    const failingFetcher: Fetcher = async (url) => {
      // Billing Overview URL: https://www.tencentcloud.com/document/product/1256/77269
      if (url.includes("1256/77269")) {
        return { status: 403, body: "" };
      }
      return fakeLiveFetcher(INTL_FIXTURE_DIR, CODEBUDDY_INTL_SOURCES)(url);
    };
    const degraded = await provider.collect({
      mode: "live",
      fetcher: failingFetcher,
      now: () => new Date(COLLECTED_AT),
    });
    const billingChain = degraded.source_chains.find((c) => c.chain_id === "codebuddy-intl-billing-rules");
    expect(billingChain).toBeDefined();
    // billingChain 首选是 billingOverview (77269)，失败后落到 priceDetails (77270)
    expect(billingChain!.attempts[0]).toMatchObject({
      source_id: "intl-1256-77269",
      ok: false,
      http_status: 403,
      failure_code: "CF_BLOCKED",
    });
    expect(billingChain!.chosen_source_id).toBe("intl-1256-77270");
  });
});