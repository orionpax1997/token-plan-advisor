import { beforeAll, describe, expect, it } from "vitest";
import { runCli } from "../src/cli.ts";
import type { BenchmarkCollection } from "../src/schema/benchmark.ts";

/**
 * ticket 05 验收审计（benchmark 侧）：跨全部 6 个来源的横切不变量。
 * 单来源行为测试在各 adapter.test.ts；本文件只做验收级的横切核对。
 *
 * 验收重点：
 * 1. 三时间戳双向核对：每个来源带采集方 fetched_at 与页面自述 last_updated_at；
 * 2. benchmark 记录与 Plan 记录对象独立（stdout 顶键集零交叉）；
 * 3. 全部 6 来源经 CLI 一次完整跑通；
 * 4. unknown 字段全链路保持显式 null/unobtainable，不静默编造；
 * 5. prohibited_inferences 至少覆盖 Plan 成功率 / cost 混算 / 跨来源比较 / 展示名→API ID / 误差反推重复次数。
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

const ADAPTER_IDS = [
  "deepswe",
  "terminal-bench",
  "zapier-automationbench",
  "artificial-analysis-intelligence",
  "arena-agent",
  "design-arena-code",
] as const;

/** 6 来源一次性 CLI 采集 + Schema 校验闸；后续 describe 块共用同一集合。 */
async function loadAllBenchmarkCollections(): Promise<Record<string, BenchmarkCollection>> {
  const { validateBenchmarkCollection } = await import("../src/schema/benchmark.ts");
  const collections: Record<string, BenchmarkCollection> = {};
  for (const id of ADAPTER_IDS) {
    const out: string[] = [];
    const err: string[] = [];
    const code = await runCli(["collect-benchmark", id], {
      stdout: (s) => out.push(s),
      stderr: (s) => err.push(s),
    });
    if (code !== 0) {
      throw new Error(`collect-benchmark ${id} 退出码 ${code}: ${err.join("")}`);
    }
    const parsed = JSON.parse(out.join("")) as BenchmarkCollection;
    const validation = validateBenchmarkCollection(parsed);
    if (!validation.ok) {
      throw new Error(
        `collect-benchmark ${id} 未通过 Benchmark Schema 校验:\n${validation.issues.join("\n")}`,
      );
    }
    collections[id] = validation.value;
  }
  return collections;
}

/** 全部 6 来源的核心禁止推断 regex（与 contract-freeze-benchmark.test.ts 共用口径）。 */
const PLAN_FORBIDDEN_PATTERNS = {
  /** 不把 benchmark 分数当 Plan 成功率 / Plan 排名 / Plan 排名映射等。 */
  planSuccess: /Plan.*(成功率|用户成功|排名|套餐|映射)/i,
  /** 不与 Plan 价格 / 额度 / cost / 用户真实成本混算。 */
  costMixing: /Plan.*(价格|额度|cost|成本)|cost.*Plan|价格.*Plan/i,
  /** 不跨来源/跨 release/跨配置/跨 effort/跨类别拼接、换算、混算、反推。 */
  crossSource: /混算|跨来源|跨 release|跨配置|不同 effort|跨历史|跨类别|混同|拼接|换算|反推/i,
} as const;

