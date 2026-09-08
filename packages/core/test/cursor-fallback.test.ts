import { beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createCursorProvider } from "../src/providers/cursor/global/provider.ts";
import { CURSOR_SOURCES } from "../src/providers/cursor/global/sources.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";
import type { Fetcher } from "../src/providers/types.ts";

const FIXTURE_DIR = new URL("../fixtures/cursor/", import.meta.url).pathname;
const COLLECTED_AT = "2026-09-08T11:00:00.000Z";

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

describe("Cursor Data Provider（live 模式，注入抓取函数）", () => {
  let live: PlanCollection;
  let fixture: PlanCollection;

  beforeAll(async () => {
    const provider = createCursorProvider();
    live = await provider.collect({
      mode: "live",
      fetcher: fakeLiveFetcher(FIXTURE_DIR, CURSOR_SOURCES),
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
    const tos = live.sources.find((s) => s.source_id === "cursor-tos");
    expect(tos?.last_updated_at).toBe("2026-08-13");
  });

  it("JS 渲染定价页 410 时：链上记录 GONE，价目回退到帮助中心表并在字段级可见", async () => {
    const provider = createCursorProvider();
    const failingFetcher: Fetcher = async (url) => {
      if (url === "https://cursor.com/pricing") {
        return { status: 410, body: "" };
      }
      return fakeLiveFetcher(FIXTURE_DIR, CURSOR_SOURCES)(url);
    };
    const degraded = await provider.collect({
      mode: "live",
      fetcher: failingFetcher,
      now: () => new Date(COLLECTED_AT),
    });

    const pricingChain = degraded.source_chains.find((c) => c.chain_id === "cursor-pricing");
    expect(pricingChain).toBeDefined();
    expect(pricingChain!.attempts[0]).toMatchObject({
      source_id: "cursor-pricing",
      ok: false,
      http_status: 410,
      failure_code: "GONE",
    });
    expect(pricingChain!.chosen_source_id).toBe("cursor-help-pricing");

    // 字段层：Pro 月付价实际来源切换为帮助中心表（替代入口可见）
    const pro = degraded.plans.find((p) => p.plan_id === "cursor-pro")!;
    const proMonthly = pro.price_list.find((p) => p.billing_period === "monthly" && p.price_type === "standard");
    expect(proMonthly?.amount.value).toBe(20);
    expect(proMonthly?.amount.source_ids).toEqual(["cursor-help-pricing"]);
    // 定价页来源仍记录失败状态
    const pricingSource = degraded.sources.find((s) => s.source_id === "cursor-pricing");
    expect(pricingSource?.http_status).toBe(410);
    expect(pricingSource?.failure_code).toBe("GONE");
  });

  it("价目整链失败时 chosen_source_id 为 null，采集整体仍成功，其他链不受影响", async () => {
    const provider = createCursorProvider();
    const pricingUrls = new Set([
      "https://cursor.com/pricing",
      "https://cursor.com/help/account-and-billing/pricing",
      "https://cursor.com/docs/models-and-pricing",
    ]);
    const allFailingFetcher: Fetcher = async (url) => {
      if (pricingUrls.has(url)) {
        return { status: 410, body: "" };
      }
      return fakeLiveFetcher(FIXTURE_DIR, CURSOR_SOURCES)(url);
    };
    const degraded = await provider.collect({
      mode: "live",
      fetcher: allFailingFetcher,
      now: () => new Date(COLLECTED_AT),
    });

    const pricingChain = degraded.source_chains.find((c) => c.chain_id === "cursor-pricing");
    expect(pricingChain?.chosen_source_id).toBeNull();
    expect(pricingChain?.attempts.every((a) => !a.ok)).toBe(true);

    // 其他链不互相阻断
    const historyChain = degraded.source_chains.find((c) => c.chain_id === "cursor-pricing-history");
    expect(historyChain?.chosen_source_id).toBe("cursor-blog-new-tier");
    const regionalChain = degraded.source_chains.find((c) => c.chain_id === "cursor-regional");
    expect(regionalChain?.chosen_source_id).not.toBeNull();

    // 计划不删除，价目降级为 unobtainable
    const pro = degraded.plans.find((p) => p.plan_id === "cursor-pro")!;
    const proMonthly = pro.price_list.find((p) => p.billing_period === "monthly");
    expect(proMonthly?.amount.value).toBeNull();
    expect(proMonthly?.status).toBe("unobtainable");
    // 双池数值同链降级
    expect(pro.quota.windows[1]!.amount.value).toBeNull();
  });

  it("Teams 年付博客 403 时：链上记录 CF_BLOCKED 并回退到帮助中心（无年付数值则不编造）", async () => {
    const provider = createCursorProvider();
    const failingFetcher: Fetcher = async (url) => {
      if (url === "https://cursor.com/blog/teams-pricing-june-2026") {
        return { status: 403, body: "" };
      }
      return fakeLiveFetcher(FIXTURE_DIR, CURSOR_SOURCES)(url);
    };
    const degraded = await provider.collect({
      mode: "live",
      fetcher: failingFetcher,
      now: () => new Date(COLLECTED_AT),
    });

    const teamsChain = degraded.source_chains.find((c) => c.chain_id === "cursor-teams-annual");
    expect(teamsChain!.attempts[0]).toMatchObject({
      source_id: "cursor-blog-teams-pricing",
      ok: false,
      http_status: 403,
      failure_code: "CF_BLOCKED",
    });
    expect(teamsChain!.chosen_source_id).toBe("cursor-help-pricing");

    // 帮助中心表无年付数值 → 不出现 Teams 年付价目，而不是编造
    const standard = degraded.plans.find((p) => p.plan_id === "cursor-teams-standard")!;
    expect(standard.price_list.find((p) => p.billing_period === "annual")).toBeUndefined();
    // 月付不受影响
    expect(standard.price_list.find((p) => p.billing_period === "monthly")?.amount.value).toBe(40);
  });
});
