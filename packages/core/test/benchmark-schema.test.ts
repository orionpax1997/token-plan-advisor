import { describe, expect, it } from "vitest";
import {
  AllowedUses,
  BenchmarkCollection,
  CapabilityTags,
  ComparabilityClasses,
  ConfidenceStatuses,
  EvidenceLevels,
  validateBenchmarkCollection,
} from "../src/schema/benchmark.ts";

/** 构造一条最小合法 pass@1 记录（字段按 DeepSWE 官方 artifact 口径填写）。 */
function minimalRecord(overrides: Record<string, unknown> = {}) {
  return {
    record_id: "deepswe:v1.1:cfg:pass@1",
    capability: ["repository_task_completion", "code_execution_correctness"],
    raw_metric: {
      metric_name: "pass@1",
      metric_value: 0.74,
      metric_unit: "ratio",
      metric_direction: "higher_is_better",
      numerator_and_denominator: {
        value: { numerator: 335, denominator: 452 },
        status: "verified",
        source_ids: ["deepswe-leaderboard"],
      },
      confidence_interval_or_error: {
        value: { ci_low: 0.71, ci_high: 0.77, half_width: 0.03, method: "95% run-to-run" },
        status: "verified",
        source_ids: ["deepswe-leaderboard"],
      },
    },
    normalized_metric: { value: 0.74, metric_space: "deepswe:v1.1:pass@1" },
    normalization_method: "identity",
    source_snapshot: {
      source_ids: ["deepswe-leaderboard"],
      artifact: "leaderboard-live.json#rows[config=cfg]",
      revision: "generated_at=2026-09-03T22:24:37Z",
      url: "https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json",
      captured_at: "2026-09-08T07:36:23.000Z",
    },
    subject_identity: {
      subject_kind: "model_configuration",
      model_display_name: "gpt-6-astra",
      model_api_id_or_snapshot: { value: null, status: "unobtainable", source_ids: [] },
      vendor: { value: null, status: "unobtainable", source_ids: [] },
      agent_or_harness: "mini-swe-agent",
      reasoning_effort_or_configuration: {
        value: "xhigh",
        status: "verified",
        source_ids: ["deepswe-leaderboard"],
      },
    },
    conditions: {
      task_set_description: "113 tasks",
      prompt_policy: "per-task instruction.md",
      tool_environment: "mini-swe-agent + Pier + Modal",
      context_limit_or_context_description: { value: null, status: "unobtainable", source_ids: [] },
      success_definition: "f2p all pass and no p2p fail",
      repeat_count: { value: 4, status: "verified", source_ids: ["deepswe-leaderboard"] },
      cost_and_token_metadata: {
        cost_basis: { value: null, status: "unobtainable", source_ids: [] },
      },
    },
    confidence_status: "confidence_interval_reported",
    evidence_level: "A",
    comparability_class: "direct_same_config",
    allowed_use: "scoring",
    prohibited_inferences: ["不得把 Pass@1 当作任意 Coding Plan 用户成功率"],
    ...overrides,
  };
}

/** 构造一份最小合法 BenchmarkCollection。 */
function minimalCollection(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: "1",
    collection: {
      adapter_id: "deepswe",
      mode: "fixture",
      collected_at: "2026-09-08T08:00:00.000Z",
      tool_version: "0.0.0",
    },
    benchmark: {
      benchmark_id: "deepswe",
      benchmark_version: "v1.1",
      leaderboard_or_dataset_revision: "leaderboard generated_at=2026-09-03T22:24:37Z",
      maintainer: "Datacurve",
      source_url: "https://deepswe.datacurve.ai/",
      artifact_generated_at: "2026-09-03T22:24:37.984682+00:00",
      harness: "mini-swe-agent + Pier + Modal",
      license_and_access_notes: ["官方仓库 Apache-2.0"],
    },
    task_set: {
      description: "DeepSWE v1.1 任务集",
      n_tasks: 113,
      n_repositories: 91,
      languages: [{ language: "go", n_tasks: 34 }],
    },
    records: [minimalRecord()],
    sources: [
      {
        source_id: "deepswe-leaderboard",
        url: "https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json",
        kind: "leaderboard_artifact",
        fetched_at: "2026-09-08T07:36:23.000Z",
        last_updated_at: "2026-09-03T22:24:37.984682+00:00",
        last_updated_note: "artifact 自述 generated_at",
      },
    ],
    unresolved_facts: [],
    ...overrides,
  };
}

describe("Benchmark Schema v1 受控词表", () => {
  it("注册 9 类标准化能力标签（探索 02 Answer 规定的全集与顺序）", () => {
    expect([...CapabilityTags]).toEqual([
      "repository_task_completion",
      "terminal_agent_completion",
      "code_execution_correctness",
      "agent_tool_orchestration",
      "frontend_visual_preference",
      "business_workflow_state_completion",
      "long_context_understanding",
      "observed_workflow_reliability",
      "benchmark_resource_usage",
    ]);
  });

  it("证据等级 A/B/C 与可比性四级受控词表与 CONTEXT.md 领域词汇一致", () => {
    expect([...EvidenceLevels]).toEqual(["A", "B", "C"]);
    expect([...ComparabilityClasses]).toEqual([
      "direct_same_config",
      "source_internal_normalized",
      "reference_only",
      "not_comparable",
    ]);
  });

  it("allowed_use 枚举为 scoring | explanation | exclude", () => {
    expect([...AllowedUses]).toEqual(["scoring", "explanation", "exclude"]);
  });

  it("confidence_status 词表：有区间 / 仅点估计 / 未知", () => {
    expect([...ConfidenceStatuses]).toEqual([
      "confidence_interval_reported",
      "point_estimate_only",
      "unknown",
    ]);
  });
});

