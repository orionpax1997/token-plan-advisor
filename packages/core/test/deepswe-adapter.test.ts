import { beforeAll, describe, expect, it } from "vitest";
import { createDeepSweAdapter } from "../src/adapters/deepswe/adapter.ts";
import { validateBenchmarkCollection, type BenchmarkCollection } from "../src/schema/benchmark.ts";

const CAPTURED_AT = "2026-09-08T07:50:05.000Z"; // fixture manifest captured_at（快照时间，取末次抓取时点）
const COLLECTED_AT = "2026-09-08T08:00:00.000Z"; // 采集运行时间（注入时钟）
const GENERATED_AT = "2026-09-03T22:24:37.984682+00:00"; // 官方 artifact 自述生成时间（发布时间）

let collection: BenchmarkCollection;

beforeAll(async () => {
  const adapter = createDeepSweAdapter();
  const result = await adapter.collect({ now: () => new Date(COLLECTED_AT) });
  const validation = validateBenchmarkCollection(result);
  if (!validation.ok) {
    throw new Error(`fixture 采集结果未通过 Benchmark Schema 校验:\n${validation.issues.join("\n")}`);
  }
  collection = validation.value;
});

/** 按配置取记录的辅助。 */
function recordsOf(config: string): BenchmarkCollection["records"] {
  return collection.records.filter((r) => r.source_snapshot.artifact.includes(`config=${config}`));
}

