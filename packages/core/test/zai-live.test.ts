import { beforeAll, describe, expect, it } from "vitest";
import { createZaiProvider } from "../src/providers/zai/provider.ts";
import { ZAI_SOURCES } from "../src/providers/zai/sources.ts";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";
import type { Fetcher } from "../src/providers/types.ts";

const FIXTURE_DIR = new URL("../fixtures/zai/", import.meta.url).pathname;
const COLLECTED_AT = "2026-09-07T11:00:00.000Z";

/** 把 fixture 快照伪装成 HTTP 响应，验证 live 路径的解析逻辑（不发起真实网络请求）。 */
function fakeLiveFetcher(): Fetcher {
  return async (url) => {
    const source = ZAI_SOURCES.find((s) => s.url === url);
    if (!source) return { status: 404, body: "" };
    const body = await readFile(join(FIXTURE_DIR, source.file), "utf8");
    return { status: 200, body };
  };
}

let live: PlanCollection;
let fixture: PlanCollection;

beforeAll(async () => {
  const provider = createZaiProvider();
  live = await provider.collect({
    mode: "live",
    fetcher: fakeLiveFetcher(),
    now: () => new Date(COLLECTED_AT),
  });
  fixture = await provider.collect({
    mode: "fixture",
    now: () => new Date(COLLECTED_AT),
  });
});

describe("z.ai Data Provider（live 模式，注入抓取函数）", () => {
  it("与 fixture 模式归一化出相同的事实（同一快照内容）", () => {
    const validation = validatePlanCollection(live);
    expect(validation.ok).toBe(true);
    // 事实一致：仅在 mode / collected_at / fetched_at 上不同
    expect(live.plans).toEqual(fixture.plans);
    expect(live.quota_system).toEqual(fixture.quota_system);
    expect(live.models).toEqual(fixture.models);
    expect(live.unresolved_facts).toEqual(fixture.unresolved_facts);
  });

  it("live 模式的三时间戳：fetched_at 来自采集时钟，页面自述时间照旧解析", () => {
    expect(live.collection.mode).toBe("live");
    for (const source of live.sources) {
      expect(source.fetched_at).toBe(COLLECTED_AT);
    }
    const privacy = live.sources.find((s) => s.source_id === "legal-privacy-policy");
    expect(privacy?.last_updated_at).toBe("2025-09-29");
  });

  it("单来源 404 不中断采集：记录 GONE 并降级相关字段", async () => {
    const provider = createZaiProvider();
    const failingFetcher: Fetcher = async (url) => {
      if (url.includes("legal-agreement/terms-of-use")) return { status: 404, body: "" };
      return fakeLiveFetcher()(url);
    };
    const degraded = await provider.collect({
      mode: "live",
      fetcher: failingFetcher,
      now: () => new Date(COLLECTED_AT),
    });
    const terms = degraded.sources.find((s) => s.source_id === "legal-terms-of-use");
    expect(terms?.failure_code).toBe("GONE");
    expect(terms?.http_status).toBe(404);
    // 依赖该来源的出口管制证据随之缺失，但采集整体仍然成功
    const cn = degraded.regional_availability.find((r) => r.region_code === "CN");
    expect(cn?.service_policy.evidence_raw).toBeUndefined();
    expect(degraded.plans).toHaveLength(5);
  });

  it("单来源网络异常不中断采集", async () => {
    const provider = createZaiProvider();
    const throwingFetcher: Fetcher = async (url) => {
      if (url.includes("devpack/teamplan")) throw new Error("ECONNRESET");
      return fakeLiveFetcher()(url);
    };
    const degraded = await provider.collect({
      mode: "live",
      fetcher: throwingFetcher,
      now: () => new Date(COLLECTED_AT),
    });
    const teamplan = degraded.sources.find((s) => s.source_id === "devpack-teamplan");
    expect(teamplan?.failure_code).toBe("CF_BLOCKED");
    // 团队席位配额降级为未知
    const premium = degraded.plans.find((p) => p.plan_id === "zai-glm-team-premium-seat");
    expect(premium?.quota.windows[0]?.amount.status).toBe("unobtainable");
  });
});
