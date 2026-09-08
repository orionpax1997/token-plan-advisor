import { beforeAll, describe, expect, it } from "vitest";
import { createTerminalBenchAdapter } from "../src/adapters/terminal-bench/adapter.ts";
import { validateBenchmarkCollection, type BenchmarkCollection } from "../src/schema/benchmark.ts";

const CAPTURED_AT = "2026-09-08T06:45:30.000Z"; // fixture manifest captured_at
const COLLECTED_AT = "2026-09-08T08:00:00.000Z"; // 注入时钟
const HUB_UPDATED_AT = "2026-09-03T21:34:07.080891+00:00"; // 页面自述 updated_at
const LEADERBOARD_RELEASE_DATE = "2026-09-03"; // 4-0-0 release date

let collection: BenchmarkCollection;

beforeAll(async () => {
  const adapter = createTerminalBenchAdapter();
  const result = await adapter.collect({ now: () => new Date(COLLECTED_AT) });
  const validation = validateBenchmarkCollection(result);
  if (!validation.ok) {
    throw new Error(`fixture 采集结果未通过 Benchmark Schema 校验:\n${validation.issues.join("\n")}`);
  }
  collection = validation.value;
});

/** 按 agent+model+effort 三元组取记录的辅助。 */
function recordsOf(agent: string, model: string, effort: string): BenchmarkCollection["records"] {
  return collection.records.filter((r) => {
    const subj = r.subject_identity;
    return subj.agent_or_harness.startsWith(agent) && subj.model_display_name === model &&
      subj.reasoning_effort_or_configuration.value === effort;
  });
}