describe("DeepSWE v1.1 Adapter（fixture 快照导入）", () => {
  it("采集信封：adapter 标识、fixture 模式、采集/发布/快照三时间戳", () => {
    expect(collection.schema_version).toBe("1");
    expect(collection.collection.adapter_id).toBe("deepswe");
    expect(collection.collection.mode).toBe("fixture");
    expect(collection.collection.collected_at).toBe(COLLECTED_AT);
    expect(collection.benchmark.benchmark_id).toBe("deepswe");
    expect(collection.benchmark.benchmark_version).toBe("v1.1");
    // 发布时间：官方 artifact 自述 generated_at 原样保留
    expect(collection.benchmark.artifact_generated_at).toBe(GENERATED_AT);
    // 快照时间：fixture manifest captured_at 保留在来源引用上
    const leaderboard = collection.sources.find((s) => s.source_id === "deepswe-leaderboard");
    expect(leaderboard?.fetched_at).toBe(CAPTURED_AT);
    expect(leaderboard?.last_updated_at).toBe(GENERATED_AT);
  });

  it("release、harness 与任务集事实保留（113 任务 / 91 仓库 / 语言分布）", () => {
    expect(collection.benchmark.leaderboard_or_dataset_revision).toContain("generated_at");
    expect(collection.benchmark.harness).toBe("mini-swe-agent + Pier + Modal");
    expect(collection.task_set.n_tasks).toBe(113);
    expect(collection.task_set.n_repositories).toBe(91);
    const langs = Object.fromEntries(collection.task_set.languages.map((l) => [l.language, l.n_tasks]));
    expect(langs).toEqual({ go: 34, python: 34, typescript: 35, javascript: 5, rust: 5 });
  });

  it("70 个 leaderboard 配置 × 3 条记录（pass@1 / pass@4 / 资源聚合）= 210 条", () => {
    expect(collection.records).toHaveLength(210);
    const configs = new Set(collection.records.map((r) => r.subject_identity.model_display_name + ":" + r.subject_identity.reasoning_effort_or_configuration.value));
    expect(configs.size).toBe(70);
    const astra = recordsOf("mini_swe_agent_gpt_6_astra_xhigh");
    expect(astra.map((r) => r.raw_metric.metric_name).sort()).toEqual(["cost_token_steps_duration_aggregates", "pass@1", "pass@4"]);
  });

  it("Pass@1 映射为 repository_task_completion + code_execution_correctness，分母与 CI 保留", () => {
    const pass1 = recordsOf("mini_swe_agent_gpt_6_astra_xhigh").find((r) => r.raw_metric.metric_name === "pass@1")!;
    expect(pass1.capability).toEqual(["repository_task_completion", "code_execution_correctness"]);
    expect(pass1.raw_metric.metric_value).toBe(0.7411504424778761);
    expect(pass1.raw_metric.metric_unit).toBe("ratio");
    expect(pass1.raw_metric.metric_direction).toBe("higher_is_better");
    expect(pass1.raw_metric.numerator_and_denominator.value).toEqual({ numerator: 335, denominator: 452 });
    expect(pass1.raw_metric.confidence_interval_or_error.value).toEqual({
      ci_low: 0.7124964807371247,
      ci_high: 0.7698044042186275,
      half_width: 0.02865396174075141,
      method: "95% run-to-run: SE across repeated whole-benchmark passes (1.96 * std(runs)/sqrt(R))",
    });
    expect(pass1.confidence_status).toBe("confidence_interval_reported");
    expect(pass1.evidence_level).toBe("A");
    expect(pass1.comparability_class).toBe("direct_same_config");
    expect(pass1.allowed_use).toBe("scoring");
  });

  it("Pass@4 的分母是任务数（n_tasks_passed_any / n_tasks_attempted），且不借用 pass@1 的区间", () => {
    const pass4 = recordsOf("mini_swe_agent_gpt_6_astra_xhigh").find((r) => r.raw_metric.metric_name === "pass@4")!;
    expect(pass4.raw_metric.metric_value).toBe(0.8053097345132744);
    expect(pass4.raw_metric.numerator_and_denominator.value).toEqual({ numerator: 91, denominator: 113 });
    // 官方 run-to-run 区间是 pass@1 口径（区间中心 0.7412，不覆盖 pass@4=0.8053）：
    // pass@4 必须保持 null + unobtainable，不得借用其他指标的区间（不猜测）
    expect(pass4.raw_metric.confidence_interval_or_error.value).toBeNull();
    expect(pass4.raw_metric.confidence_interval_or_error.status).toBe("unobtainable");
    expect(pass4.confidence_status).toBe("point_estimate_only");
  });

  it("normalized_metric 只在同一 DeepSWE release 的指标空间内生成，方法可追溯", () => {
    for (const record of collection.records) {
      if (record.raw_metric.metric_name === "pass@1" || record.raw_metric.metric_name === "pass@4") {
        expect(record.normalized_metric?.metric_space).toBe(`deepswe:v1.1:${record.raw_metric.metric_name}`);
        expect(record.normalized_metric?.value).toBe(record.raw_metric.metric_value);
        expect(record.normalization_method).toContain("同一 DeepSWE release");
      } else {
        expect(record.normalized_metric).toBeNull();
        expect(record.normalization_method).toContain("不与 Plan 价格");
      }
    }
  });

  it("cost/token/steps/duration 仅归入 benchmark_resource_usage 描述性信号", () => {
    const res = recordsOf("mini_swe_agent_gpt_6_astra_xhigh").find(
      (r) => r.raw_metric.metric_name === "cost_token_steps_duration_aggregates",
    )!;
    expect(res.capability).toEqual(["benchmark_resource_usage"]);
    expect(res.allowed_use).toBe("explanation");
    expect(res.comparability_class).toBe("reference_only");
    expect(res.raw_metric.metric_direction).toBe("descriptive_only");
    expect(res.raw_metric.metric_value).toBeUndefined();
    expect(res.raw_metric.aggregates?.mean_cost_usd).toBe(6.52377356460177);
    expect(res.raw_metric.aggregates?.mean_agent_steps).toBe(28.754424778761063);
    // 官方额外聚合仅部分配置携带，在场即透传（gpt-6-astra 有 compute_units）
    expect(res.raw_metric.aggregates?.mean_compute_units).toBe(752203.0973451327);
    // 该配置没有的口径则省略键（不是 null）
    const geminiRes = recordsOf("mini_swe_agent_gemini_3_8_flash_high").find(
      (r) => r.raw_metric.metric_name === "cost_token_steps_duration_aggregates",
    )!;
    expect(geminiRes.raw_metric.aggregates).not.toHaveProperty("mean_compute_units");
    expect(geminiRes.raw_metric.aggregates?.mean_cost_usd).toBe(2.362349413758389);
    // 禁止推断清单显式包含不与 Plan 价格额度混算
    expect(res.prohibited_inferences.join("\n")).toContain("与 Plan 价格、额度或用户真实成本混算");
    expect(res.prohibited_inferences.join("\n")).toContain("不得把 cost");
  });

  it("官方 provider 存在的配置 vendor 采用官方字段；缺失的配置 vendor 保持 null 不反推", () => {
    const astra = recordsOf("mini_swe_agent_gpt_6_astra_xhigh")[0]!;
    expect(astra.subject_identity.vendor).toEqual({
      value: "openai",
      status: "verified",
      source_ids: ["deepswe-leaderboard"],
    });
    const gemini = recordsOf("mini_swe_agent_gemini_3_8_flash_high")[0]!;
    expect(gemini.subject_identity.vendor.value).toBeNull();
    expect(gemini.subject_identity.vendor.status).toBe("unobtainable");
  });

  it("模型 API ID 全部保持 null（榜单标签不是不可变 API ID，不得以展示名猜）", () => {
    for (const record of collection.records) {
      expect(record.subject_identity.model_api_id_or_snapshot.value).toBeNull();
      expect(record.subject_identity.model_api_id_or_snapshot.status).toBe("unobtainable");
      // 展示名原样保留（可追溯），但不充当 API ID
      expect(record.subject_identity.model_display_name.length).toBeGreaterThan(0);
    }
  });

  it("default 配置（官方未设 effort）reasoning_effort 为 null + not_applicable", () => {
    const kimi = recordsOf("mini_swe_agent_kimi_k2_7_code_default");
    expect(kimi).toHaveLength(3);
    for (const record of kimi) {
      expect(record.subject_identity.reasoning_effort_or_configuration.value).toBeNull();
      expect(record.subject_identity.reasoning_effort_or_configuration.status).toBe("not_applicable");
    }
  });

  it("cost_basis 仅官方给出的配置 verified；其余 unobtainable（不猜测价格口径）", () => {
    const astra = recordsOf("mini_swe_agent_gpt_6_astra_xhigh")[0]!;
    expect(astra.conditions.cost_and_token_metadata.cost_basis.status).toBe("verified");
    expect(astra.conditions.cost_and_token_metadata.cost_basis.value).toContain("$12/M uncached input");
    const gemini = recordsOf("mini_swe_agent_gemini_3_8_flash_high")[0]!;
    expect(gemini.conditions.cost_and_token_metadata.cost_basis.value).toBeNull();
    expect(gemini.conditions.cost_and_token_metadata.cost_basis.status).toBe("unobtainable");
  });

  it("上下文窗口未公开：context_limit 显式 null + unobtainable，进入 Unresolved Facts", () => {
    const sample = collection.records[0]!;
    expect(sample.conditions.context_limit_or_context_description.value).toBeNull();
    expect(sample.conditions.context_limit_or_context_description.status).toBe("unobtainable");
    expect(collection.unresolved_facts.map((f) => f.fact).join("\n")).toContain("上下文窗口");
  });

  it("prohibited_inferences 覆盖：Plan 成功率 / 裸模型 / 跨 release 拼接 / effort 平均", () => {
    const pass1 = recordsOf("mini_swe_agent_gpt_6_astra_xhigh").find((r) => r.raw_metric.metric_name === "pass@1")!;
    const text = pass1.prohibited_inferences.join("\n");
    expect(text).toContain("不得把 Pass@1/Pass@4 当作任意 Coding Plan 用户成功率");
    expect(text).toContain("mini-swe-agent");
    expect(text).toContain("v1 与 v1.1");
    expect(text).toContain("reasoning effort");
  });

  it("来源引用与许可/访问说明保留", () => {
    expect(collection.sources.map((s) => s.source_id)).toEqual([
      "deepswe-release",
      "deepswe-leaderboard",
      "deepswe-tasks",
      "deepswe-readme",
      "deepswe-license",
      "deepswe-run",
    ]);
    expect(collection.benchmark.license_and_access_notes.join("\n")).toContain("Apache");
    expect(collection.benchmark.license_and_access_notes.join("\n")).toContain("deep-swe-canary");
  });

  it("provenance 差异（swe-bench-ultra vs 任务原创声明）记录为 Unresolved Fact", () => {
    const provenance = collection.unresolved_facts.find((f) => f.fact.includes("swe-bench-ultra"));
    expect(provenance).toBeDefined();
  });
});
