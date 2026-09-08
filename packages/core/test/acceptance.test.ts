import { beforeAll, describe, expect, it } from "vitest";
import { runCli } from "../src/cli.ts";
import type { PlanCollection } from "../src/schema/plan.ts";

/**
 * ticket 05 验收审计：跨全部 8 个 Provider 的横切不变量。
 * 单 Provider 的行为测试在各 provider.test.ts；本文件只做验收级的横切核对。
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;
/** 页面自述时间只精确到日（或带时刻），都必须是可解析的 ISO 日期开头。 */

describe("时间戳双向核对（ticket 05）", () => {
  let collections: Record<string, PlanCollection>;

  beforeAll(async () => {
    const out: string[] = [];
    const err: string[] = [];
    const code = await runCli(["collect-all"], {
      stdout: (s) => out.push(s),
      stderr: (s) => err.push(s),
    });
    expect(code).toBe(0);
    collections = (JSON.parse(out.join("")) as { collections: Record<string, PlanCollection> })
      .collections;
  });

  it("每个来源都带采集方 fetched_at（ISO 8601），同一采集内同源一致", () => {
    for (const [providerId, collection] of Object.entries(collections)) {
      expect(collection.sources.length, providerId).toBeGreaterThan(0);
      const fetchedAts = new Set(collection.sources.map((s) => s.fetched_at));
      expect(fetchedAts.size, `${providerId} 的 fetched_at 应同源`).toBe(1);
      for (const source of collection.sources) {
        expect(source.fetched_at, `${providerId}/${source.source_id}`).toMatch(ISO_DATE);
        expect(Number.isNaN(Date.parse(source.fetched_at)), source.source_id).toBe(false);
      }
    }
  });

  it("双向核对：无页面时间戳 ⟺ 显式标注「以采集时间为准」；有时间戳 ⟹ 标注页面标签", () => {
    for (const [providerId, collection] of Object.entries(collections)) {
      for (const source of collection.sources) {
        const note = source.last_updated_note ?? "";
        if (source.last_updated_at === null) {
          expect(
            note,
            `${providerId}/${source.source_id} 无页面时间戳时必须标注以采集时间为准`,
          ).toContain("以采集时间为准");
        } else {
          expect(source.last_updated_at, `${providerId}/${source.source_id}`).toMatch(ISO_DATE);
          expect(
            note,
            `${providerId}/${source.source_id} 有页面时间戳时必须标注页面标签`,
          ).toContain("页面显示");
          expect(note).not.toContain("以采集时间为准");
        }
      }
    }
  });

  it("两类时间戳并存：既有页面自述时间，也有以采集时间为准的来源（真实覆盖）", () => {
    let withStated = 0;
    let withoutStated = 0;
    for (const collection of Object.values(collections)) {
      for (const source of collection.sources) {
        if (source.last_updated_at === null) withoutStated++;
        else withStated++;
      }
    }
    expect(withStated).toBeGreaterThan(0);
    expect(withoutStated).toBeGreaterThan(0);
  });

  it("collected_at 晚于（或等于）来源 fetched_at——fixture 快照是过去的事实", () => {
    for (const [providerId, collection] of Object.entries(collections)) {
      const collected = Date.parse(collection.collection.collected_at);
      expect(Number.isNaN(collected), providerId).toBe(false);
      for (const source of collection.sources) {
        expect(
          collected,
          `${providerId}/${source.source_id} 的 collected_at 应不早于 fetched_at`,
        ).toBeGreaterThanOrEqual(Date.parse(source.fetched_at));
      }
    }
  });
});

describe("覆盖缺口如实声明（ticket 05）", () => {
  it("coverage_gaps 非空，每项缺口都给出名称与原因", async () => {
    const out: string[] = [];
    const err: string[] = [];
    const code = await runCli(["collect-all"], {
      stdout: (s) => out.push(s),
      stderr: (s) => err.push(s),
    });
    expect(code).toBe(0);
    const parsed = JSON.parse(out.join("")) as {
      coverage_gaps: { name: string; reason: string }[];
      collections: Record<string, PlanCollection>;
    };
    expect(parsed.coverage_gaps.length).toBeGreaterThanOrEqual(1);
    // general-subscription 的头部候选（Claude/Codex/Google AI 订阅）必须显式列为缺口而非静默缺席
    const names = parsed.coverage_gaps.map((g) => g.name).join("\n");
    expect(names).toContain("Claude");
    expect(names).toContain("Codex");
    expect(names).toContain("Google AI");
    for (const gap of parsed.coverage_gaps) {
      expect(gap.name.length).toBeGreaterThan(0);
      expect(gap.reason.length).toBeGreaterThan(0);
    }
  });
});