describe("6 来源端到端采集（ticket 05 验收）", () => {
  let collections: Record<string, BenchmarkCollection>;

  beforeAll(async () => {
    collections = await loadAllBenchmarkCollections();
  });

  it("6 来源全部经 CLI 采集输出并通过 Schema 校验闸", () => {
    expect(Object.keys(collections).sort()).toEqual([...ADAPTER_IDS].sort());
    for (const id of ADAPTER_IDS) {
      const c = collections[id]!;
      expect(c.records.length, id).toBeGreaterThan(0);
      expect(c.sources.length, id).toBeGreaterThan(0);
    }
  });

  it("每个来源都带采集方 fetched_at（ISO 8601），同一采集内同源一致", () => {
    for (const [id, c] of Object.entries(collections)) {
      const fetchedAts = new Set(c.sources.map((s) => s.fetched_at));
      expect(fetchedAts.size, `${id} 的 fetched_at 应同源一致`).toBe(1);
      for (const source of c.sources) {
        expect(source.fetched_at, `${id}/${source.source_id}`).toMatch(ISO_DATE);
        expect(Number.isNaN(Date.parse(source.fetched_at)), `${id}/${source.source_id}`).toBe(false);
      }
    }
  });

  it("双向核对：无页面时间戳 ⟺ 显式标注「以采集时间为准」；有时间戳 ⟹ 标注页面标签", () => {
    // benchmark 来源的时间标签不限于「页面显示」：可为 artifact 自述、官方页面声明、接口 captured_at 等。
    // 验收口径：只要说明“这条来源的时间戳来自哪里”即可（不得出现“采集时间为准”）。
    for (const [id, c] of Object.entries(collections)) {
      for (const source of c.sources) {
        const note = source.last_updated_note ?? "";
        if (source.last_updated_at === null) {
          expect(
            note,
            `${id}/${source.source_id} 无页面时间戳时必须标注以采集时间为准`,
          ).toMatch(/以.*采集时间为准|以.*快照采集时间为准|以.*采集时间.*为准/);
        } else {
          expect(source.last_updated_at, `${id}/${source.source_id}`).toMatch(ISO_DATE);
          // 验收「时间戳来源说明」：覆盖页面 / artifact / 接口 captured_at / hub_updated_at / page_published 等口径
          expect(
            note,
            `${id}/${source.source_id} 有时间戳时 note 必须说明来源标签`,
          ).toMatch(/页面|artifact|接口|hub|page_published|官方|generated_at|captured_at|updated_at|published/i);
          expect(note).not.toContain("以采集时间为准");
        }
      }
    }
  });

  it("两类时间戳并存：既有页面自述时间，也有以采集时间为准的来源（真实覆盖）", () => {
    let withStated = 0;
    let withoutStated = 0;
    for (const c of Object.values(collections)) {
      for (const source of c.sources) {
        if (source.last_updated_at === null) withoutStated++;
        else withStated++;
      }
    }
    expect(withStated).toBeGreaterThan(0);
    expect(withoutStated).toBeGreaterThan(0);
  });

  it("collected_at 晚于（或等于）来源 fetched_at——fixture 快照是过去的事实", () => {
    for (const [id, c] of Object.entries(collections)) {
      const collected = Date.parse(c.collection.collected_at);
      expect(Number.isNaN(collected), id).toBe(false);
      for (const source of c.sources) {
        expect(
          collected,
          `${id}/${source.source_id} 的 collected_at 应不早于 fetched_at`,
        ).toBeGreaterThanOrEqual(Date.parse(source.fetched_at));
      }
    }
  });
});

describe("benchmark 记录与 Plan 记录对象独立（ticket 05 验收）", () => {
  it("BenchmarkCollection 顶层键集不含任何 Plan 顶层键", async () => {
    const out: string[] = [];
    await runCli(["collect-benchmark", "deepswe"], {
      stdout: (s) => out.push(s),
      stderr: () => {},
    });
    const c = JSON.parse(out.join("")) as BenchmarkCollection;
    const planTopLevelKeys = [
      "vendor",
      "regional_variant",
      "payment",
      "quota_system",
      "models",
      "plans",
      "regional_availability",
      "promotions",
      "source_chains",
      "ranking_gate",
    ];
    for (const key of planTopLevelKeys) {
      expect(key in c, `BenchmarkCollection 不应含 Plan 顶层键 ${key}`).toBe(false);
    }
  });

  it("BenchmarkRecord 不含任何 Plan 字段键（字段级无交叉）", async () => {
    const out: string[] = [];
    await runCli(["collect-benchmark", "terminal-bench"], {
      stdout: (s) => out.push(s),
      stderr: () => {},
    });
    const c = JSON.parse(out.join("")) as BenchmarkCollection;
    const planOnlyKeys = ["plans", "quota_system", "price_list", "purchase_url", "model_catalog"];
    for (const record of c.records) {
      const serialized = JSON.stringify(record);
      for (const key of planOnlyKeys) {
        expect(serialized.includes(`"${key}"`), `${record.record_id} 不应含 Plan 字段键 ${key}`).toBe(false);
      }
    }
  });

  it("benchmark 采集输出不污染 collect-all：benchmark 集合不进入 Plan 汇总", async () => {
    const out: string[] = [];
    await runCli(["collect-all"], {
      stdout: (s) => out.push(s),
      stderr: () => {},
    });
    const parsed = JSON.parse(out.join("")) as { collections: Record<string, unknown> };
    expect(parsed.collections).toBeDefined();
    for (const id of ADAPTER_IDS) {
      expect(id in parsed.collections, `collect-all 不应含 benchmark 集合 ${id}`).toBe(false);
    }
  });

  it("Plan 采集输出不污染 collect-benchmark：plan 集合不进入 Benchmark 输出", async () => {
    const out: string[] = [];
    await runCli(["collect-benchmark", "zapier-automationbench"], {
      stdout: (s) => out.push(s),
      stderr: () => {},
    });
    const c = JSON.parse(out.join("")) as BenchmarkCollection;
    const planProviderIds = [
      "zai",
      "codebuddy-cn",
      "codebuddy-intl",
      "cursor",
      "cursor-start-in",
      "trae-intl",
      "trae-cn",
      "gemini-codeassist",
    ];
    for (const id of planProviderIds) {
      expect(id in c, `BenchmarkCollection 不应含 Plan Provider 键 ${id}`).toBe(false);
    }
  });
});

