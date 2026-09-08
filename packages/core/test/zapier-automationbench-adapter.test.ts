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

function resourceRecordsPrivate(model: string, effort: string): BenchmarkCollection["records"] {
  return collection.records.filter(
    (r) =>
      r.raw_metric.metric_name === "cost_per_task_aggregates" &&
      r.subject_identity.model_display_name === model &&
      r.subject_identity.reasoning_effort_or_configuration.value === effort &&
      r.record_id.startsWith("zapier-private:"),
  );
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
    expect(collection.benchmark.leaderboard_or_dataset_revision).toContain("private_held_out");
    expect(collection.benchmark.leaderboard_or_dataset_revision).toContain("public_600_task_repo");
    expect(collection.benchmark.leaderboard_or_dataset_revision).toContain(`page_published=${PAGE_PUBLISHED}`);
  });

  it("harness 锁定为 AutomationBench runner（api mode）", () => {
    expect(collection.benchmark.harness).toContain("AutomationBench runner");
    expect(collection.benchmark.harness).toContain("api mode");
    expect(collection.benchmark.harness).toContain("max 50 steps");
    expect(collection.benchmark.maintainer).toBe("Zapier, Inc.");
  });

  it("私有 leaderboard：10 行 × 2 记录（strict + cost）= 20 条；不输出 partial_credit / public baseline record", () => {
    const strict = collection.records.filter((r) => r.raw_metric.metric_name === "task_completed_correctly");
    const cost = collection.records.filter((r) => r.raw_metric.metric_name === "cost_per_task_aggregates");
    expect(strict).toHaveLength(10);
    expect(cost).toHaveLength(10);
    // partial_credit 与 public_baseline_entry 不再作为独立 record（避免 Refused Bequest）
    expect(collection.records.find((r) => r.raw_metric.metric_name === "partial_credit")).toBeUndefined();
    expect(collection.records.find((r) => r.raw_metric.metric_name === "public_baseline_entry")).toBeUndefined();
    expect(collection.records.find((r) => r.raw_metric.metric_name === "public_task_set_summary")).toBeUndefined();
    // 全部以 zapier-private: 前缀
    for (const r of collection.records) {
      expect(r.record_id.startsWith("zapier-private:")).toBe(true);
    }
  });

  it("strict all-assertions（task_completed_correctly）原样保存（GPT 6 Astra Max = 41.4%）", () => {
    const r = strictRecords("GPT-6 Astra", "max")[0]!;
    expect(r.capability).toEqual(["business_workflow_state_completion"]);
    expect(r.raw_metric.metric_value).toBeCloseTo(0.414, 6);
    expect(r.raw_metric.metric_unit).toBe("ratio");
    expect(r.raw_metric.metric_direction).toBe("higher_is_better");
    expect(r.raw_metric.numerator_and_denominator.value).toBeNull();
    expect(r.raw_metric.numerator_and_denominator.status).toBe("unobtainable");
    // 页面未提供 CI：interval=null + confidence_status=point_estimate_only（不假装是统计 CI）
    expect(r.raw_metric.confidence_interval_or_error.value).toBeNull();
    expect(r.raw_metric.confidence_interval_or_error.status).toBe("unobtainable");
    expect(r.raw_metric.confidence_interval_or_error.note).toContain("run-to-run variance typically within 1%");
    expect(r.confidence_status).toBe("point_estimate_only");
    expect(r.evidence_level).toBe("A");
    expect(r.comparability_class).toBe("direct_same_config");
    // ticket 02 §6：Zapier 需标明数据集来源后决定 allowed_use，本批保守设为 explanation
    expect(r.allowed_use).toBe("explanation");
  });

  it("partial_credit 不作为独立 record，但保留为 success_definition 与 prohibited_inferences 的独立字段语义", () => {
    const r = strictRecords("GPT-6 Astra", "max")[0]!;
    // partial_credit 定义与诊断语义保留在 success_definition
    expect(r.conditions.success_definition).toContain("partial_credit");
    expect(r.conditions.success_definition).toContain("诊断");
    expect(r.conditions.success_definition).toContain("task_completed_correctly");
    // prohibited_inferences 显式说明 partial_credit 不是 headline
    const text = r.prohibited_inferences.join("\n");
    expect(text).toContain("partial_credit");
    expect(text).toContain("headline");
  });

  it("strict 与 cost 是 record_id 不同的两条独立记录（同 model+effort）", () => {
    const strict = strictRecords("GPT-6 Astra", "max")[0]!;
    const cost = resourceRecordsPrivate("GPT-6 Astra", "max")[0]!;
    expect(strict.record_id).not.toBe(cost.record_id);
    expect(strict.record_id).toContain("task_completed_correctly");
    expect(cost.record_id).toContain("cost_per_task");
  });

  it("私有 held-out leaderboard 与公开 600-task 仓库：数据集标识不可混淆", () => {
    // 全部 records 都是 zapier-private: 前缀（公开仓库作为 task_set.domains / license_and_access_notes）
    const recordPrefixes = new Set(collection.records.map((r) => r.record_id.split(":")[0]));
    expect(recordPrefixes.size).toBe(1);
    expect(recordPrefixes.has("zapier-private")).toBe(true);
    // task_set.domains 表达公开 6 domain × 100 tasks（不属于 record 列表，避免污染 languages 字段）
    expect(collection.task_set.domains).toHaveLength(6);
    expect(collection.task_set.domains?.[0]).toEqual({
      domain: "sales",
      n_tasks: 100,
      topics: ["CRM", "lead management", "cross-app workflows"],
    });
    // task_set.languages 留空（Zapier 不是 programming language benchmark）
    expect(collection.task_set.languages).toEqual([]);
    // prohibited_inferences 显式禁止跨两者拼接/补齐/换算
    const r = strictRecords("GPT-6 Astra", "max")[0]!;
    expect(r.prohibited_inferences.join("\n")).toContain("不得跨官方私有 held-out leaderboard 与公开 600-task 仓库");
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

  it("公开 600-task 集：以 task_set.domains 表达（6 domain × 100 tasks），不在 records 中制造空 record", () => {
    expect(collection.task_set.domains).toHaveLength(6);
    const total = collection.task_set.domains!.reduce((s, d) => s + d.n_tasks, 0);
    expect(total).toBe(600);
    // 公开 baseline 模型列表仅作 reference，在 license_and_access_notes 中以原文列出
    const licenseText = collection.benchmark.license_and_access_notes.join("\n");
    expect(licenseText).toContain("公开 600-task 仓库 README 列出 baseline 模型展示名");
    expect(licenseText).toContain("Claude Opus 5");
    expect(licenseText).toContain("GPT-5.6 Sol");
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
  });

  it("prohibited_inferences 覆盖：Plan 成功率 / 跨 task set / effort 合并 / partial_credit / 跨 version / 模型标签反推 / 下游评分决策权", () => {
    const r = strictRecords("GPT-6 Astra", "max")[0]!;
    const text = r.prohibited_inferences.join("\n");
    expect(text).toContain("task_completed_correctly");
    expect(text).toContain("不得跨官方私有");
    expect(text).toContain("不得把同一 Model 的不同 effort");
    expect(text).toContain("不得把 partial_credit 当作 headline");
    expect(text).toContain("不得跨 benchmark version");
    expect(text).toContain("不得以模型展示名或结果反推");
    // 修复 #1：把 allowed_use 决定权交给下游
    expect(text).toContain("allowed_use=explanation");
    expect(text).toContain("下游须在固定 benchmark version");
  });

  it("来源引用与许可/访问说明保留（MIT、不覆盖第三方 API schemas、私有任务不发布、公开 baseline 模型展示名）", () => {
    const ids = collection.sources.map((s) => s.source_id);
    expect(ids).toContain("zapier-benchmarks-page");
    expect(ids).toContain("zapier-private-leaderboard");
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
    // 私有 strict record metric_space
    for (const r of collection.records) {
      if (r.raw_metric.metric_name === "task_completed_correctly") {
        expect(r.normalized_metric?.metric_space).toBe(`zapier-automationbench:${BENCHMARK_VERSION}:task_completed_correctly`);
      } else {
        expect(r.normalized_metric).toBeNull();
      }
    }
  });

  it("per-row source_snapshot.revision 包含 benchmark_version + captured_at，可唯一定位", () => {
    const strict = strictRecords("GPT-6 Astra", "max")[0]!;
    const cost = resourceRecordsPrivate("GPT-6 Astra", "max")[0]!;
    expect(strict.source_snapshot.revision).toContain(`benchmark_version=${BENCHMARK_VERSION}`);
    expect(strict.source_snapshot.revision).toContain(`task_set_kind=private_held_out`);
    expect(strict.source_snapshot.revision).toContain(`captured_at=${CAPTURED_AT}`);
    expect(cost.source_snapshot.revision).toBe(strict.source_snapshot.revision);
  });
});
