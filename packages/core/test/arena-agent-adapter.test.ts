import { beforeAll, describe, expect, it } from "vitest";
import { createArenaAgentAdapter } from "../src/adapters/arena-agent/adapter.ts";
import { validateBenchmarkCollection, type BenchmarkCollection } from "../src/schema/benchmark.ts";

const CAPTURED_AT = "2026-09-08T07:00:00.000Z"; // fixture manifest captured_at
const COLLECTED_AT = "2026-09-08T08:00:00.000Z"; // 注入时钟
const PAGE_UPDATED_DISPLAY = "2026-09-05"; // 页面自述更新时间
const TOTAL_SESSIONS = 2285256;
const TOTAL_MODELS = 59;

let collection: BenchmarkCollection;

beforeAll(async () => {
  const adapter = createArenaAgentAdapter();
  const result = await adapter.collect({ now: () => new Date(COLLECTED_AT) });
  const validation = validateBenchmarkCollection(result);
  if (!validation.ok) {
    throw new Error(`fixture 采集结果未通过 Benchmark Schema 校验:\n${validation.issues.join("\n")}`);
  }
  collection = validation.value;
});

/** 取某模型的 net_improvement 记录。 */
function netImprovementRecord(rank: number, slug: string): BenchmarkCollection["records"][number] {
  const r = collection.records.find((r) => r.record_id === `arena-agent:leaderboard:${rank}:${slug}:net_improvement`);
  if (!r) throw new Error(`缺少 net_improvement 记录：rank=${rank} slug=${slug}`);
  return r;
}

/** 取某模型的某组件信号记录。 */
function signalRecord(rank: number, slug: string, signal: string): BenchmarkCollection["records"][number] {
  const r = collection.records.find((r) => r.record_id === `arena-agent:leaderboard:${rank}:${slug}:${signal}`);
  if (!r) throw new Error(`缺少信号记录：rank=${rank} slug=${slug} signal=${signal}`);
  return r;
}