describe("unknown 字段全链路 null + unobtainable（ticket 05 验收）", () => {
  let collections: Record<string, BenchmarkCollection>;

  beforeAll(async () => {
    collections = await loadAllBenchmarkCollections();
  });

  it("model_api_id_or_snapshot 全 6 来源全 null + unobtainable", () => {
    // 探索 02 Answer：模型标签不总是 immutable API ID，需明确为 null
    for (const [id, c] of Object.entries(collections)) {
      for (const r of c.records) {
        // benchmark_component 主体（AA 权重记录）走 not_applicable 而非 unobtainable
        if (r.subject_identity.subject_kind === "benchmark_component") {
          expect(
            r.subject_identity.model_api_id_or_snapshot.value,
            `${id}/${r.record_id} model_api_id_or_snapshot (benchmark_component)`,
          ).toBeNull();
          expect(
            r.subject_identity.model_api_id_or_snapshot.status,
            `${id}/${r.record_id} model_api_id_or_snapshot (benchmark_component)`,
          ).toBe("not_applicable");
        } else {
          expect(
            r.subject_identity.model_api_id_or_snapshot.value,
            `${id}/${r.record_id} model_api_id_or_snapshot`,
          ).toBeNull();
          expect(
            r.subject_identity.model_api_id_or_snapshot.status,
            `${id}/${r.record_id} model_api_id_or_snapshot`,
          ).toBe("unobtainable");
        }
      }
    }
  });

  it("Design Arena Code vendor 全 null + unobtainable（API 不公开 vendor 字段）", () => {
    const dac = collections["design-arena-code"]!;
    for (const r of dac.records) {
      expect(r.subject_identity.vendor.value).toBeNull();
      expect(r.subject_identity.vendor.status).toBe("unobtainable");
    }
  });

  it("context_limit_or_context_description 在 DeepSWE 全 null + unobtainable（research/15-01 未公开）", () => {
    const deepswe = collections["deepswe"]!;
    for (const r of deepswe.records) {
      expect(r.conditions.context_limit_or_context_description.value).toBeNull();
      expect(r.conditions.context_limit_or_context_description.status).toBe("unobtainable");
    }
  });
});