describe("Terminal-Bench 4.0 Adapter（fixture 快照导入）", () => {
  it("采集信封：adapter 标识、fixture 模式、采集/发布/快照三时间戳", () => {
    expect(collection.schema_version).toBe("1");
    expect(collection.collection.adapter_id).toBe("terminal-bench");
    expect(collection.collection.mode).toBe("fixture");
    expect(collection.collection.collected_at).toBe(COLLECTED_AT);
    expect(collection.benchmark.benchmark_id).toBe("terminal-bench");
    expect(collection.benchmark.benchmark_version).toBe("v4.0");
    expect(collection.benchmark.artifact_generated_at).toBe(HUB_UPDATED_AT);
    const hub = collection.sources.find((s) => s.source_id === "terminal-bench-hub");
    expect(hub?.fetched_at).toBe(CAPTURED_AT);
    expect(hub?.last_updated_at).toBe(HUB_UPDATED_AT);
  });

  it("benchmark 版本与 leaderboard revision 固定可见", () => {
    expect(collection.benchmark.benchmark_id).toBe("terminal-bench");
    expect(collection.benchmark.benchmark_version).toBe("v4.0");
    expect(collection.benchmark.leaderboard_or_dataset_revision).toContain("leaderboard=4-0-0");
    expect(collection.benchmark.leaderboard_or_dataset_revision).toContain("dataset=terminal-bench/terminal-bench@4");
    expect(collection.benchmark.leaderboard_or_dataset_revision).toContain("hub_updated_at=");
  });

  it("harness 锁定为 Harbor framework（官方 README 指定）", () => {
    expect(collection.benchmark.harness).toBe("Harbor framework（Terminal-Bench 官方 README 指定）");
    expect(collection.benchmark.maintainer).toContain("Laude Institute");
  });

  it("任务集事实保留：66 任务；页面直接显示的 18 条可见提交", () => {
    expect(collection.task_set.n_tasks).toBe(66);
    expect(collection.task_set.n_repositories).toBe(0); // 任务级而非仓库级
    expect(collection.task_set.languages).toEqual([]); // 页面未公开任务语言分布
  });

  it("18 条可见提交 × 2 记录（accuracy / 资源）= 36 条", () => {
    expect(collection.records).toHaveLength(36);
    // 配置三元组去重：18 个不同 (agent, model, effort) 组合
    const configs = new Set(
      collection.records.map(
        (r) =>
          r.subject_identity.agent_or_harness +
          ":" +
          r.subject_identity.model_display_name +
          ":" +
          r.subject_identity.reasoning_effort_or_configuration.value,
      ),
    );
    expect(configs.size).toBe(18);
    // 每个配置正好 2 条记录（accuracy + resource_usage）
    for (const config of configs) {
      const records = collection.records.filter(
        (r) =>
          r.subject_identity.agent_or_harness +
            ":" +
            r.subject_identity.model_display_name +
            ":" +
            r.subject_identity.reasoning_effort_or_configuration.value ===
          config,
      );
      expect(records.map((r) => r.raw_metric.metric_name).sort()).toEqual(["accuracy", "tokens_cost_aggregates"]);
    }
  });

  it("Agent/Model/Effort 三元组全部进入 conditions，不同 effort 不被合并", () => {
    // 同一 Model 不同 effort 应该是不同 record
    const gpt6Astra = collection.records.filter(
      (r) => r.subject_identity.model_display_name === "GPT-6 Astra" && r.raw_metric.metric_name === "accuracy",
    );
    const efforts = gpt6Astra.map((r) => r.subject_identity.reasoning_effort_or_configuration.value).sort();
    // Codex 的 5 个 effort（low/medium/high/xhigh/max）独立成 5 条记录
    expect(efforts).toEqual(["high", "low", "max", "medium", "xhigh"]);
    // record_id 中三元组清晰可见
    const ids = gpt6Astra.map((r) => r.record_id);
    for (const id of ids) {
      expect(id).toContain("Codex");
      expect(id).toContain("GPT-6 Astra");
    }
    // 同一 Agent 不同 Model（如 Claude Code: Fable 5.1 / Opus 5 / Fable 5 / Opus 4.8 / GLM-5.3 / Sonnet 5）独立
    const claudeCode = new Set(
      collection.records
        .filter((r) => r.subject_identity.agent_or_harness.startsWith("Claude Code"))
        .map((r) => r.subject_identity.model_display_name),
    );
    expect(claudeCode.size).toBe(6);
  });

  it("accuracy 与 accuracy_ci95_half_width 原样保存（Codex GPT-6 Astra max = 58.2% ± 2.8%）", () => {
    const r = recordsOf("Codex", "GPT-6 Astra", "max").find((rec) => rec.raw_metric.metric_name === "accuracy")!;
    expect(r.capability).toEqual(["terminal_agent_completion"]);
    expect(r.raw_metric.metric_value).toBeCloseTo(0.582, 6);
    expect(r.raw_metric.metric_unit).toBe("ratio");
    expect(r.raw_metric.metric_direction).toBe("higher_is_better");
    // CI 字段：半宽 ± 0.028，method 记录字段名与未公开事实
    const ci = r.raw_metric.confidence_interval_or_error.value as {
      ci_low: number;
      ci_high: number;
      half_width: number;
      method: string;
    };
    expect(ci.half_width).toBe(0.028);
    expect(ci.ci_low).toBeCloseTo(0.554, 6);
    expect(ci.ci_high).toBeCloseTo(0.610, 6);
    expect(ci.method).toContain("Harbor Hub 字段 accuracy_ci95_half_width");
    expect(ci.method).toContain("未公开");
    expect(r.confidence_status).toBe("confidence_interval_reported");
    expect(r.evidence_level).toBe("A");
    expect(r.comparability_class).toBe("direct_same_config");
    expect(r.allowed_use).toBe("scoring");
  });

  it("缺失的 n_trials / accuracy 公式 / 完整 prompt / tool schema / 模型 snapshot 显式 null + unobtainable", () => {
    const r = collection.records.find((rec) => rec.raw_metric.metric_name === "accuracy")!;
    // n_trials / 分子分母：unobtainable
    expect(r.conditions.repeat_count.value).toBeNull();
    expect(r.conditions.repeat_count.status).toBe("unobtainable");
    expect(r.raw_metric.numerator_and_denominator.value).toBeNull();
    expect(r.raw_metric.numerator_and_denominator.status).toBe("unobtainable");
    // 上下文窗口：unobtainable
    expect(r.conditions.context_limit_or_context_description.value).toBeNull();
    expect(r.conditions.context_limit_or_context_description.status).toBe("unobtainable");
    // 模型 API ID：unobtainable
    expect(r.subject_identity.model_api_id_or_snapshot.value).toBeNull();
    expect(r.subject_identity.model_api_id_or_snapshot.status).toBe("unobtainable");
    // cost_basis：unobtainable（页面 Cost 列口径未公开）
    expect(r.conditions.cost_and_token_metadata.cost_basis.value).toBeNull();
    expect(r.conditions.cost_and_token_metadata.cost_basis.status).toBe("unobtainable");
  });

  it("accuracy 不由 CI 反推；分子分母 null 不编造；进入 Unresolved Facts", () => {
    const facts = collection.unresolved_facts.map((f) => f.fact).join("\n");
    expect(facts).toContain("n_trials");
    expect(facts).toContain("accuracy_ci95_half_width");
    expect(facts).toContain("accuracy");
    expect(facts).toContain("API model id");
    expect(facts).toContain("Cost");
  });

  it("normalized_metric 只在同一 Terminal-Bench 4.0 release 指标空间内生成，方法可追溯", () => {
    for (const r of collection.records) {
      if (r.raw_metric.metric_name === "accuracy") {
        expect(r.normalized_metric?.metric_space).toBe("terminal-bench:v4.0:accuracy");
        expect(r.normalized_metric?.value).toBe(r.raw_metric.metric_value);
        expect(r.normalization_method).toContain("identity");
        expect(r.normalization_method).toContain("Terminal-Bench 4.0 release");
      } else {
        expect(r.normalized_metric).toBeNull();
        expect(r.normalization_method).toContain("none");
      }
    }
  });

  it("Tokens/Cost 仅归入 benchmark_resource_usage 描述性信号，不进 ranking", () => {
    const r = recordsOf("Codex", "GPT-6 Astra", "max").find(
      (rec) => rec.raw_metric.metric_name === "tokens_cost_aggregates",
    )!;
    expect(r.capability).toEqual(["benchmark_resource_usage"]);
    expect(r.allowed_use).toBe("explanation");
    expect(r.comparability_class).toBe("reference_only");
    expect(r.raw_metric.metric_direction).toBe("descriptive_only");
    // 资源聚合逐键透传
    expect(r.raw_metric.aggregates?.tokens).toBe(1500000000);
    expect(r.raw_metric.aggregates?.cost).toBe(3300);
    // 禁止推断：不与 Plan 价格额度混算
    const text = r.prohibited_inferences.join("\n");
    expect(text).toContain("不得把页面 Tokens/Cost 与 Plan 价格、额度、用户真实成本混算");
  });

  it("Vendor：采用页面 model_org 作为可核验值（OpenAI/Anthropic/xAI/Google/Z.ai）", () => {
    const codex = recordsOf("Codex", "GPT-6 Astra", "max")[0]!;
    expect(codex.subject_identity.vendor).toEqual({
      value: "OpenAI",
      status: "verified",
      source_ids: ["terminal-bench-hub"],
    });
    // Anthropic agent + Z.ai model：agent_org ≠ model_org
    const glm = recordsOf("Claude Code", "GLM-5.3", "max")[0]!;
    expect(glm.subject_identity.vendor.value).toBe("Z.ai");
    expect(glm.subject_identity.agent_or_harness).toContain("agent_org=Anthropic");
  });

  it("prohibited_inferences 覆盖：Plan 成功率 / 跨 leaderboard / 跨 effort / 跨 benchmark 换算 / 模型标签反推", () => {
    const r = collection.records.find((rec) => rec.raw_metric.metric_name === "accuracy")!;
    const text = r.prohibited_inferences.join("\n");
    expect(text).toContain("不得把 accuracy");
    expect(text).toContain("不得跨 leaderboard revision");
    expect(text).toContain("不得把同一 Model 的不同 effort");
    expect(text).toContain("不得跨 benchmark");
    expect(text).toContain("不得以模型展示名或结果反推");
    expect(text).toContain("不得把页面 ± accuracy_ci95_half_width 直接解释为严格的统计显著性");
  });

  it("success_definition 进入 conditions（页面 Harbor 测试脚本与 reward.txt/json 描述）", () => {
    const r = collection.records.find((rec) => rec.raw_metric.metric_name === "accuracy")!;
    expect(r.conditions.success_definition).toContain("/logs/verifier/reward.txt");
    expect(r.conditions.success_definition).toContain("Harbor");
    expect(r.conditions.success_definition).toContain("未公开 Terminal-Bench 4.0 的 accuracy 分母");
  });

  it("来源引用与许可/访问说明保留", () => {
    const ids = collection.sources.map((s) => s.source_id);
    expect(ids).toContain("terminal-bench-hub");
    expect(ids).toContain("terminal-bench-readme");
    expect(ids).toContain("terminal-bench-license");
    expect(collection.benchmark.license_and_access_notes.join("\n")).toContain("Apache License 2.0");
    expect(collection.benchmark.license_and_access_notes.join("\n")).toContain("continuous benchmark");
  });

  it("leaderboard release date 2026-09-03 与 hub updated_at 同时保留", () => {
    expect(collection.benchmark.leaderboard_or_dataset_revision).toContain("leaderboard=4-0-0");
    // release date 出现在 license notes
    expect(collection.benchmark.license_and_access_notes.join("\n")).toContain("2026-09-03");
  });
});