describe("Benchmark Schema v1 校验规则", () => {
  it("最小合法文档通过 validateBenchmarkCollection", () => {
    const result = validateBenchmarkCollection(minimalCollection());
    expect(result.ok).toBe(true);
  });

  it("capability 不在注册表内 → 拒绝", () => {
    const doc = minimalCollection();
    const record = doc.records[0] as Record<string, unknown>;
    record.capability = ["plan_success_rate"];
    const result = validateBenchmarkCollection(doc);
    expect(result.ok).toBe(false);
  });

  it("空 capability 数组 → 拒绝", () => {
    const doc = minimalCollection();
    const record = doc.records[0] as Record<string, unknown>;
    record.capability = [];
    expect(validateBenchmarkCollection(doc).ok).toBe(false);
  });

  it("evidence_level=C 的记录只能 exclude，不得进入 scoring", () => {
    const doc = minimalCollection();
    const record = doc.records[0] as Record<string, unknown>;
    record.evidence_level = "C";
    expect(validateBenchmarkCollection(doc).ok).toBe(false);
    record.allowed_use = "exclude";
    record.normalized_metric = null;
    expect(validateBenchmarkCollection(doc).ok).toBe(true);
  });

  it("evidence_level=B 不得进入 scoring（缺运行细节时不能作为严格排名依据）", () => {
    const doc = minimalCollection();
    const record = doc.records[0] as Record<string, unknown>;
    record.evidence_level = "B";
    expect(validateBenchmarkCollection(doc).ok).toBe(false);
    record.allowed_use = "explanation";
    expect(validateBenchmarkCollection(doc).ok).toBe(true);
  });

  it("benchmark_resource_usage 信号只能是 explanation（仅描述性，不进评分）", () => {
    const doc = minimalCollection();
    const record = doc.records[0] as Record<string, unknown>;
    record.capability = ["benchmark_resource_usage"];
    expect(validateBenchmarkCollection(doc).ok).toBe(false);
    record.allowed_use = "explanation";
    expect(validateBenchmarkCollection(doc).ok).toBe(true);
  });

  it("comparability_class=not_comparable 的记录必须 exclude", () => {
    const doc = minimalCollection();
    const record = doc.records[0] as Record<string, unknown>;
    record.comparability_class = "not_comparable";
    expect(validateBenchmarkCollection(doc).ok).toBe(false);
    record.allowed_use = "exclude";
    record.normalized_metric = null;
    expect(validateBenchmarkCollection(doc).ok).toBe(true);
  });

  it("confidence_status=confidence_interval_reported ⟺ 区间字段非空", () => {
    const doc = minimalCollection();
    const record = doc.records[0] as Record<string, unknown>;
    const raw = record.raw_metric as Record<string, unknown>;
    raw.confidence_interval_or_error = { value: null, status: "unobtainable", source_ids: [] };
    expect(validateBenchmarkCollection(doc).ok).toBe(false);
    record.confidence_status = "point_estimate_only";
    expect(validateBenchmarkCollection(doc).ok).toBe(true);
  });

  it("raw_metric：metric_value 与 aggregates 必须二选一非空", () => {
    const doc = minimalCollection();
    const record = doc.records[0] as Record<string, unknown>;
    record.raw_metric = {
      ...(record.raw_metric as Record<string, unknown>),
      metric_value: null,
    };
    expect(validateBenchmarkCollection(doc).ok).toBe(false);
    record.raw_metric = {
      ...(record.raw_metric as Record<string, unknown>),
      metric_value: 6.52,
      aggregates: { mean_cost_usd: 6.52 },
    };
    expect(validateBenchmarkCollection(doc).ok).toBe(false);
    delete (record.raw_metric as Record<string, unknown>).metric_value;
    (record.raw_metric as Record<string, unknown>).metric_unit = "mixed";
    (record.raw_metric as Record<string, unknown>).metric_direction = "descriptive_only";
    expect(validateBenchmarkCollection(doc).ok).toBe(true);
  });

  it("normalized_metric 的 metric_space 必须落在本文档 benchmark_id:version 的指标空间内", () => {
    const doc = minimalCollection();
    const record = doc.records[0] as Record<string, unknown>;
    record.normalized_metric = { value: 0.74, metric_space: "terminal-bench:4.0:accuracy" };
    const result = validateBenchmarkCollection(doc);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.join("\n")).toContain("指标空间");
    }
    record.normalized_metric = { value: 0.74, metric_space: "deepswe:v1.1:pass@1" };
    expect(validateBenchmarkCollection(doc).ok).toBe(true);
  });

  it("未知值包装沿用核心包约定：null 值必须配 unobtainable/not_applicable，verified 必须带 source_id", () => {
    const doc = minimalCollection();
    const record = doc.records[0] as Record<string, unknown>;
    const subject = record.subject_identity as Record<string, unknown>;
    subject.vendor = { value: "openai", status: "unobtainable", source_ids: [] };
    expect(validateBenchmarkCollection(doc).ok).toBe(false);
    subject.vendor = { value: "openai", status: "verified", source_ids: [] };
    expect(validateBenchmarkCollection(doc).ok).toBe(false);
  });

  it("sources 至少一条；schema_version 固定为 1", () => {
    expect(validateBenchmarkCollection(minimalCollection({ sources: [] })).ok).toBe(false);
    expect(validateBenchmarkCollection(minimalCollection({ schema_version: "2" })).ok).toBe(false);
  });

  it("records 至少一条", () => {
    expect(validateBenchmarkCollection(minimalCollection({ records: [] })).ok).toBe(false);
  });
});