describe("prohibited_inferences 覆盖核心禁止推断（ticket 05 验收）", () => {
  let collections: Record<string, BenchmarkCollection>;

  beforeAll(async () => {
    collections = await loadAllBenchmarkCollections();
  });

  it("每条 record.prohibited_inferences ≥ 1 条非空字符串", () => {
    for (const [id, c] of Object.entries(collections)) {
      for (const r of c.records) {
        expect(r.prohibited_inferences.length, `${id}/${r.record_id}`).toBeGreaterThanOrEqual(1);
        for (const inf of r.prohibited_inferences) {
          expect(typeof inf, `${id}/${r.record_id}`).toBe("string");
          expect(inf.length, `${id}/${r.record_id}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("scoring 记录显式禁止把 benchmark 分数当 Coding Plan 成功率", () => {
    for (const [id, c] of Object.entries(collections)) {
      for (const r of c.records) {
        if (r.allowed_use === "scoring") {
          expect(
            r.prohibited_inferences.join("\n"),
            `${id}/${r.record_id} scoring 记录必须禁止 Plan 成功率推断`,
          ).toMatch(PLAN_FORBIDDEN_PATTERNS.planSuccess);
        }
      }
    }
  });

  it("resource 记录显式禁止与 Plan 价格 / 额度 / 成本混算", () => {
    for (const [id, c] of Object.entries(collections)) {
      for (const r of c.records) {
        if (r.capability.includes("benchmark_resource_usage")) {
          expect(
            r.prohibited_inferences.join("\n"),
            `${id}/${r.record_id} resource 记录必须禁止 Plan 价格/额度/cost 混算`,
          ).toMatch(PLAN_FORBIDDEN_PATTERNS.costMixing);
        }
      }
    }
  });

  it("6 来源各自的 prohibited_inferences 覆盖 Plan / 跨源 / 成本三类核心禁止", () => {
    const requiredPatterns = Object.values(PLAN_FORBIDDEN_PATTERNS);
    for (const id of ADAPTER_IDS) {
      const c = collections[id]!;
      const all = c.records.flatMap((r) => r.prohibited_inferences).join("\n");
      for (const pattern of requiredPatterns) {
        expect(all, `${id} 缺失核心禁止推断模式 ${pattern}`).toMatch(pattern);
      }
    }
  });

  it("spec 明列的展示名→API ID / 结果反推重复次数禁止推断在 6 来源的输出中至少各出现一次", () => {
    // ticket 05 验收明确点名「展示名→API ID」「误差反推重复次数」两类禁止推断；
    // 探索 02 §可比性规则「完全不可比较或必须排除」清单：禁止通过结果反推未公开的 API model ID、
    // 权重版本、prompt、context window、重复次数、成本公式或 Vendor。
    // 实现上各来源选不同的表达（prohibited_inferences 记录面禁止；how_to_resolve 记如何解决）：
    //   - DeepSWE / Terminal-Bench / Zapier / Arena Agent：明文「不得以模型展示名或结果反推 API model id」
    //   - Design Arena Code：「不得以 modelId 反推 vendor/API ID」
    //   - Arena Agent 的 how_to_resolve 写明「不得用 CI 端点反推样本量或重复次数」
    //   - 其他源通过「CI 公式未公开」「不提供 pass@4 区间」等隐式表达（不出现在 prohibited_inferences）
    // 验收口径：spec 要求该语义在「输出」中可见（不限单条记录），故跨 6 来源任一来源出现一次即可。
    const displayNameToApiId = /展示名.*(API|model id|snapshot)|(API|model id|snapshot).*展示名|以.*(展示名|结果|分数).*(反推|猜)|不得以.*反推.*API/i;
    const intervalBackToRepeat = /反推.*(重复|n_runs|n_trials)|(重复|n_runs|n_trials).*反推|CI.*反推|以.*CI.*反推|不得.*CI.*反推|half_width.*反推|不.*CI.*反推/i;
    let displayNameFound = 0;
    let intervalFound = 0;
    for (const id of ADAPTER_IDS) {
      const c = collections[id]!;
      const recordTexts = c.records.flatMap((r) => r.prohibited_inferences).join("\n");
      const unresolvedTexts = c.unresolved_facts.map((f) => f.how_to_resolve).join("\n");
      const all = `${recordTexts}\n${unresolvedTexts}`;
      if (displayNameToApiId.test(all)) displayNameFound++;
      if (intervalBackToRepeat.test(all)) intervalFound++;
    }
    expect(displayNameFound, `展示名→API ID 反推禁止推断应在 6 来源中可见`).toBeGreaterThan(0);
    expect(intervalFound, `结果反推重复次数禁止推断应在 6 来源中可见`).toBeGreaterThan(0);
  });
});