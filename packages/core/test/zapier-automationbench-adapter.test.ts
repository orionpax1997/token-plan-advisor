import { beforeAll, describe, expect, it } from "vitest";
import { createZapierAutomationBenchAdapter } from "../src/adapters/zapier-automationbench/adapter.ts";
import { validateBenchmarkCollection, type BenchmarkCollection } from "../src/schema/benchmark.ts";

const CAPTURED_AT = "2026-09-08T06:35:00.000Z"; // fixture manifest captured_at
const COLLECTED_AT = "2026-09-08T08:00:00.000Z"; // 注入时钟
const PAGE_PUBLISHED = "2026-09-05T18:50:00Z"; // 页面 Published time
const PAGE_LAST_MODIFIED = "2026-09-05T18:50:56Z"; // 页面 last-modified
const BENCHMARK_VERSION = "1.0.6";

let collection: BenchmarkCollection;

beforeAll(async () => {
  const adapter = createZapierAutomationBenchAdapter();
  const result = await adapter.collect({ now: () => new Date(COLLECTED_AT) });
  const validation = validateBenchmarkCollection(result);
  if (!validation.ok) {
    throw new Error(`fixture 采集结果未通过 Benchmark Schema 校验:\n${validation.issues.join("\n")}`);
  }
  collection = validation.value;
});

/** 取私有 leaderboard 的 strict 记录。 */
function strictRecords(model: string, effort: string): BenchmarkCollection["records"] {
  return collection.records.filter(
    (r) =>
      r.raw_metric.metric_name === "task_completed_correctly" &&
      r.subject_identity.model_display_name === model &&
      r.subject_identity.reasoning_effort_or_configuration.value === effort &&
      r.record_id.startsWith("zapier-private:"),
  );
}

function partialCreditRecords(model: string, effort: string): BenchmarkCollection["records"] {
  return collection.records.filter(
    (r) =>
      r.raw_metric.metric_name === "partial_credit" &&
      r.subject_identity.model_display_name === model &&
      r.subject_identity.reasoning_effort_or_configuration.value === effort &&
      r.record_id.startsWith("zapier-private:"),
  );
}

function resourceRecordsPrivate(model: string, effort: string): BenchmarkCollection["records"] {
  return collection.records.filter(
    (r) =>
      r.raw_metric.metric_name === "cost_per_task_aggregates" &&
      r.subject_identity.model_display_name === model &&
      r.subject_identity.reasoning_effort_or_configuration.value === effort &&
      r.record_id.startsWith("zapier-private:"),
  );
}

function publicBaselineRecords(): BenchmarkCollection["records"] {
  return collection.records.filter((r) => r.record_id.startsWith("zapier-public:") && r.raw_metric.metric_name === "public_baseline_entry");
}

function publicTaskSetSummaryRecord(): BenchmarkCollection["records"][number] {
  const r = collection.records.find(
    (rec) => rec.record_id === "zapier-public:1.0.6:task_set_summary",
  );
  if (!r) throw new Error("public task set summary record not found");
  return r;
}