describe("Arena Agent Adapter（fixture 快照导入）", () => {
  it("采集信封：adapter 标识、fixture 模式、采集/发布/快照三时间戳与页面计数", () => {
    expect(collection.schema_version).toBe("1");
    expect(collection.collection.adapter_id).toBe("arena-agent");
    expect(collection.collection.mode).toBe("fixture");
    expect(collection.collection.collected_at).toBe(COLLECTED_AT);
    expect(collection.benchmark.benchmark_id).toBe("arena-agent");
    // benchmark_version = 页面自述更新时间
    expect(collection.benchmark.benchmark_version).toBe(PAGE_UPDATED_DISPLAY);
    expect(collection.benchmark.maintainer).toBe("Arena Intelligence, Inc. d/b/a Arena");
    expect(collection.benchmark.source_url).toBe("https://arena.ai/leaderboard/agent");
    // 页面只有日期粒度更新时间，没有 ISO 时刻
    expect(collection.benchmark.artifact_generated_at).toBeNull();
    // 快照时间 = fixture manifest captured_at，落在 sources[].fetched_at
    const leaderboard = collection.sources.find((s) => s.source_id === "arena-agent-leaderboard");
    expect(leaderboard?.fetched_at).toBe(CAPTURED_AT);
    expect(leaderboard?.last_updated_at).toBe(PAGE_UPDATED_DISPLAY);
  });

  it("基准事实强制保留：session 数、模型数、快照时间、baseline 漂移与无固定题集写入 revision", () => {
    const revision = collection.benchmark.leaderboard_or_dataset_revision ?? "";
    expect(revision).toContain(`sessions=${TOTAL_SESSIONS}`);
    expect(revision).toContain(`models=${TOTAL_MODELS}`);
    expect(revision).toContain("baseline_treatment_effect=true");
    expect(revision).toContain("baseline_drift=true");
    expect(revision).toContain("no_fixed_task_set=true");
    expect(revision).toContain("no_fixed_prompt=true");
    // task_set 描述里也要保留这些事实
    expect(collection.task_set.description).toContain(`${TOTAL_SESSIONS}`);
    expect(collection.task_set.description).toContain(`${TOTAL_MODELS}`);
    expect(collection.task_set.description).toContain(PAGE_UPDATED_DISPLAY);
    // 没有 n_tasks 概念
    expect(collection.task_set.n_tasks).toBe(0);
  });

  it("每条记录 evidence_level=A / comparability_class=reference_only / allowed_use=explanation，不进入严格数值排名", () => {
    for (const r of collection.records) {
      expect(r.evidence_level).toBe("A");
      expect(r.comparability_class).toBe("reference_only");
      expect(r.allowed_use).toBe("explanation");
    }
  });

  it("10 个 leaderboard 行 × 7 条记录（net_improvement + 5 信号 + resource）= 70 条", () => {
    expect(collection.records).toHaveLength(70);
    const models = new Set(
      collection.records.map((r) => r.subject_identity.model_display_name),
    );
    expect(models.size).toBe(10);
    for (const model of models) {
      const netRec = collection.records.find(
        (r) => r.subject_identity.model_display_name === model && r.raw_metric.metric_name === "net_improvement",
      );
      expect(netRec).toBeDefined();
    }
  });

  it("Net Improvement 映射为 agent_tool_orchestration；95% CI 半宽从两端点推导且明确公式未公开", () => {
    const r = netImprovementRecord(1, "gpt-6-astra");
    expect(r.capability).toEqual(["agent_tool_orchestration"]);
    expect(r.raw_metric.metric_name).toBe("net_improvement");
    expect(r.raw_metric.metric_value).toBe(0.421);
    expect(r.raw_metric.metric_unit).toBe("ratio");
    expect(r.raw_metric.metric_direction).toBe("higher_is_better");
    // 计数口径：sessions 整数 / 总 sessions 整数
    expect(r.raw_metric.numerator_and_denominator.value).toEqual({
      numerator: 412530,
      denominator: TOTAL_SESSIONS,
    });
    // CI 端点原值；半宽由两端点推导（0.434-0.408）/2 = 0.013
    const ci = r.raw_metric.confidence_interval_or_error.value as {
      ci_low: number;
      ci_high: number;
      half_width: number;
      method: string;
    };
    expect(ci.ci_low).toBe(0.408);
    expect(ci.ci_high).toBe(0.434);
    expect(ci.half_width).toBeCloseTo(0.013, 9);
    expect(ci.method).toBe("页面公开 95% 置信区间（计算公式未公开）");
    expect(r.confidence_status).toBe("confidence_interval_reported");
    // record_id / metric_space 携带快照版本（snapshot 时间戳 + page_updated）
    expect(r.normalized_metric?.metric_space).toBe(`arena-agent:${PAGE_UPDATED_DISPLAY}:net_improvement`);
    // Net Improvement = 五类信号等权聚合的归一化说明
    expect(r.normalization_method).toContain("treatment effect");
    expect(r.normalization_method).toContain("五类信号的等权聚合");
  });

  it("五类组件信号方向差异显式保留：3 条 higher_is_better + 2 条 lower_is_better，不统一换算方向", () => {
    const higherSignals = ["confirmed_success", "praise_vs_complaint", "steerability"];
    const lowerSignals = ["bash_recovery", "tool_hallucination"];
    for (const sig of higherSignals) {
      const r = signalRecord(1, "gpt-6-astra", sig);
      expect(r.raw_metric.metric_direction).toBe("higher_is_better");
      expect(r.capability).toEqual(["observed_workflow_reliability"]);
      expect(r.normalization_method).toContain("higher_is_better");
      expect(r.prohibited_inferences.join("\n")).toContain("不得把");
      expect(r.prohibited_inferences.join("\n")).toContain("lower_is_better");
    }
    for (const sig of lowerSignals) {
      const r = signalRecord(1, "gpt-6-astra", sig);
      expect(r.raw_metric.metric_direction).toBe("lower_is_better");
      expect(r.capability).toEqual(["observed_workflow_reliability"]);
      expect(r.normalization_method).toContain("lower_is_better");
      expect(r.normalization_method).toContain("原始方向");
      // metric_space 命名包含方向标识（observed_signal_lower），强制下游区分
      expect(r.normalized_metric?.metric_space).toContain("observed_signal_lower");
      expect(r.normalized_metric?.metric_space).toContain(`arena-agent:${PAGE_UPDATED_DISPLAY}:`);
    }
    // 全部组件信号记录 confidence_status=point_estimate_only（页面只对 Net Improvement 公开 CI）
    for (const sig of [...higherSignals, ...lowerSignals]) {
      const r = signalRecord(1, "gpt-6-astra", sig);
      expect(r.confidence_status).toBe("point_estimate_only");
      expect(r.raw_metric.confidence_interval_or_error.value).toBeNull();
    }
  });

  it("Net Improvement 归一化说明携带 page_updated 快照版本，禁止跨日 baseline 漂移", () => {
    const r = netImprovementRecord(1, "gpt-6-astra");
    expect(r.normalization_method).toContain(PAGE_UPDATED_DISPLAY);
    expect(r.normalization_method).toContain("treatment effect");
  });

  it("资源字段记录：p50_cost_per_task_usd / p50_output_tokens_per_task / page-level price 仅作 benchmark_resource_usage 描述性", () => {
    const r = collection.records.find(
      (rec) =>
        rec.subject_identity.model_display_name === "GPT-6 Astra" &&
        rec.raw_metric.metric_name === "p50_cost_and_output_tokens_per_task",
    )!;
    expect(r.capability).toEqual(["benchmark_resource_usage"]);
    expect(r.raw_metric.metric_direction).toBe("descriptive_only");
    expect(r.raw_metric.aggregates?.p50_cost_per_task_usd).toBe(0.83);
    expect(r.raw_metric.aggregates?.p50_output_tokens_per_task).toBe(1842);
    expect(r.raw_metric.aggregates?.price_per_million_input_usd).toBe(2.5);
    expect(r.raw_metric.aggregates?.price_per_million_output_usd).toBe(10);
    // numerator_and_denominator: p50 是连续量 → not_applicable（不能借 sessions/total_sessions 当计数）
    expect(r.raw_metric.numerator_and_denominator.value).toBeNull();
    expect(r.raw_metric.numerator_and_denominator.status).toBe("not_applicable");
    // categories fixture 原文进入 record note（保证记录自足）
    expect(r.raw_metric.note).toContain("P50 统计");
    expect(r.raw_metric.note).toContain("price_per_million");
    // resource record 显式禁止与 Plan 价格/额度/用户真实成本混算
    expect(r.prohibited_inferences.join("\n")).toContain("Plan 价格");
    expect(r.prohibited_inferences.join("\n")).toContain("price_per_million");
  });

  it("无固定 task set / prompt / 重复次数进入 conditions 与 Unresolved Fact", () => {
    const net = netImprovementRecord(1, "gpt-6-astra");
    expect(net.conditions.prompt_policy).toContain("随机分流");
    expect(net.conditions.prompt_policy).toContain("没有固定 prompt");
    expect(net.conditions.tool_environment).toContain("bash/sandbox");
    expect(net.conditions.success_definition).toContain("treatment effect");
    expect(net.conditions.success_definition).toContain("等权聚合");
    // repeat_count = null + not_applicable（真实用户 session，无 n_trials 概念）
    expect(net.conditions.repeat_count.value).toBeNull();
    expect(net.conditions.repeat_count.status).toBe("not_applicable");
    // context_limit = null + unobtainable
    expect(net.conditions.context_limit_or_context_description.value).toBeNull();
    expect(net.conditions.context_limit_or_context_description.status).toBe("unobtainable");
    // Unresolved Fact 覆盖关键缺口
    const facts = collection.unresolved_facts.map((f) => f.fact).join("\n");
    expect(facts).toContain("没有固定任务集");
    expect(facts).toContain("固定 prompt");
    expect(facts).toContain("CI 计算公式与抽样单位未公开");
    expect(facts).toContain("baseline");
    expect(facts).toContain("API id");
  });

  it("prohibited_inferences 覆盖 research §10 禁止推断：Plan 排名 / 真实成本混算 / 方向同向解释 / 真实用户偏差", () => {
    const text = netImprovementRecord(1, "gpt-6-astra").prohibited_inferences.join("\n");
    expect(text).toContain("Coding Plan 排名");
    expect(text).toContain("Plan 价格");
    expect(text).toContain("真实任务工作流的 P50 统计");
    expect(text).toContain("Tool Hallucination");
    expect(text).toContain("lower_is_better");
    expect(text).toContain("真实用户");
    // Net Improvement 与五类信号的等权聚合关系
    expect(text).toContain("等权聚合");
  });

  it("条款限制（自动化抓取、商业使用张力、robots.txt）写入 license_and_access_notes", () => {
    const notes = collection.benchmark.license_and_access_notes.join("\n");
    expect(notes).toContain("Arena Intelligence, Inc.");
    expect(notes).toContain("程序化或自动化抓取");
    expect(notes).toContain("robots.txt");
    expect(notes).toContain("商业使用");
    expect(notes).toContain("授权申请为待办");
    expect(notes).toContain("reference_only");
    expect(notes).toContain("comparability_scope");
  });

  it("6 个来源全部登记：leaderboard + methodology + help + categories + terms + privacy", () => {
    const ids = collection.sources.map((s) => s.source_id);
    expect(ids).toEqual([
      "arena-agent-leaderboard",
      "arena-agent-methodology",
      "arena-agent-mode-help",
      "arena-agent-categories-cost",
      "arena-agent-terms",
      "arena-agent-privacy",
    ]);
    const byId = new Map(collection.sources.map((s) => [s.source_id, s]));
    expect(byId.get("arena-agent-terms")?.kind).toBe("official_license");
    expect(byId.get("arena-agent-leaderboard")?.kind).toBe("leaderboard_artifact");
    expect(byId.get("arena-agent-leaderboard")?.url).toBe("https://arena.ai/leaderboard/agent");
  });
});