describe("Zapier AutomationBench 1.0.6 Adapter（fixture 快照导入）", () => {
  it("采集信封：adapter 标识、fixture 模式、采集/发布/快照三时间戳", () => {
    expect(collection.schema_version).toBe("1");
    expect(collection.collection.adapter_id).toBe("zapier-automationbench");
    expect(collection.collection.mode).toBe("fixture");
    expect(collection.collection.collected_at).toBe(COLLECTED_AT);
    expect(collection.benchmark.benchmark_id).toBe("zapier-automationbench");
    expect(collection.benchmark.benchmark_version).toBe(BENCHMARK_VERSION);
    expect(collection.benchmark.artifact_generated_at).toBe(PAGE_LAST_MODIFIED);
    const pageMeta = collection.sources.find((s) => s.source_id === "zapier-benchmarks-page-meta");
    expect(pageMeta?.fetched_at).toBe(CAPTURED_AT);
    const leaderboard = collection.sources.find((s) => s.source_id === "zapier-private-leaderboard");
    expect(leaderboard?.last_updated_at).toBe(PAGE_LAST_MODIFIED);
  });

  it("leaderboard_or_dataset_revision 标识同时包含 private held-out 与 public 600-task repo", () => {
    expect(collection.benchmark.leaderboard_or_dataset_revision).toContain("private_leaderboard");
    expect(collection.benchmark.leaderboard_or_dataset_revision).toContain("public_600_task_repo");
    expect(collection.benchmark.leaderboard_or_dataset_revision).toContain(`page_published=${PAGE_PUBLISHED}`);
  });

  it("harness 锁定为 AutomationBench runner（api mode）", () => {
    expect(collection.benchmark.harness).toContain("AutomationBench runner");
    expect(collection.benchmark.harness).toContain("api mode");
    expect(collection.benchmark.harness).toContain("max 50 steps");
    expect(collection.benchmark.maintainer).toBe("Zapier, Inc.");
  });

  it("私有 leaderboard：10 行 × 3 记录（strict + partial_credit + cost）= 30 条", () => {
    const strict = collection.records.filter(
      (r) => r.raw_metric.metric_name === "task_completed_correctly",
    );
    const partial = collection.records.filter((r) => r.raw_metric.metric_name === "partial_credit");
    const cost = collection.records.filter((r) => r.raw_metric.metric_name === "cost_per_task_aggregates");
    expect(strict).toHaveLength(10);
    expect(partial).toHaveLength(10);
    expect(cost).toHaveLength(10);
    // 全部以 zapier-private: 前缀
    for (const r of [...strict, ...partial, ...cost]) {
      expect(r.record_id.startsWith("zapier-private:")).toBe(true);
    }
  });

  it("公开 600-task 集：1 摘要 + 10 baseline 展示记录 = 11 条", () => {
    expect(publicBaselineRecords()).toHaveLength(10);
    expect(publicTaskSetSummaryRecord().record_id).toBe("zapier-public:1.0.6:task_set_summary");
  });

  it("strict all-assertions（task_completed_correctly）原样保存（GPT 6 Astra Max = 41.4%）", () => {
    const r = strictRecords("GPT-6 Astra", "max")[0]!;
    expect(r.capability).toEqual(["business_workflow_state_completion"]);
    expect(r.raw_metric.metric_value).toBeCloseTo(0.414, 6);
    expect(r.raw_metric.metric_unit).toBe("ratio");
    expect(r.raw_metric.metric_direction).toBe("higher_is_better");
    expect(r.raw_metric.numerator_and_denominator.value).toBeNull();
    expect(r.raw_metric.numerator_and_denominator.status).toBe("unobtainable");
    // CI 字段：half_width=0.005（页面声明的 1% variance 上界）+ 不假装是统计 CI 的说明
    const ci = r.raw_metric.confidence_interval_or_error.value as {
      ci_low: number;
      ci_high: number;
      half_width: number;
      method: string;
    };
    expect(ci.half_width).toBe(0.005);
    expect(ci.ci_low).toBeCloseTo(0.409, 6);
    expect(ci.ci_high).toBeCloseTo(0.419, 6);
    expect(ci.method).toContain("run-to-run variance typically within 1%");
    expect(ci.method).toContain("未公开 CI 公式");
    expect(r.confidence_status).toBe("confidence_interval_reported");
    expect(r.evidence_level).toBe("A");
    expect(r.comparability_class).toBe("direct_same_config");
    expect(r.allowed_use).toBe("scoring");
  });

  it("partial_credit 为独立字段，仅作诊断（不进 scoring）", () => {
    const r = partialCreditRecords("GPT-6 Astra", "max")[0]!;
    expect(r.raw_metric.metric_name).toBe("partial_credit");
    // partial_credit 不携带逐行数值：使用 aggregates 占位字段携带 partial_credit_value=null 表示官方未公开
    expect(r.raw_metric.metric_value).toBeUndefined();
    expect(r.raw_metric.aggregates?.partial_credit_value).toBeNull();
    expect(r.raw_metric.metric_direction).toBe("descriptive_only");
    expect(r.allowed_use).toBe("explanation");
    expect(r.comparability_class).toBe("reference_only");
    expect(r.evidence_level).toBe("B"); // README 有定义但页面未公开数值
    expect(r.confidence_status).toBe("unknown");
    // success_definition 同时包含 task_completed_correctly 与 partial_credit 描述
    expect(r.conditions.success_definition).toContain("partial_credit");
    expect(r.conditions.success_definition).toContain("task_completed_correctly");
    // 禁止推断：不得用 partial_credit 替代 strict
    expect(r.prohibited_inferences.join("\n")).toContain("partial_credit 当 headline");
  });

  it("strict 与 partial_credit 是 record_id 不同的两条独立记录（同 model+effort）", () => {
    const strict = strictRecords("GPT-6 Astra", "max")[0]!;
    const partial = partialCreditRecords("GPT-6 Astra", "max")[0]!;
    expect(strict.record_id).not.toBe(partial.record_id);
    expect(strict.record_id).toContain("task_completed_correctly");
    expect(partial.record_id).toContain("partial_credit");
  });

  it("私有 held-out leaderboard 与公开 600-task 仓库：数据集标识不可混淆", () => {
    // 不同 record_id 前缀
    const privateIds = collection.records.filter((r) => r.record_id.startsWith("zapier-private:")).length;
    const publicIds = collection.records.filter((r) => r.record_id.startsWith("zapier-public:")).length;
    expect(privateIds).toBeGreaterThan(0);
    expect(publicIds).toBeGreaterThan(0);
    // 不同 metric_space
    const strict = strictRecords("GPT-6 Astra", "max")[0]!;
    expect(strict.normalized_metric?.metric_space).toBe("zapier-automationbench:1.0.6:task_completed_correctly");
    const baseline = publicBaselineRecords()[0]!;
    expect(baseline.normalized_metric).toBeNull(); // 公开 baseline 不做归一化
    expect(baseline.normalization_method).toContain("public task set");
    expect(baseline.normalization_method).toContain("不互通");
    // prohibited_inferences 显式禁止跨两者拼接/补齐/换算
    expect(strict.prohibited_inferences.join("\n")).toContain("不得跨官方私有 held-out leaderboard 与公开 600-task 仓库");
  });

  it("Fable 5.1 + Opus 5 fallback 组合在 prohibited_inferences 中独立标注", () => {
    const fable = strictRecords("Claude Fable 5.1 + Opus 5 fallback", "max")[0]!;
    expect(fable.subject_identity.agent_or_harness).toContain("fallback combo");
    expect(fable.subject_identity.agent_or_harness).toContain("Claude Fable 5.1 with Opus 5 Fallback (Max)");
    expect(fable.prohibited_inferences.join("\n")).toContain("不得把 fallback 组合");
    expect(fable.prohibited_inferences.join("\n")).toContain("Opus 5 处理约 40% 任务");
  });

  it("Cost / task 仅归入 benchmark_resource_usage 描述性信号", () => {
    const r = resourceRecordsPrivate("GPT-6 Astra", "max")[0]!;
    expect(r.capability).toEqual(["benchmark_resource_usage"]);
    expect(r.allowed_use).toBe("explanation");
    expect(r.comparability_class).toBe("reference_only");
    expect(r.raw_metric.metric_direction).toBe("descriptive_only");
    expect(r.raw_metric.aggregates?.cost_per_task_usd).toBe(1.77);
    expect(r.prohibited_inferences.join("\n")).toContain("不得把 Cost / task 与 Plan 价格、额度、用户真实成本混算");
    expect(r.prohibited_inferences.join("\n")).toContain("fallback tokens");
  });

  it("公开 600-task 集 task set summary：n_tasks=600、6 domains、47 apps、500 endpoints", () => {
    const r = publicTaskSetSummaryRecord();
    expect(r.raw_metric.aggregates?.n_tasks).toBe(600);
    expect(r.raw_metric.aggregates?.n_domains).toBe(6);
    expect(r.raw_metric.aggregates?.simulated_apps).toBe(47);
    expect(r.raw_metric.aggregates?.api_endpoints).toBe(500);
    expect(r.allowed_use).toBe("explanation");
    expect(r.comparability_class).toBe("source_internal_normalized");
    expect(r.prohibited_inferences.join("\n")).toContain("不得把公开 600-task 仓库任务的本地分数与官方私有");
  });

  it("公开 baseline 仅登记模型展示名+vendor，不引用第三方未公开数字", () => {
    const baselines = publicBaselineRecords();
    expect(baselines).toHaveLength(10);
    // 全部 vendor 字段为 verified（来自公开 README 的 baseline 表）
    for (const r of baselines) {
      expect(r.subject_identity.vendor.status).toBe("verified");
      expect(["OpenAI", "Anthropic", "Google", "Z.ai", "Moonshot"]).toContain(r.subject_identity.vendor.value);
      // raw_metric.metric_value 必须是 undefined（不编造分数）；aggregates 占位字段值为 null
      expect(r.raw_metric.metric_value).toBeUndefined();
      expect(r.raw_metric.aggregates?.strict_pass_rate).toBeNull();
      expect(r.raw_metric.aggregates?.partial_credit).toBeNull();
      expect(r.evidence_level).toBe("B");
      expect(r.allowed_use).toBe("explanation");
    }
  });

  it("n_trials / cost 公式 / prompt bundle / 模型 snapshot 显式 null + unobtainable，进入 Unresolved Facts", () => {
    const strict = strictRecords("GPT-6 Astra", "max")[0]!;
    expect(strict.conditions.repeat_count.value).toBeNull();
    expect(strict.conditions.repeat_count.status).toBe("unobtainable");
    expect(strict.conditions.cost_and_token_metadata.cost_basis.value).toBeNull();
    expect(strict.conditions.cost_and_token_metadata.cost_basis.status).toBe("unobtainable");
    expect(strict.subject_identity.model_api_id_or_snapshot.value).toBeNull();
    expect(strict.subject_identity.model_api_id_or_snapshot.status).toBe("unobtainable");
    expect(strict.conditions.context_limit_or_context_description.value).toBeNull();

    const facts = collection.unresolved_facts.map((f) => f.fact).join("\n");
    expect(facts).toContain("私有 held-out task set 精确任务数未公开");
    expect(facts).toContain("Cost / task 的完整计算式");
    expect(facts).toContain("API model id");
    expect(facts).toContain("fallback 组合的实际组合成本");
    expect(facts).toContain("domain 结果");
  });

  it("prohibited_inferences 覆盖：Plan 成功率 / 跨 task set / effort 合并 / partial_credit / 跨 version / 模型标签反推", () => {
    const r = strictRecords("GPT-6 Astra", "max")[0]!;
    const text = r.prohibited_inferences.join("\n");
    expect(text).toContain("task_completed_correctly");
    expect(text).toContain("不得跨官方私有");
    expect(text).toContain("不得把同一 Model 的不同 effort");
    expect(text).toContain("不得把 partial_credit 当作 headline");
    expect(text).toContain("不得跨 benchmark version");
    expect(text).toContain("不得以模型展示名或结果反推");
  });

  it("来源引用与许可/访问说明保留（MIT、不覆盖第三方 API schemas、私有任务不发布）", () => {
    const ids = collection.sources.map((s) => s.source_id);
    expect(ids).toContain("zapier-benchmarks-page");
    expect(ids).toContain("zapier-private-leaderboard");
    expect(ids).toContain("zapier-private-leaderboard-domains");
    expect(ids).toContain("zapier-readme");
    expect(ids).toContain("zapier-license");
    expect(ids).toContain("zapier-public-tasks");
    expect(ids).toContain("zapier-public-baselines");
    const licenseText = collection.benchmark.license_and_access_notes.join("\n");
    expect(licenseText).toContain("MIT");
    expect(licenseText).toContain("第三方 API");
    expect(licenseText).toContain("private task set 不发布");
  });

  it("normalized_metric 只在同 dataset + 同 benchmark version 指标空间内生成", () => {
    // 私有 strict 记录 metric_space
    for (const r of collection.records) {
      if (r.raw_metric.metric_name === "task_completed_correctly") {
        expect(r.normalized_metric?.metric_space).toBe(`zapier-automationbench:${BENCHMARK_VERSION}:task_completed_correctly`);
      } else {
        expect(r.normalized_metric).toBeNull();
      }
    }
    // 公开 records 都不做归一化（无 value/metric_space）
    for (const r of collection.records.filter((rec) => rec.record_id.startsWith("zapier-public:"))) {
      expect(r.normalized_metric).toBeNull();
    }
  });
});
